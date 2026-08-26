from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable
from typing import Any

from api.jobs.store import JobStatus, JobStore


class JobContext:
    """Passé aux handlers pour publier la progression (persistée + diffusée en WS)."""

    def __init__(self, manager: JobManager, job_id: int) -> None:
        self._manager = manager
        self._job_id = job_id

    async def progress(self, percent: float, message: str = "") -> None:
        await self._manager.report(self._job_id, percent, message)


Handler = Callable[[dict[str, Any], JobContext], Awaitable[Any]]


class JobManager:
    """Exécute les jobs comme des tâches asyncio, persiste leur état et diffuse la
    progression aux abonnés WebSocket. Annulation coopérative via ``cancel``."""

    def __init__(self, store: JobStore, handlers: dict[str, Handler]) -> None:
        self.store = store
        self.handlers = handlers
        self._tasks: dict[int, asyncio.Task[None]] = {}
        self._subscribers: dict[int, set[asyncio.Queue[Any]]] = {}

    async def create(self, job_type: str, params: dict[str, Any]) -> int:
        if job_type not in self.handlers:
            raise ValueError(f"type de job inconnu : {job_type}")
        job_id = await self.store.create(job_type, params)
        self._tasks[job_id] = asyncio.create_task(self._run(job_id, job_type, params))
        return job_id

    async def _run(self, job_id: int, job_type: str, params: dict[str, Any]) -> None:
        await self.store.set_status(job_id, JobStatus.RUNNING)
        await self._broadcast(job_id, {"event": "status", "status": JobStatus.RUNNING})
        ctx = JobContext(self, job_id)
        try:
            result = await self.handlers[job_type](params, ctx)
            await self.store.set_result(job_id, result)
            await self.store.set_progress(job_id, 100.0, "terminé")
            await self.store.set_status(job_id, JobStatus.DONE)
            await self._broadcast(job_id, {"event": "done", "result": result})
        except asyncio.CancelledError:
            await self.store.set_status(job_id, JobStatus.CANCELLED)
            await self._broadcast(job_id, {"event": "cancelled"})
        except Exception as exc:  # noqa: BLE001 - on veut journaliser toute erreur de job
            await self.store.set_error(job_id, repr(exc))
            await self._broadcast(job_id, {"event": "error", "error": repr(exc)})
        finally:
            self._tasks.pop(job_id, None)
            await self._broadcast(job_id, None)  # sentinelle : ferme les abonnés

    async def report(self, job_id: int, percent: float, message: str) -> None:
        await self.store.set_progress(job_id, percent, message)
        await self._broadcast(
            job_id, {"event": "progress", "progress": percent, "message": message}
        )

    def cancel(self, job_id: int) -> bool:
        task = self._tasks.get(job_id)
        if task is None:
            return False
        task.cancel()
        return True

    def subscribe(self, job_id: int) -> asyncio.Queue[Any]:
        queue: asyncio.Queue[Any] = asyncio.Queue()
        self._subscribers.setdefault(job_id, set()).add(queue)
        return queue

    def unsubscribe(self, job_id: int, queue: asyncio.Queue[Any]) -> None:
        subs = self._subscribers.get(job_id)
        if subs is not None:
            subs.discard(queue)

    async def _broadcast(self, job_id: int, event: Any) -> None:
        for queue in list(self._subscribers.get(job_id, set())):
            queue.put_nowait(event)

    async def wait(self, job_id: int) -> None:
        """Attend la fin d'un job (utilitaire de test)."""
        task = self._tasks.get(job_id)
        if task is not None:
            await asyncio.gather(task, return_exceptions=True)
