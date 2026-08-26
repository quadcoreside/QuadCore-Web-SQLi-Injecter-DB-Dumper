from __future__ import annotations

import asyncio
import random
from dataclasses import dataclass

import httpx

from engine.http.pacing import RateLimiter
from engine.models import HttpResponse

USER_AGENTS: list[str] = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",  # noqa: E501
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",  # noqa: E501
    "Mozilla/5.0 (X11; Linux x86_64; rv:126.0) Gecko/20100101 Firefox/126.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
]


@dataclass
class HttpConfig:
    concurrency: int = 10
    timeout: float = 30.0
    max_retries: int = 2
    proxy: str | None = None
    verify_tls: bool = False
    follow_redirects: bool = True
    per_host_delay: float = 0.0
    jitter: float = 0.0


class AsyncHttpClient:
    def __init__(self, config: HttpConfig | None = None) -> None:
        self.config = config or HttpConfig()
        self._sem = asyncio.Semaphore(self.config.concurrency)
        self._limiter = RateLimiter(self.config.per_host_delay, self.config.jitter)
        self._client = httpx.AsyncClient(
            timeout=self.config.timeout,
            verify=self.config.verify_tls,
            follow_redirects=self.config.follow_redirects,
            proxy=self.config.proxy,
        )

    async def __aenter__(self) -> AsyncHttpClient:
        return self

    async def __aexit__(self, *exc: object) -> None:
        await self.aclose()

    async def aclose(self) -> None:
        await self._client.aclose()

    def _ua(self) -> str:
        return random.choice(USER_AGENTS)

    async def get(self, url: str) -> HttpResponse:
        async with self._sem:
            await self._limiter.acquire(url)
            attempt = 0
            while True:
                try:
                    r = await self._client.get(url, headers={"User-Agent": self._ua()})
                    return HttpResponse(
                        status=r.status_code,
                        text=r.text,
                        elapsed=r.elapsed.total_seconds(),
                        length=len(r.text),
                        url=str(r.url),
                    )
                except (httpx.TransportError, httpx.TimeoutException):
                    attempt += 1
                    if attempt > self.config.max_retries:
                        raise
                    await asyncio.sleep(0.2 * attempt)
