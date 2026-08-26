from __future__ import annotations

import httpx
import respx

from engine.dorks.searxng import SearxngClient
from engine.http.client import AsyncHttpClient


@respx.mock
async def test_searxng_extracts_urls_across_pages():
    respx.get(host="searxng", path="/search", params={"pageno": "1"}).mock(
        return_value=httpx.Response(
            200, json={"results": [{"url": "http://a/p?id=1"}, {"url": "http://b/q?x=2"}]}
        )
    )
    respx.get(host="searxng", path="/search", params={"pageno": "2"}).mock(
        return_value=httpx.Response(200, json={"results": [{"url": "http://c/r?y=3"}]})
    )
    async with AsyncHttpClient() as c:
        client = SearxngClient(c, base_url="http://searxng:8080")
        urls = await client.search("inurl:page.php?id=", pages=2)
    assert urls == ["http://a/p?id=1", "http://b/q?x=2", "http://c/r?y=3"]


@respx.mock
async def test_searxng_tolerates_invalid_json():
    respx.get(host="searxng", path="/search").mock(
        return_value=httpx.Response(200, text="<html>not json</html>")
    )
    async with AsyncHttpClient() as c:
        client = SearxngClient(c, base_url="http://searxng:8080")
        urls = await client.search("x", pages=1)
    assert urls == []
