# Deck Renderer — Zerops Recipe Research

Workshop app for a live agent session: submit markdown, workers render slides
to PNG/PDF, the browser shows queue depth and progress. Pipeline lives in
repo-root `zerops.yaml` (frontend / api / worker / logquery + `*-dev`).
No Dockerfile. Canonical imports stay under `workshop/`.

- **Software:** Deck Renderer (this repo)
- **Type:** framework (multi-service Node workshop, not a GUI hello-world)
- **Official Site:** https://github.com/zeropsio/workshop-recipe
- **Zerops Runtime:** `nodejs@22` (api, worker, frontend-dev) + `static` (frontend prod)
- **Sibling recipes:** `zerops-showcase` (app + worker + NATS + Valkey + Postgres),
  `vue-static-hello-world` (Vite SPA → Nginx), `elk` (central log stack)

## Overview

Six roles, each with a real job:

| Hostname | Role | Why it is a real decision |
|----------|------|---------------------------|
| `frontend` | Vite/React SPA — submit + live queue | L7 routing, TLS, CORS, static vs Node |
| `api` | REST + WebSocket | Public port, talks to db / queue / cache |
| `worker` | Headless Chromium render, CPU-bound | Horizontal scale is the demo |
| `db` | PostgreSQL — jobs + slide bytes | Migrations, connection-string injection |
| `queue` | NATS — work distribution | Queue group across worker replicas |
| `cache` | Valkey — lock, progress, pub/sub | Breaks under scale if the lock is local |

No outbound HTTP from the worker. Render input is the submitted markdown only.

## Zerops Compatibility Assessment

### Requirements

- [x] Stateless application (state in Postgres + Valkey + NATS)
- [x] Supported runtime available (`nodejs@22`, `static`, `postgresql`, `nats`, `valkey`)
- [x] Can bind to `PORT` / `HOST`
- [x] No hard-coded filesystem dependencies (slides stored in Postgres)

### Potential Issues

- Chromium + fonts are **system packages** on the worker runtime. App-container
  PaaS images cannot `apt-get` them. Zerops system containers can, via
  `prepareCommands` — that is the contrast the workshop is built to show.
- Playwright/Chromium needs ~0.5–1 GB RSS per render. Size the worker from that
  floor, not from a hello-world Node default.
- Projects sit on separate VXLANs. The log stack is a **third** project;
  the agent reaches it only through a public, authenticated, read-only query
  URL — never `elkstorage` as a private hostname from `workshop-dev`.

## Build Configuration

Refer to: https://docs.zerops.io/features/pipeline

Repo-root `zerops.yaml` defines these setups:

### Build Commands

```bash
# frontend (prod / static)
npm ci
npm run build -w @deck/frontend

# api / worker (nodejs)
npm ci
npm run build -w @deck/api
# or
npm run build -w @deck/worker
```

### Build Dependencies

- Node.js 22, npm 10+
- Worker runtime: `chromium`, `fonts-liberation`, `fonts-noto-core` (or equivalent)

### Build Output

| Setup | deployFiles |
|-------|-------------|
| frontend prod | `apps/frontend/dist` (strip with `~`) |
| api | `apps/api/dist` + `node_modules` + workspace packages |
| worker | `apps/worker/dist` + `node_modules` + workspace packages |

Monorepo workspace: a single git repo, three `zeropsSetup` entries (or three
hostnames sharing one yaml). `npm ci` at the repo root.

### Caching Recommendations

Refer to: https://docs.zerops.io/features/build-cache

- `node_modules`
- Playwright browser cache only if the agent installs browsers in the build image

## Runtime Configuration

### Start Command

```bash
# frontend prod — Nginx serves static files (no Node)
# frontend dev — npm run dev -w @deck/frontend -- --host 0.0.0.0
# api
node apps/api/dist/index.js
# worker
node apps/worker/dist/index.js
```

### Environment Variables

Refer to: https://docs.zerops.io/features/env-variables

Project value store (import.yaml) uses generic names. Map in `zerops.yaml`.

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PORT` | api, frontend-dev | Bind port | `3000` / `5173` |
| `HOST` | api | Bind address | `0.0.0.0` |
| `APP_URL` | value store | Public frontend URL (CORS) | `https://frontend-….prg1.zerops.app` |
| `API_URL` | value store | Public API URL (WS + REST) | `https://api-…-3000.prg1.zerops.app` |
| `DATABASE_URL` | api, worker | `${db_connectionString}` | — |
| `NATS_HOST` / `PORT` / `USER` / `PASSWORD` | api, worker | Discrete NATS fields (password colons) | — |
| `VALKEY_URL` | api, worker | `${cache_connectionString}` | — |
| `WORKER_ID` | worker | Replica identity in logs | `${hostname}` or container id |
| `RENDER_DRIVER` | worker | `chromium` on Zerops; `stub` in CI | `chromium` |
| `LOG_QUERY_URL` | zcp only | Cross-project log API | `https://logquery-…` |
| `LOG_QUERY_TOKEN` | zcp only | Read-only bearer | generated secret |

### Health Check

