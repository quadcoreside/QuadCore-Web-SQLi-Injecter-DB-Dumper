from __future__ import annotations

import json
from dataclasses import dataclass
from enum import StrEnum
from typing import Any

import aiosqlite


class JobStatus(StrEnum):
    QUEUED = "queued"
    RUNNING = "running"
    DONE = "done"
    ERROR = "error"
    CANCELLED = "cancelled"


@dataclass
class Job:
    id: int
    type: str
    status: str
    params: dict[str, Any]
    progress: float
    message: str
    result: Any
    error: str | None
    created_at: str
    updated_at: str


_SCHEMA = """
CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    params TEXT NOT NULL,
    progress REAL NOT NULL DEFAULT 0,
    message TEXT NOT NULL DEFAULT '',
    result TEXT,
    error TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
"""


class JobStore:
    """Persistance SQLite des jobs (aiosqlite). Sérialise params/result en JSON."""

    def __init__(self, path: str) -> None:
        self.path = path
        self._db: aiosqlite.Connection | None = None

    async def connect(self) -> None:
        self._db = await aiosqlite.connect(self.path)
        self._db.row_factory = aiosqlite.Row
        await self._db.executescript(_SCHEMA)
        await self._db.commit()

    async def close(self) -> None:
        if self._db is not None:
            await self._db.close()
            self._db = None

    @property
    def db(self) -> aiosqlite.Connection:
        assert self._db is not None, "JobStore non connecté (appeler connect())"
        return self._db

    async def create(self, job_type: str, params: dict[str, Any]) -> int:
        cur = await self.db.execute(
            "INSERT INTO jobs (type, status, params) VALUES (?, ?, ?)",
            (job_type, JobStatus.QUEUED, json.dumps(params)),
        )
        await self.db.commit()
        assert cur.lastrowid is not None
        return cur.lastrowid

    async def set_status(self, job_id: int, status: JobStatus) -> None:
        await self.db.execute(
            "UPDATE jobs SET status=?, updated_at=datetime('now') WHERE id=?",
            (status, job_id),
        )
        await self.db.commit()

    async def set_progress(self, job_id: int, progress: float, message: str) -> None:
        await self.db.execute(
            "UPDATE jobs SET progress=?, message=?, updated_at=datetime('now') WHERE id=?",
            (progress, message, job_id),
        )
        await self.db.commit()

    async def set_result(self, job_id: int, result: Any) -> None:
        await self.db.execute(
            "UPDATE jobs SET result=?, updated_at=datetime('now') WHERE id=?",
            (json.dumps(result), job_id),
        )
        await self.db.commit()

    async def set_error(self, job_id: int, error: str) -> None:
        await self.db.execute(
            "UPDATE jobs SET error=?, status=?, updated_at=datetime('now') WHERE id=?",
            (error, JobStatus.ERROR, job_id),
        )
        await self.db.commit()

    async def get(self, job_id: int) -> Job | None:
        cur = await self.db.execute("SELECT * FROM jobs WHERE id=?", (job_id,))
        row = await cur.fetchone()
        return self._row_to_job(row) if row else None

    async def list(self) -> list[Job]:
        cur = await self.db.execute("SELECT * FROM jobs ORDER BY id DESC")
        rows = await cur.fetchall()
        return [self._row_to_job(r) for r in rows]

    @staticmethod
    def _row_to_job(row: aiosqlite.Row) -> Job:
        return Job(
            id=row["id"],
            type=row["type"],
            status=row["status"],
            params=json.loads(row["params"]),
            progress=row["progress"],
            message=row["message"],
            result=json.loads(row["result"]) if row["result"] else None,
            error=row["error"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )
