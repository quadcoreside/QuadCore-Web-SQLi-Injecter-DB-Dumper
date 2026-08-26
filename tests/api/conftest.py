from __future__ import annotations

from collections.abc import Iterator

import pytest

from api.config import settings


@pytest.fixture(autouse=True)
def memory_db() -> Iterator[None]:
    """Force chaque test API à utiliser une base SQLite en mémoire, isolée."""
    old = settings.db_path
    settings.db_path = ":memory:"
    yield
    settings.db_path = old
