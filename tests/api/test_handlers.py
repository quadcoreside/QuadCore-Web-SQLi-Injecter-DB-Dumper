from __future__ import annotations

import httpx
import respx

from api.jobs.handlers import dork_handler, scan_handler
from tests.helpers.fake_app import FakeVulnerableApp, mount


class FakeCtx:
    def __init__(self) -> None:
        self.events: list[tuple[float, str]] = []

    async def progress(self, percent: float, message: str = "") -> None:
        self.events.append((percent, message))


@respx.mock
async def test_scan_handler_reports_findings_and_progress():
    mount(FakeVulnerableApp(time_based=False))  # time_based off => détecteur time rapide
    ctx = FakeCtx()
    result = await scan_handler(
        {"url": "http://t/p?id=1", "contexts": ["numeric"]}, ctx  # type: ignore[arg-type]
    )
    techniques = {f["technique"] for f in result["findings"]}
    assert techniques == {"error", "boolean", "union"}
    assert ctx.events and ctx.events[-1][0] == 100


@respx.mock
async def test_dork_handler_filters_candidates():
    respx.get(host="searxng").mock(
        return_value=httpx.Response(
            200,
            json={
                "results": [
                    {"url": "http://shop.tld/item.php?id=1"},
                    {"url": "https://www.google.com/search?q=x"},  # blocklist
                    {"url": "http://blog.tld/page.php"},  # sans param
                ]
            },
        )
    )
    ctx = FakeCtx()
    result = await dork_handler(
        {"dorks": ["inurl:item.php?id="], "pages": 1, "searxng_url": "http://searxng:8080"},
        ctx,  # type: ignore[arg-type]
    )
    assert result["urls"] == ["http://shop.tld/item.php?id=1"]
    assert ctx.events[-1][0] == 100
