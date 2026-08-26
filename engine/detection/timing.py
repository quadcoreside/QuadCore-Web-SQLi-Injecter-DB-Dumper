from __future__ import annotations

import time

from engine.detection.base import DetectionResult
from engine.detection.signatures import has_sql_error
from engine.http.client import AsyncHttpClient
from engine.models import InjectionPoint, Technique
from engine.target import build_url


class TimeDetector:
    """Détection time-blind : ``AND SLEEP(n)`` retarde la réponse par rapport à une
    requête de référence (``SLEEP(0)``). Robuste quand error/boolean sont muets."""

    def __init__(self, delay_seconds: int = 5, threshold_ratio: float = 0.6) -> None:
        self.delay_seconds = delay_seconds
        self.threshold_ratio = threshold_ratio

    async def _timed_get(self, client: AsyncHttpClient, url: str) -> tuple[str, float]:
        start = time.perf_counter()
        resp = await client.get(url)
        return resp.text, time.perf_counter() - start

    async def detect(
        self, client: AsyncHttpClient, point: InjectionPoint
    ) -> DetectionResult | None:
        base_text, base_elapsed = await self._timed_get(
            client, build_url(point, "AND SLEEP(0)")
        )
        if has_sql_error(base_text):
            return None
        _, probe_elapsed = await self._timed_get(
            client, build_url(point, f"AND SLEEP({self.delay_seconds})")
        )
        if probe_elapsed - base_elapsed >= self.delay_seconds * self.threshold_ratio:
            return DetectionResult(
                technique=Technique.TIME,
                point=point,
                confidence=0.8,
                details=f"Délai observé {probe_elapsed - base_elapsed:.1f}s",
            )
        return None
