"""Doublures en mémoire pour tester la logique d'extraction sans réseau.

- :class:`FakeReader` implémente ``ValueReader`` en évaluant les expressions produites
  par ``engine.fingerprint`` / ``engine.dump`` sur un modèle de base en mémoire.
- :class:`FakeStringOracle` implémente ``Oracle`` en répondant aux conditions
  ``length``/``ascii(substring(...))`` sur une valeur unique (pour ``BlindReader``).
"""

from __future__ import annotations

import re

from engine.dump.rows import ROW_SEP


def _decode_hex_arg(expr: str, key: str) -> str:
    m = re.search(rf"{key}=0x([0-9a-fA-F]+)", expr)
    if not m:
        raise ValueError(f"clé {key} absente de {expr!r}")
    return bytes.fromhex(m.group(1)).decode()


class FakeReader:
    def __init__(
        self,
        *,
        version: str = "5.7.40-log",
        user: str = "app@localhost",
        database: str = "shopdb",
        schemas: dict[str, dict[str, dict[str, object]]] | None = None,
    ) -> None:
        self.version = version
        self.user = user
        self.database = database
        self.schemas = schemas or {}

    async def read(self, expr: str) -> str:
        low = expr.lower()
        if "version()" in low:
            return self.version
        if "current_user()" in low or "user()" in low:
            return self.user
        if "database()" in low:
            return self.database
        if "schema_name" in low:
            return ",".join(self.schemas)
        if "column_name" in low:
            db = _decode_hex_arg(expr, "table_schema")
            table = _decode_hex_arg(expr, "table_name")
            return ",".join(self.schemas[db][table]["columns"])  # type: ignore[arg-type]
        if "table_name" in low:
            db = _decode_hex_arg(expr, "table_schema")
            return ",".join(self.schemas.get(db, {}))
        db, table = self._from_table(expr)
        if "count(*)" in low:
            return str(len(self.schemas[db][table]["rows"]))  # type: ignore[arg-type]
        if "concat_ws" in low:
            index = int(re.search(r"limit\s+(\d+),1", low).group(1))  # type: ignore[union-attr]
            columns = re.findall(r"ifnull\((\w+),", expr)
            row = self.schemas[db][table]["rows"][index]  # type: ignore[index]
            return ROW_SEP.join(str(row.get(c, "")) for c in columns)  # type: ignore[union-attr]
        raise ValueError(f"expression non gérée : {expr!r}")

    @staticmethod
    def _from_table(expr: str) -> tuple[str, str]:
        m = re.search(r"from\s+(\w+)\.(\w+)", expr)
        if not m:
            raise ValueError(f"table absente de {expr!r}")
        return m.group(1), m.group(2)


class FakeStringOracle:
    def __init__(self, value: str) -> None:
        self.value = value

    async def is_true(self, condition: str) -> bool:
        m = re.fullmatch(r"length\(\((.+)\)\)>(\d+)", condition, re.IGNORECASE)
        if m:
            return len(self.value) > int(m.group(2))
        m = re.fullmatch(
            r"ascii\(substring\(\((.+)\),(\d+),1\)\)>(\d+)", condition, re.IGNORECASE
        )
        if m:
            pos, threshold = int(m.group(2)), int(m.group(3))
            char = self.value[pos - 1] if 0 < pos <= len(self.value) else "\x00"
            return ord(char) > threshold
        raise ValueError(f"condition non gérée : {condition!r}")
