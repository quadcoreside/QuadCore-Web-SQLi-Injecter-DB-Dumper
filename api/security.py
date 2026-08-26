from __future__ import annotations

from fnmatch import fnmatch
from urllib.parse import urlsplit


def parse_allowlist(raw: str) -> list[str]:
    """Parse la liste d'allowlist séparée par des virgules en patterns nettoyés."""
    return [part.strip() for part in raw.split(",") if part.strip()]


def host_of(url: str) -> str:
    netloc = urlsplit(url).netloc
    return netloc.rsplit("@", 1)[-1].split(":", 1)[0].lower()


def host_in_scope(url: str, allowlist: list[str]) -> bool:
    """True si l'hôte de `url` est dans le périmètre. Allowlist vide = tout autorisé.

    Un pattern correspond par fnmatch (``*.example.com``), égalité exacte, ou en tant que
    domaine parent (``example.com`` couvre ``shop.example.com``)."""
    if not allowlist:
        return True
    host = host_of(url)
    if not host:
        return False
    for pattern in allowlist:
        pat = pattern.lower()
        if fnmatch(host, pat) or host == pat or host.endswith("." + pat):
            return True
    return False
