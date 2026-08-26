from __future__ import annotations

from api.jobs.store import JobStatus, JobStore


async def _store() -> JobStore:
    store = JobStore(":memory:")
    await store.connect()
    return store


async def test_store_create_update_get():
    store = await _store()
    job_id = await store.create("scan", {"url": "http://x/p?id=1"})
    job = await store.get(job_id)
    assert job is not None
    assert job.status == JobStatus.QUEUED
    assert job.params == {"url": "http://x/p?id=1"}

    await store.set_status(job_id, JobStatus.RUNNING)
    await store.set_progress(job_id, 42.0, "en cours")
    await store.set_result(job_id, {"findings": [1, 2]})
    await store.set_status(job_id, JobStatus.DONE)

    job = await store.get(job_id)
    assert job is not None
    assert job.status == JobStatus.DONE
    assert job.progress == 42.0
    assert job.message == "en cours"
    assert job.result == {"findings": [1, 2]}
    await store.close()


async def test_store_error_and_list():
    store = await _store()
    job_id = await store.create("dork", {})
    await store.set_error(job_id, "boom")
    job = await store.get(job_id)
    assert job is not None
    assert job.status == JobStatus.ERROR
    assert job.error == "boom"
    assert len(await store.list()) == 1
    assert await store.get(999) is None
    await store.close()
