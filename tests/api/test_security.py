from __future__ import annotations

import httpx

from api.config import settings
from api.main import create_app
from api.security import host_in_scope, parse_allowlist


def test_parse_allowlist_trims_and_drops_empty():
    assert parse_allowlist("a.com, *.b.com ,") == ["a.com", "*.b.com"]


def test_host_in_scope_empty_allows_all():
    assert host_in_scope("http://anything.tld/x?id=1", []) is True


def test_host_in_scope_exact_subdomain_and_glob():
    allow = ["example.com", "*.internal.lan"]
    assert host_in_scope("http://example.com/p?id=1", allow) is True
    assert host_in_scope("http://shop.example.com/p?id=1", allow) is True
    assert host_in_scope("http://api.internal.lan/p?id=1", allow) is True
    assert host_in_scope("http://evil.tld/p?id=1", allow) is False


async def test_create_job_out_of_scope_returns_403():
    app = create_app()
    old = settings.scope_allowlist
    settings.scope_allowlist = "example.com"
    try:
        async with app.router.lifespan_context(app):
            transport = httpx.ASGITransport(app=app)
            async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
                resp = await c.post(
                    "/api/jobs",
                    json={"type": "scan", "params": {"url": "http://evil.tld/p?id=1"}},
                )
        assert resp.status_code == 403
    finally:
        settings.scope_allowlist = old


async def test_create_job_in_scope_allowed():
    app = create_app()
    old = settings.scope_allowlist
    settings.scope_allowlist = "example.com"
    try:
        async with app.router.lifespan_context(app):
            original = app.state.manager.handlers.get("scan")

            async def _stub(params: dict, ctx: object) -> dict:
                return {"ok": True}

            app.state.manager.handlers["scan"] = _stub  # type: ignore[assignment]
            try:
                transport = httpx.ASGITransport(app=app)
                async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
                    resp = await c.post(
                        "/api/jobs",
                        json={
                            "type": "scan",
                            "params": {"url": "http://shop.example.com/p?id=1"},
                        },
                    )
                    assert resp.status_code == 200
                    await app.state.manager.wait(resp.json()["id"])
            finally:
                if original is not None:
                    app.state.manager.handlers["scan"] = original
    finally:
        settings.scope_allowlist = old