- API: `GET /health` → `{ ok: true }`
- Worker: process stays up; no public HTTP
- Frontend prod: Nginx `/`

## Database/Storage Requirements

### Database

- Type: PostgreSQL 17 (`postgresql:single@17` / `postgresql:ha@17`)
- Initialization: `apps/api/src/migrate.ts` — `jobs`, `slides` (PK `job_id, slide_index`)
- Recommended profile: `oltp-hobby` on workshop-dev; `oltp-staging` on workshop-prod

### Object Storage

- Required: no — PNG/PDF live in Postgres for this demo

## Service Dependencies

Refer to: https://docs.zerops.io/references/import-yaml/type-list

| Service | Type | Purpose | Priority |
|---------|------|---------|----------|
| db | `postgresql:single@17` / `:ha@17` | Jobs + results | 10 |
| cache | `valkey:single@7.2` / `:ha@7.2` | Lock, progress, pub/sub | 10 |
| queue | `nats:single@2.12` / `:ha@2.12` | Work distribution | 10 |
| api | `nodejs@22` | REST + WebSocket | 1 |
| worker | `nodejs@22` | Chromium render | 1 |
| frontend | `static` (prod) / `nodejs@22` (dev) | SPA | 1 |
| zcp | `zcp@1` | Agent workspace — **workshop-dev only** | — |

## Scaling Considerations

Refer to: https://docs.zerops.io/features/scaling-ha

Per-setup RAM floors (hello-world / workshop, derived from what each process runs):

| Setup | minRam | minFreeRamGB | Rationale |
|-------|--------|--------------|-----------|
| frontend prod (`static`) | 0.25 | 0.25 | Nginx SPA |
| frontend dev (`npm run dev`) | 0.5 | omit (default) | Vite only |
| api | 0.5 | 0.25 | Node + `pg` + NATS + Valkey + WS fan-out |
| worker (1 Chromium) | 1 | 0.5 | Node + headless Chromium + fonts |
| zcp | 1 | 0.5 | Agent workspace |
| db hobby (dev) | profile `oltp-hobby` | — | ~0.5 GB managed |
| db staging (prod) | profile `oltp-staging` | — | ~1 GB managed |
| cache | profile only | — | never duplicate profile RAM |
| queue | minRam only if above default | — | NATS is light |

Cost ladder for the **three workshop projects** (not the six GUI recipe envs):

| Project | Shape | Notes |
|---------|-------|-------|
| `workshop-logs` | ELK + `logquery` | Static, load-tested weeks early |
| `workshop-dev` | `zcp` at import; optional `import-app.yaml` | Agent can still provision, or import the app topology |
| `workshop-prod` | Same app topology, HA, **no zcp** | Worker `minContainers: 3`; CI uses repo-root `zerops.yaml` |

Stage-like total RAM on workshop-dev (after the agent provisions) stays
**below** workshop-prod. HA keeps `:ha@` + `corePackage: SERIOUS`.

Horizontal worker scale (1 → 5) is the on-stage measurement. One replica is
correct; five replicas expose the process-local dedup lock (see
`workshop/FACILITATOR.md`).

## Maintenance Guide

### Upgrades

- Node 22 LTS line; bump workspace pins with `zerops-recipe-update`
- Chromium package name follows Ubuntu 24.04

### Backups

- Postgres automatic backups on Zerops; slides are demo data

### Data Migrations

- `npm run migrate -w @deck/api` (also runs on API boot)

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Worker cannot launch Chromium | Missing system packages | `prepareCommands` on Ubuntu runtime |
| Duplicate slides / 23505 | Process-local lock + >1 replica | Distributed lock in Valkey |
| Agent cannot read prod logs | Cross-project VXLAN | Use `LOG_QUERY_URL`, never private hostnames |
| CORS / WS failure | `APP_URL` / `API_URL` unset | Map value store in `zerops.yaml` |

## Security Considerations

- `LOG_QUERY_TOKEN` is read-only and scoped to the log project
- The zcp token is a **single-project** deploy token for `workshop-dev` only
- Neither credential reaches `workshop-prod`
- Never commit `.env` / `.mcp.json`

## References

- https://docs.zerops.io/zerops-yaml/specification — pipeline in repo-root `zerops.yaml`
- https://docs.zerops.io/references/import-yaml/type-list — service types
- https://docs.zerops.io/features/scaling-ha — worker horizontal scale
- https://docs.zerops.io/observability/log-forwarding — project logger → workshop-logs
- https://docs.zerops.io/features/coding-agents — zcp in-project vs prod without zcp
- https://github.com/zeropsio/recipes/tree/main/zerops-showcase — sibling topology
- https://github.com/zeropsio/recipes/tree/main/elk — log-stack sibling

## Notes for Terminal Agent

- `zerops.yaml` is at the repo root. Do not add Dockerfiles.
- Do **not** mention the scale bug in `AGENTS.md` or the app README.
- Closest sibling: `zerops-showcase` + `vue-static-hello-world`.
- Deviations from `/zerops-recipe-add` six-env template are intentional:
  three named workshop projects (logs / dev / prod).
