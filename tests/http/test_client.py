from __future__ import annotations

import httpx
import respx

from engine.http.client import AsyncHttpClient, HttpConfig


@respx.mock
async def test_get_returns_http_response():
    respx.get("http://t/p").mock(return_value=httpx.Response(200, text="hello"))
    async with AsyncHttpClient(HttpConfig()) as c:
        r = await c.get("http://t/p")
    assert r.status == 200
    assert r.text == "hello"
    assert r.length == 5


@respx.mock
async def test_get_sends_user_agent_header():
    route = respx.get("http://t/p").mock(return_value=httpx.Response(200, text="ok"))
    async with AsyncHttpClient(HttpConfig()) as c:
        await c.get("http://t/p")
    assert route.calls.last.request.headers["user-agent"]  # non vide


@respx.mock
async def test_get_retries_then_succeeds():
    route = respx.get("http://t/p").mock(
        side_effect=[httpx.ConnectError("boom"), httpx.Response(200, text="ok")]
    )
    async with AsyncHttpClient(HttpConfig(max_retries=2)) as c:
        r = await c.get("http://t/p")
    assert r.text == "ok"
    assert route.call_count == 2


@respx.mock
async def test_get_raises_after_max_retries():
    respx.get("http://t/p").mock(side_effect=httpx.ConnectError("boom"))
    async with AsyncHttpClient(HttpConfig(max_retries=1)) as c:
        raised = False
        try:
            await c.get("http://t/p")
        except httpx.ConnectError:
            raised = True
    assert raised
