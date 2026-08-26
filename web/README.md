# QuadCore SQLi — Web Console

Operator console (SPA) for the QuadCore SQLi engine. Built with Vite + React + TypeScript,
Tailwind CSS, TanStack Query, Framer Motion and React Router.

> Authorized testing only. Use this tool solely against systems you own or have explicit,
> written permission to test.

## Requirements

- Node.js 18+ (developed on Node 22)
- The QuadCore SQLi API running locally (FastAPI, default `http://127.0.0.1:8000`)

## Getting started

```bash
npm install
npm run dev
```

The dev server starts on `http://localhost:5173`.

### API proxy

The app talks to a same-origin `/api` prefix. In development, Vite proxies it — including
WebSocket streams — to the backend:

```
/api        →  http://127.0.0.1:8000/api
/api/.../stream (WebSocket)  →  proxied with ws: true
```

Start the backend first (from the repository root):

```bash
uvicorn api.main:app --reload
```

If your backend runs elsewhere, edit the `server.proxy` target in `vite.config.ts`.

### Optional API token

If the backend is configured with a token, open **Settings** in the console and paste it.
It is stored in this browser and sent as the `X-Token` header on every request.

## Scripts

| Command           | Description                                        |
| ----------------- | -------------------------------------------------- |
| `npm run dev`     | Start the Vite dev server with the API proxy.      |
| `npm run build`   | Type-check (`tsc`) and build the production bundle. |
| `npm run preview` | Preview the production build locally.              |
| `npm run lint`    | Run ESLint over the source.                        |

## Production

`npm run build` emits static assets to `dist/`. Serve them behind the same origin as the
API (so `/api` resolves), or configure your reverse proxy to forward `/api` (including
WebSocket upgrades) to the backend.

## Screens

- **Disclaimer** — authorized-use gate shown before the console (acceptance persisted locally).
- **Dorks** — run SearXNG dork searches, browse the curated library, collect candidate URLs.
- **Scan** — batch-probe targets for injection points; live progress and a findings table.
- **Analyse** — deep single-URL view with per-parameter technique/DBMS detail.
- **Dumper** — build a schema tree, pick columns, and stream extracted rows (CSV/JSON export).
- **Jobs** — global background-job monitor with live progress and cancellation.
- **Settings** — API token and local session data.

## Live updates

Running jobs open a WebSocket to `/api/jobs/{id}/stream`. If the socket errors or drops
before the job finishes, the UI automatically falls back to polling `GET /api/jobs/{id}`.
