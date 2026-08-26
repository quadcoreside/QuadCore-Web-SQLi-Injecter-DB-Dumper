# QuadCore SQLi v2

Boîte à outils **async** de test d'intrusion SQLi (recherche par dorks, détection
multi-technique, dump MySQL/MariaDB). Réécriture 2026 de l'outil de 2017.

> ⚠️ **Usage autorisé uniquement.** N'utilisez cet outil que sur des systèmes que
> vous possédez ou pour lesquels vous disposez d'une autorisation écrite explicite.
> Voir [`DISCLAIMER.md`](DISCLAIMER.md). Licence : GPLv3.

L'ancien outil PHP/AngularJS est archivé dans [`legacy/`](legacy/) — pour
référence uniquement, non maintenu, à ne pas déployer.

## Ce que c'est

QuadCore SQLi teste et exploite des injections SQL MySQL/MariaDB sur des
cibles autorisées, de la découverte à l'extraction :

- **Découverte de cibles** via dorks (bibliothèque curée + SearXNG self-host).
- **Détection multi-technique** sur chaque paramètre/contexte d'injection :
  error-based, boolean-blind, time-blind, UNION-based — un orchestrateur
  collecte toutes les techniques disponibles, pas seulement la première.
- **Extraction unifiée** : lecture de valeurs SQL via colonne UNION visible ou
  via recherche dichotomique blind (booléenne), derrière une seule interface
  (`ValueReader`) — le fingerprint MySQL et le dump s'en servent sans savoir
  quelle technique est utilisée en dessous.
- **Dump de schéma et de lignes** : parcours `information_schema`
  (bases → tables → colonnes) puis extraction concurrente et reprenable des
  lignes d'une table.
- **Chaîne de tampers** pluggable pour l'évasion de WAF (casse aléatoire,
  commentaires, littéraux hex, encodage URL).

## Stack
- **Moteur** (`engine/`) : Python async (asyncio + httpx), lib pure sans
  dépendance web — UNION + error-based + boolean-blind + time-blind.
- **Dorks** : SearXNG self-host (API JSON) + bibliothèque de dorks curée.
- **Jobs** (`api/`) : asyncio + persistance SQLite (aiosqlite), progression
  diffusée en WebSocket.
- **API** : FastAPI (bind `127.0.0.1` par défaut — pas de relais SSRF ouvert).
- **UI** (`web/`) : SPA React + Vite + TypeScript.

## Démarrage rapide (Docker Compose)

```bash
# 1. Construire la SPA (produit web/dist, servi par le service `web`)
cd web && npm install && npm run build && cd ..

# 2. Lancer la stack : api + searxng + web
docker compose up --build
```

- API : http://127.0.0.1:8000
- SPA (proxy `/api` vers l'API, y compris le WebSocket) : http://127.0.0.1:8081
- SearXNG : http://127.0.0.1:8080

Tous les ports publiés sont bindés sur `127.0.0.1` uniquement : l'outil n'est
pas conçu pour être exposé au-delà de la machine qui l'exécute.

### Cible de test volontairement vulnérable

Pour des tests d'intégration locaux (jamais sur un vrai système sans
autorisation), un profil Docker Compose dédié démarre une petite app PHP+MySQL
volontairement injectable :

```bash
docker compose --profile test up --build vuln-target
# puis : http://127.0.0.1:8090/index.php?id=1
```

Voir [`docker/vuln-target/`](docker/vuln-target/) — usage local uniquement,
clairement isolé du reste de la stack. Au tout premier démarrage, MySQL peut
mettre quelques secondes à s'initialiser avant que la base ne réponde :
relancer la requête si `index.php` renvoie une erreur de connexion.

## Dev local

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate   |  Unix: . .venv/bin/activate
pip install -e ".[dev]"

uvicorn api.main:app --reload    # API sur 127.0.0.1:8000

pytest
ruff check . && mypy engine
```

```bash
cd web
npm install
npm run dev    # serveur de dev Vite
```

## Fonctionnalités UI (SPA)

L'interface expose les capacités de l'API en six fonctionnalités :

1. **Scan de cible** — soumet une URL, teste chaque paramètre sur tous les
   contextes/techniques d'injection (`POST /api/jobs {type: "scan"}`).
2. **Recherche par dorks** — choisit des dorks (ou une catégorie de la
   bibliothèque, `GET /api/dorks/library`) et collecte des URLs candidates via
   SearXNG (`POST /api/jobs {type: "dork"}`).
3. **Dump schéma + lignes** — parcourt `information_schema` puis extrait les
   lignes d'une table via la technique confirmée (`POST /api/jobs
   {type: "dump"}`).
4. **Suivi en direct** — chaque job diffuse son statut/sa progression/son
   résultat en temps réel (`WS /api/jobs/{id}/stream`).
5. **Historique des jobs** — liste et détail des jobs passés et en cours,
   persistés en SQLite (`GET /api/jobs`, `GET /api/jobs/{id}`).
6. **Contrôle des jobs** — annulation coopérative d'un job en cours
   (`POST /api/jobs/{id}/cancel`).

## API — résumé

Préfixe `/api`. Auth optionnelle : si `QCSQLI_TOKEN` est défini, `POST
/api/jobs` exige un header `X-Token` correspondant.

| Méthode | Route | Rôle |
|---|---|---|
| `POST` | `/api/jobs` | Crée un job (`scan`, `dork` ou `dump`). |
| `GET` | `/api/jobs` | Liste les jobs. |
| `GET` | `/api/jobs/{id}` | Détail d'un job. |
| `POST` | `/api/jobs/{id}/cancel` | Annule un job actif. |
| `GET` | `/api/dorks/library` | Bibliothèque de dorks par catégorie. |
| `WS` | `/api/jobs/{id}/stream` | Progression/résultat en temps réel. |

Configuration via variables d'environnement préfixées `QCSQLI_` (host, port,
token, `searxng_url`, `concurrency`, `per_host_delay`, `db_path`) — détail
dans [`CLAUDE.md`](CLAUDE.md) et `api/config.py`.

## Documentation

- [`CLAUDE.md`](CLAUDE.md) — guide technique détaillé (architecture,
  techniques de détection, extracteur unifié, API, conventions de code).
- [`DISCLAIMER.md`](DISCLAIMER.md) — cadre d'usage autorisé et licence.
