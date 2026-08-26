# QuadCore SQLi v2

Boîte à outils **async** de test d'intrusion SQLi (recherche par dorks, détection
multi-technique, dump MySQL/MariaDB). Réécriture 2026 de l'outil de 2017.

> ⚠️ **Usage autorisé uniquement.** N'utilisez cet outil que sur des systèmes que
> vous possédez ou pour lesquels vous disposez d'une autorisation écrite explicite.
> Voir `DISCLAIMER.md`. Licence : GPLv3.

L'ancien outil PHP/AngularJS est archivé dans [`legacy/`](legacy/).

## Stack
- **Moteur** : Python async (asyncio + httpx), lib pure — UNION + error-based + boolean-blind + time-blind.
- **Dorks** : SearXNG self-host + bibliothèque de dorks.
- **Jobs** : asyncio + persistance SQLite, progression WebSocket.
- **API** : FastAPI (bind 127.0.0.1 par défaut).
- **UI** : SPA React + Vite + TypeScript + Tailwind.

## Dev

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate   |  Unix: . .venv/bin/activate
pip install -e ".[dev]"
pytest
ruff check . && mypy engine
```
