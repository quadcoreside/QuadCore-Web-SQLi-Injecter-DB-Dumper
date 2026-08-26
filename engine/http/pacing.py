from __future__ import annotations

import asyncio
import random
from urllib.parse import urlparse


class RateLimiter:
    """Politesse par-host : au plus une requête toutes `per_host_delay` secondes
    (+ jitter aléatoire) pour un même host. No-op si le délai est nul."""

    def __init__(self, per_host_delay: float = 0.0, jitter: float = 0.0) -> None:
        self.per_host_delay = per_host_delay
        self.jitter = jitter
        self._last: dict[str, float] = {}
        self._locks: dict[str, asyncio.Lock] = {}

    @staticmethod
    def _host(url: str) -> str:
        return urlparse(url).netloc

    async def acquire(self, url: str) -> None:
        if self.per_host_delay <= 0:
            return
        host = self._host(url)
        lock = self._locks.setdefault(host, asyncio.Lock())
        async with lock:
            loop = asyncio.get_event_loop()
            wait = self.per_host_delay + random.uniform(0.0, self.jitter) - (
                loop.time() - self._last.get(host, 0.0)
            )
            if wait > 0:
                await asyncio.sleep(wait)
            self._last[host] = loop.time()
