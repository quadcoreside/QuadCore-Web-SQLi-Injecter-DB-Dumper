# CLAUDE.md

Project guide for engineers (and Claude) working on QuadCore SQLi. Keep this
file factual and in sync with the code — when architecture or endpoints
change, update this file in the same change.

## What this is

QuadCore SQLi is an async SQL-injection testing toolkit (target DBMS:
MySQL/MariaDB) for **authorized** security testing — see
[`DISCLAIMER.md`](DISCLAIMER.md). It is a 2026 rewrite of a 2017 PHP/AngularJS
tool, which is kept for reference in [`legacy/`](legacy/) and is not
maintained.

## Architecture — three layers

```
engine/   pure async SQLi library — no web framework, no persistence, no UI.
          Only external dependency: httpx.
api/      FastAPI service: exposes the engine over HTTP/WebSocket, manages
          jobs as asyncio tasks, persists job state in SQLite (aiosqlite).
web/      Vite + React + TypeScript SPA. Built separately (`npm run build`
          → web/dist); not part of the Python package.
```

`engine/` never imports from `api/`. It can be used as a standalone library.

### `engine/` — modules

- `engine/models.py` — core dataclasses/enums: `InjectionContext` (`numeric`,
  `single_quote`, `double_quote`, `paren_single`, `paren_numeric`),
  `Technique` (`error`, `boolean`, `time`, `union`), `HttpResponse`, `Param`,
  `Target`, `InjectionPoint`, `Finding`.
- `engine/target.py` — `parse_target(url)` extracts query params;
  `injection_points(target, contexts)` builds one `InjectionPoint` per
  (param, context); `build_url`/`build_raw` render a payload into a URL,
  wrapping it per injection context (e.g. closing a quote + paren + `-- -`).
- `engine/http/client.py` — `AsyncHttpClient`: httpx-based client with a
  concurrency semaphore, user-agent rotation, retry with backoff on transport
  errors, and (via `engine/http/pacing.py`'s `RateLimiter`) per-host request
  pacing with jitter.
- `engine/detection/` — one detector per technique, all implementing
  `Detector.detect(client, point) -> DetectionResult | None`:
  - `error.py` — `ErrorDetector`: baseline must be clean, a bare `'` probe
    must trigger a SQL error (`signatures.py`'s regex of MySQL/MariaDB error
    strings).
  - `boolean.py` — `BooleanDetector`: `AND 1=1` vs `AND 1=2` responses must
    diverge (via `difflib.SequenceMatcher` similarity) while `AND 1=1` stays
    close to the baseline.
  - `timing.py` — `TimeDetector`: `AND SLEEP(n)` must add roughly `n` seconds
    versus `AND SLEEP(0)`.
  - `union.py` — `UnionDetector`: brute-forces column count with
    `UNION SELECT NULL,...` until the error disappears, then finds the
    reflected ("visible") column by injecting a unique marker string.
  - `engine.py` — `DetectionEngine`/`default_detectors()`: orchestrator that
    runs all detectors against every injection point and collects every
    technique that works (not just the first), so exploitation can pick the
    best one.
- `engine/exploit/` — the **unified extractor**: a single `ValueReader`
  interface (`read(expr) -> str`) with two implementations, so schema/row
  dumping code doesn't care which technique confirmed the injection:
  - `reader.py`'s `UnionReader` — fast path: reflects
    `concat(0x<sep>,(expr),0x<sep>)` through the visible UNION column and
    slices the value out between separators.
  - `reader.py`'s `BlindReader` — binary-search char-by-char: first
    binary-searches `length((expr))`, then binary-searches each byte's ASCII
    value via `oracle.py`'s `Oracle.is_true(condition)`.
  - `oracle.py`'s `BooleanOracle` — the blind oracle: compares a condition's
    response to a cached `AND 1=1` baseline via similarity ratio.
- `engine/fingerprint/mysql.py` — `fingerprint(reader)`: reads
  `version()`/`current_user()`/`database()` through any `ValueReader`.
- `engine/dump/` — `schema.py` walks `information_schema` (databases → tables
  → columns) through a `ValueReader`; `rows.py`'s `dump_rows` fetches rows
  concurrently (bounded by a semaphore) with an `on_row` callback for
  progress/checkpointing and a `start` offset for resuming an interrupted
  dump.
- `engine/dorks/` — `library.py`'s `DorkLibrary` is a curated, categorized
  set of dork templates (generic/ecommerce/news/cms); `searxng.py`'s
  `SearxngClient` queries a self-hosted SearXNG instance's **JSON** API (not
  scraping search engines directly); `pipeline.py`'s `filter_candidates`
  removes blocklisted hosts (search engines, social networks, code hosts,
  docs sites) and non-parameterized/duplicate URLs from the results.
