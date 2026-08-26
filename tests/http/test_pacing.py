from __future__ import annotations

import asyncio
import time

from engine.http.pacing import RateLimiter


async def test_noop_when_delay_zero():
    rl = RateLimiter(per_host_delay=0.0)
    start = time.perf_counter()
    await rl.acquire("http://a/1")
    await rl.acquire("http://a/2")
    assert time.perf_counter() - start < 0.05


async def test_serializes_same_host_with_delay():
    rl = RateLimiter(per_host_delay=0.1)
    start = time.perf_counter()
    await asyncio.gather(
        rl.acquire("http://a/1"),
        rl.acquire("http://a/2"),
        rl.acquire("http://a/3"),
    )
    # 3 requêtes même host, 2 délais mini de 0.1s appliqués séquentiellement
    assert time.perf_counter() - start >= 0.18


async def test_different_hosts_not_blocked():
    rl = RateLimiter(per_host_delay=0.2)
    start = time.perf_counter()
    await asyncio.gather(rl.acquire("http://a/1"), rl.acquire("http://b/1"))
    assert time.perf_counter() - start < 0.1
