from __future__ import annotations

from typing import Protocol, runtime_checkable


@runtime_checkable
class Tamper(Protocol):
    def apply(self, payload: str) -> str: ...


def apply_chain(payload: str, chain: list[Tamper]) -> str:
    for tamper in chain:
        payload = tamper.apply(payload)
    return payload
