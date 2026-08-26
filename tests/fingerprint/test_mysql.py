from __future__ import annotations

from engine.fingerprint.mysql import Fingerprint, fingerprint
from tests.helpers.fake_reader import FakeReader


async def test_fingerprint_reads_version_user_database():
    reader = FakeReader(version="8.0.32", user="root@localhost", database="app")
    fp = await fingerprint(reader)
    assert fp == Fingerprint(version="8.0.32", user="root@localhost", database="app")
