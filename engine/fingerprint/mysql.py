from __future__ import annotations

from dataclasses import dataclass

from engine.exploit.reader import ValueReader


@dataclass
class Fingerprint:
    version: str
    user: str
    database: str


async def fingerprint(reader: ValueReader) -> Fingerprint:
    """Récupère version / utilisateur / base courante via n'importe quel ValueReader."""
    return Fingerprint(
        version=await reader.read("version()"),
        user=await reader.read("current_user()"),
        database=await reader.read("database()"),
    )
