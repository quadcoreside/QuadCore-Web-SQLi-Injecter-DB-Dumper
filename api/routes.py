from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Header, HTTPException, Request, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from api.jobs.manager import JobManager
from api.jobs.store import Job, JobStore
from api.security import host_in_scope, parse_allowlist
from engine.dorks.library import DorkLibrary

router = APIRouter(prefix="/api")


class CreateJob(BaseModel):
    type: str
    params: dict[str, Any] = {}


def _store(request: Request) -> JobStore:
    return request.app.state.store


def _manager(request: Request) -> JobManager:
    return request.app.state.manager


def _check_token(request: Request, token: str | None) -> None:
    expected = request.app.state.settings.token
    if expected and token != expected:
        raise HTTPException(status_code=401, detail="token invalide")


def _check_scope(request: Request, body: CreateJob) -> None:
    """Refuse les jobs scan/dump dont la cible sort du périmètre autorisé (si défini)."""
    if body.type not in ("scan", "dump"):
        return
    allowlist = parse_allowlist(request.app.state.settings.scope_allowlist)
    url = body.params.get("url")
    if isinstance(url, str) and not host_in_scope(url, allowlist):
        raise HTTPException(status_code=403, detail="cible hors périmètre autorisé")


def _job_dict(job: Job) -> dict[str, Any]:
    return {
        "id": job.id,
        "type": job.type,
        "status": job.status,
        "progress": job.progress,
        "message": job.message,
        "result": job.result,
        "error": job.error,
        "params": job.params,
        "created_at": job.created_at,
        "updated_at": job.updated_at,
    }


@router.post("/jobs")
async def create_job(
    body: CreateJob, request: Request, x_token: str | None = Header(default=None)
) -> dict[str, int]:
    _check_token(request, x_token)
    _check_scope(request, body)
    try:
        job_id = await _manager(request).create(body.type, body.params)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"id": job_id}


@router.get("/jobs")
async def list_jobs(request: Request) -> list[dict[str, Any]]:
    return [_job_dict(j) for j in await _store(request).list()]


@router.get("/jobs/{job_id}")
async def get_job(job_id: int, request: Request) -> dict[str, Any]:
    job = await _store(request).get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="job introuvable")
    return _job_dict(job)


@router.post("/jobs/{job_id}/cancel")
async def cancel_job(job_id: int, request: Request) -> dict[str, bool]:
    if not _manager(request).cancel(job_id):
        raise HTTPException(status_code=409, detail="job non actif")
    return {"cancelled": True}


@router.get("/dorks/library")
async def dorks_library() -> dict[str, dict[str, list[str]]]:
    lib = DorkLibrary()
    return {"categories": {c: lib.category(c) for c in lib.categories()}}


@router.websocket("/jobs/{job_id}/stream")
async def stream_job(websocket: WebSocket, job_id: int) -> None:
    await websocket.accept()
    manager: JobManager = websocket.app.state.manager
    queue = manager.subscribe(job_id)
    try:
        while True:
            event = await queue.get()
            if event is None:
                break
            await websocket.send_json(event)
    except WebSocketDisconnect:
        pass
    finally:
        manager.unsubscribe(job_id, queue)
