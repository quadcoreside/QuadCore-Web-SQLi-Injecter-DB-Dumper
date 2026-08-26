from __future__ import annotations

from urllib.parse import urlsplit

# Domaines à ignorer (moteurs, réseaux sociaux, dépôts de code, docs).
BLOCKLIST: tuple[str, ...] = (
    "google.",
    "bing.",
    "yahoo.",
    "duckduckgo.",
    "youtube.",
    "facebook.",
    "twitter.",
    "x.com",
    "instagram.",
    "linkedin.",
    "github.",
    "gitlab.",
    "stackoverflow.",
    "wikipedia.",
    "pastebin.",
    "php.net",
    "w3.org",
    "mozilla.org",
)


def host_of(url: str) -> str:
    return urlsplit(url).netloc.lower()


def has_params(url: str) -> bool:
    query = urlsplit(url).query
    return "=" in query


def is_blocked(url: str) -> bool:
    host = host_of(url)
    return any(bad in host for bad in BLOCKLIST)


def filter_candidates(
    urls: list[str], *, require_params: bool = True, dedupe_host: bool = False
) -> list[str]:
    """Nettoie une liste d'URLs candidates : retire blocklist et (option) sans paramètre,
    déduplique par URL et (option) par host. Préserve l'ordre d'apparition."""
    seen_urls: set[str] = set()
    seen_hosts: set[str] = set()
    out: list[str] = []
    for url in urls:
        if not url or is_blocked(url):
            continue
        if require_params and not has_params(url):
            continue
        if url in seen_urls:
            continue
        seen_urls.add(url)
        if dedupe_host:
            host = host_of(url)
            if host in seen_hosts:
                continue
            seen_hosts.add(host)
        out.append(url)
    return out
