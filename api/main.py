from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.config import settings
from api.jobs.handlers import HANDLERS
from api.jobs.manager import JobManager
from api.jobs.store import JobStore
from api.routes import router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    store = JobStore(settings.db_path)
    await store.connect()
    app.state.settings = settings
    app.state.store = store
    app.state.manager = JobManager(store, HANDLERS)
    try:
        yield
    finally:
        await store.close()


def create_app() -> FastAPI:
    app = FastAPI(title="QuadCore SQLi", version="2.0.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(router)
    return app


app = create_app()
