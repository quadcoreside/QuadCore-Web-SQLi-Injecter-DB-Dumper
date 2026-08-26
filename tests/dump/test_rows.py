from __future__ import annotations

from engine.dump.rows import count_rows, dump_rows
from tests.helpers.fake_reader import FakeReader


def _reader():
    return FakeReader(
        schemas={
            "shopdb": {
                "users": {
                    "columns": ["id", "email", "pass"],
                    "rows": [
                        {"id": "1", "email": "a@x.tld", "pass": "secret1"},
                        {"id": "2", "email": "b@y.tld", "pass": "secret2"},
                        {"id": "3", "email": "c@z.tld", "pass": "secret3"},
                    ],
                }
            }
        }
    )


async def test_count_rows():
    assert await count_rows(_reader(), "shopdb", "users") == 3


async def test_dump_rows_returns_all_in_order():
    rows = await dump_rows(_reader(), "shopdb", "users", ["id", "email", "pass"])
    assert rows == [
        {"id": "1", "email": "a@x.tld", "pass": "secret1"},
        {"id": "2", "email": "b@y.tld", "pass": "secret2"},
        {"id": "3", "email": "c@z.tld", "pass": "secret3"},
    ]


async def test_dump_rows_resume_and_callback():
    seen: list[int] = []
    rows = await dump_rows(
        _reader(),
        "shopdb",
        "users",
        ["id", "email"],
        start=2,
        on_row=lambda i, r: seen.append(i),
    )
    assert seen == [2]
    assert rows == [{"id": "3", "email": "c@z.tld"}]
