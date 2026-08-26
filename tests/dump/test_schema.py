from __future__ import annotations

from engine.dump.schema import list_columns, list_databases, list_tables
from tests.helpers.fake_reader import FakeReader


def _reader():
    return FakeReader(
        schemas={
            "shopdb": {
                "users": {"columns": ["id", "email", "pass"], "rows": []},
                "orders": {"columns": ["id", "total"], "rows": []},
            },
            "cms": {"pages": {"columns": ["slug"], "rows": []}},
        }
    )


async def test_list_databases():
    assert set(await list_databases(_reader())) == {"shopdb", "cms"}


async def test_list_tables():
    assert set(await list_tables(_reader(), "shopdb")) == {"users", "orders"}


async def test_list_columns():
    assert await list_columns(_reader(), "shopdb", "users") == ["id", "email", "pass"]