- `engine/tamper/` — a pluggable WAF-evasion chain: `base.py`'s `Tamper`
  protocol + `apply_chain`; `tampers.py` provides `RandomCase`,
  `Space2Comment`, `HexLiterals`, `UrlEncode`, plus the `hexify`/
  `unhex_hex_cast` helpers used throughout the exploit/dump code to avoid
  literal quotes in payloads.

### `api/` — modules

- `api/config.py` — `Settings` (pydantic-settings), env-driven, prefix
  `QCSQLI_`, also reads a `.env` file. See **Configuration** below.
- `api/main.py` — `create_app()` builds the FastAPI app; its `lifespan`
  connects a `JobStore` and constructs the `JobManager` with the handler
  registry, stored on `app.state`. Module-level `app` is the ASGI entrypoint
  (`api.main:app`). CORS is currently open (`allow_origins=["*"]`).
- `api/routes.py` — the HTTP/WebSocket surface, see **API** below.
- `api/jobs/manager.py` — `JobManager` runs each job as an `asyncio.Task`,
  persists status/progress/result through `JobStore`, and fans out events to
  WebSocket subscribers via per-job `asyncio.Queue`s. Cancellation is
  cooperative (`asyncio.CancelledError` inside the running handler).
- `api/jobs/handlers.py` — one async handler per job type; see **Job types**.
- `api/jobs/store.py` — `JobStore`: SQLite (aiosqlite) persistence; `Job`
  dataclass; `JobStatus` `StrEnum` (`queued`, `running`, `done`, `error`,
  `cancelled`); `params`/`result` are stored as JSON text.

### `web/`

Not present on disk yet in this branch — built separately with
`npm run build`, producing `web/dist`, which is what the `web` nginx service
in `docker-compose.yml` serves. The SPA is a thin client over the API below;
it does not talk to the engine directly.

## Job types (`api/jobs/handlers.py`, `HANDLERS`)

| type   | params                                                                                          | does |
|--------|--------------------------------------------------------------------------------------------------|------|
| `scan` | `url`, `contexts?` (list of `InjectionContext` values)                                          | Runs `DetectionEngine` over every injection point of `url`, returns all findings (technique, confidence, details) per param/context. |
| `dork` | `dorks` (list of str), `pages?` (default 1), `searxng_url?` (default `settings.searxng_url`)     | Queries SearXNG for each dork, returns filtered candidate URLs (`filter_candidates`, `require_params=True`). |
| `dump` | `url`, `context?` (default `numeric`), `param`, `technique` (`union`/other→blind), `num_columns`, `visible_index` (union only), `db`, `table`, `columns` (list), `concurrency?` (default 5) | Builds a `ValueReader` (`UnionReader` or `BlindReader`+`BooleanOracle`) for the confirmed injection point, then `dump_rows` into `{db, table, columns, rows, count}`. |

All three report progress via `ctx.progress(percent, message)`, which the
manager persists and broadcasts over WebSocket.

## API (prefix `/api`)

- `POST /api/jobs` — body `{"type": "scan"|"dork"|"dump", "params": {...}}`,
  optional `X-Token` header (see auth below). Returns `{"id": <int>}`.
  `400` on an unknown job type.
- `GET /api/jobs` — list all jobs (most recent first), each as
  `{id, type, status, progress, message, result, error, params, created_at,
  updated_at}`.
- `GET /api/jobs/{job_id}` — single job, same shape; `404` if unknown.
- `POST /api/jobs/{job_id}/cancel` — cooperatively cancels a running job;
  `409` if the job isn't currently active.
- `GET /api/dorks/library` — `{"categories": {<name>: [<dork>, ...], ...}}`
  from `DorkLibrary`.
- `WS /api/jobs/{job_id}/stream` — streams JSON events for that job:
  `{"event": "status", "status": "running"}`,
  `{"event": "progress", "progress": <float>, "message": <str>}`,
  `{"event": "done", "result": {...}}`,
  `{"event": "error", "error": <repr(exc)>}`,
  `{"event": "cancelled"}`. The connection closes after a terminal event.

### Auth

