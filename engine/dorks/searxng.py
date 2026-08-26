from __future__ import annotations

import json
from urllib.parse import quote

from engine.http.client import AsyncHttpClient


class SearxngClient:
    """Client de l'API JSON d'une instance SearXNG self-hostée (remplace le scraping
    direct de Google/Bing/Yahoo, mort depuis 2017)."""

    def __init__(self, client: AsyncHttpClient, base_url: str = "http://searxng:8080") -> None:
        self.client = client
        self.base_url = base_url.rstrip("/")

    async def search(self, query: str, pages: int = 1) -> list[str]:
        urls: list[str] = []
        for page in range(1, pages + 1):
            url = f"{self.base_url}/search?q={quote(query)}&format=json&pageno={page}"
            resp = await self.client.get(url)
            try:
                data = json.loads(resp.text)
            except json.JSONDecodeError:
                continue
            for result in data.get("results", []):
                link = result.get("url")
                if link:
                    urls.append(link)
        return urls
