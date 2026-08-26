from __future__ import annotations

import asyncio

import pytest

from api.jobs.manager import JobContext, JobManager
from api.jobs.store import JobStore


async def _store() -> JobStore:
    store = JobStore(":memory:")
    await store.connect()
    return store


async def test_manager_runs_reports_and_persists():
    store = await _store()

    async def handler(params: dict, ctx: JobContext) -> dict:
        await ctx.progress(50, "moitié")
        return {"echo": params["x"]}

    manager = JobManager(store, {"echo": handler})
    job_id = await manager.create("echo", {"x": 7})
    await manager.wait(job_id)

    job = await store.get(job_id)
    assert job is not None
    assert job.status == "done"
    assert job.result == {"echo": 7}
    assert job.progress == 100.0
    await store.close()


async def test_manager_unknown_type_raises():
    store = await _store()
    manager = JobManager(store, {})
    with pytest.raises(ValueError):
        await manager.create("nope", {})
    await store.close()


async def test_manager_cancel():
    store = await _store()
    started = asyncio.Event()

    async def slow(params: dict, ctx: JobContext) -> None:
        started.set()
        await asyncio.sleep(30)

    manager = JobManager(store, {"slow": slow})
    job_id = await manager.create("slow", {})
    await started.wait()
    assert manager.cancel(job_id) is True
    await manager.wait(job_id)
    job = await store.get(job_id)
    assert job is not None
    assert job.status == "cancelled"
    await store.close()


async def test_manager_records_errors():
    store = await _store()

    async def boom(params: dict, ctx: JobContext) -> None:
        raise RuntimeError("kaboom")

    manager = JobManager(store, {"boom": boom})
    job_id = await manager.create("boom", {})
    await manager.wait(job_id)
    job = await store.get(job_id)
    assert job is not None
    assert job.status == "error"
    assert "kaboom" in (job.error or "")
    await store.close()


async def test_manager_broadcast_to_subscriber():
    store = await _store()
    manager = JobManager(store, {})
    queue = manager.subscribe(1)
    await manager._broadcast(1, {"event": "progress", "progress": 10})
    assert await queue.get() == {"event": "progress", "progress": 10}
    await store.close()