`POST /api/jobs` checks the `X-Token` header against `Settings.token`
**only if** `QCSQLI_TOKEN` is set; otherwise the endpoint is open. No other
endpoint is currently gated. Treat this as "trusted network" software: put it
behind the localhost bind (below) and/or a reverse proxy that adds real auth
if it's ever reachable beyond your own machine.

## Configuration (env vars, prefix `QCSQLI_`, also read from `.env`)

| var | default | meaning |
|---|---|---|
| `QCSQLI_HOST` | `127.0.0.1` | intended bind address — **do not** change to `0.0.0.0` unless the process is already sandboxed (container, firewall) and only reachable from trusted callers. This default exists specifically so the tool can't become an open SSRF relay. **Gotcha:** nothing in `api/` currently reads `settings.host`/`settings.port` — the actual bind is whatever `--host`/`--port` you pass to the `uvicorn` process (e.g. the `Dockerfile`'s `CMD`, or your local `uvicorn api.main:app` invocation). Keep these two in sync by hand until/unless `api/main.py` reads `settings.host`/`.port` itself. |
| `QCSQLI_PORT` | `8000` | intended bind port — see gotcha above. |
| `QCSQLI_TOKEN` | `None` | if set, required as `X-Token` on `POST /api/jobs`. |
| `QCSQLI_SEARXNG_URL` | `http://searxng:8080` | base URL of the SearXNG instance used by `dork` jobs. |
| `QCSQLI_CONCURRENCY` | `10` | `AsyncHttpClient` concurrency semaphore size. |
| `QCSQLI_PER_HOST_DELAY` | `0.0` | minimum seconds between requests to the same host (politeness/rate-limit avoidance). |
| `QCSQLI_DB_PATH` | `quadcore.sqlite3` | SQLite file for the job store. |

## Running

### Docker Compose (recommended for anything beyond `engine/`+`api/` hacking)

```bash
cd web && npm install && npm run build && cd ..   # produces web/dist
docker compose up --build                           # api, searxng, web
```

- API: `http://127.0.0.1:8000` — SPA: `http://127.0.0.1:8081` (proxies `/api`)
  — SearXNG: `http://127.0.0.1:8080`. All bound to localhost only.
- Vulnerable test target (local integration testing only):
  `docker compose --profile test up --build vuln-target` →
  `http://127.0.0.1:8090/index.php?id=1`. `depends_on` only orders container
  startup, not readiness — on the very first run, MySQL needs a few seconds
  to finish initializing before `index.php` can connect; retry once.

### Local dev

```bash
python -m venv .venv && . .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
uvicorn api.main:app --reload                   # API on 127.0.0.1:8000

cd web
npm install
npm run dev                                     # Vite dev server
```

## Testing & QA

```bash
pytest              # asyncio_mode = auto, testpaths = tests (see pyproject.toml)
ruff check .
mypy engine
```

- `tests/` mirrors `engine/`/`api/` package layout 1:1.
- `tests/helpers/fake_app.py` is a small in-process SQL evaluator (handles
  `concat`/`hex`/conditions) used to unit-test detectors/exploit code without
  a real HTTP server or database — check it before writing new engine tests.
- `tests/helpers/fake_reader.py` provides a fake `ValueReader` for
  fingerprint/dump tests that shouldn't depend on the real extraction path.
- ruff: line-length 100, target `py311`, rules `E, F, I, UP, B`.
- mypy: `python_version = 3.11`, `disallow_untyped_defs = false`,
  `warn_unused_ignores = false`, `ignore_missing_imports = true`.

## Coding conventions

- Python ≥ 3.11 (project requires `>=3.11`; CI/tooling targets 3.11).
  `from __future__ import annotations` at the top of every module.
- Enums are `enum.StrEnum` (`JobStatus`, `InjectionContext`, `Technique`), not
  plain `str, Enum` mixins.
- Data holders are `@dataclass` (plain or `frozen=True` for immutable value
  types like `HttpResponse`/`Param`).
- Interfaces are structural (`typing.Protocol`), not ABCs: `Detector`,
  `Oracle`, `ValueReader`, `Tamper`. Prefer adding a new class that satisfies
  the protocol over widening an existing one.
- `engine/` stays dependency-pure: httpx only, no FastAPI/pydantic/aiosqlite
  imports. If something needs those, it belongs in `api/`.
- ruff-enforced line length: 100 columns.
- Job handlers (`api/jobs/handlers.py`) are the seam between `api/` and
  `engine/`: they translate a `dict[str, Any]` params payload into
  `engine/` calls and report progress via `JobContext`. Keep engine code
  unaware of jobs/HTTP entirely.
