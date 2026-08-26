from __future__ import annotations

import httpx

from api.jobs.manager import JobContext
from api.main import create_app


async def _echo(params: dict, ctx: JobContext) -> dict:
    await ctx.progress(100, "ok")
    return {"echo": params["v"]}


async def test_dorks_library_route():
    app = create_app()
    async with app.router.lifespan_context(app):
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
            resp = await c.get("/api/dorks/library")
    assert resp.status_code == 200
    assert "generic" in resp.json()["categories"]


async def test_job_lifecycle_route():
    app = create_app()
    async with app.router.lifespan_context(app):
        app.state.manager.handlers["echo"] = _echo
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
            resp = await c.post("/api/jobs", json={"type": "echo", "params": {"v": 5}})
            assert resp.status_code == 200
            job_id = resp.json()["id"]
            await app.state.manager.wait(job_id)
            got = await c.get(f"/api/jobs/{job_id}")
            listed = await c.get("/api/jobs")
    body = got.json()
    assert body["status"] == "done"
    assert body["result"] == {"echo": 5}
    assert len(listed.json()) == 1


async def test_create_unknown_type_returns_400():
    app = create_app()
    async with app.router.lifespan_context(app):
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
            resp = await c.post("/api/jobs", json={"type": "does-not-exist", "params": {}})
    assert resp.status_code == 400


async def test_get_missing_job_returns_404():
    app = create_app()
    async with app.router.lifespan_context(app):
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
            resp = await c.get("/api/jobs/999")
    assert resp.status_code == 404
