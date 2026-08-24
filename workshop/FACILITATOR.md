# Facilitator notes — do not give this file to the on-stage agent

This repo is the pre-written Deck Renderer. The agent gets the app, a
single-project `workshop-dev` token, and a read-only log-query credential.

## Deliberate bug

Dedup lives in **worker process memory** (`packages/engine/src/lock.ts`), not Valkey.

| Replicas | What you see |
|----------|----------------|
| 1 | Correct: one render, progress 1…N, one PDF |
| 5 | Duplicate renders, progress counters overshoot, occasional Postgres `23505` on `slides` |

The API still returns **200** on submit. The frontend does not surface the
conflict. Only **worker logs** (and the log-query API) show
`acquired local render lock` from multiple replicas and
`duplicate slide persist`.

NATS is a fan-out publish on `deck.jobs` (no queue group). A correct fix is:

1. Valkey `SET deck:lock:{jobId} {replica} NX EX 120` before render
2. NATS queue group `deck-workers` so distinct jobs shard across replicas
3. Progress `INCR` only after the lock is held (or `SET` the counter from the owner)

The bug is **scale-dependent**, not environment-dependent. It reproduces on
workshop-dev because that project has real NATS, real Valkey, and can scale
workers to 5. A mocked laptop stack cannot.

## Demo beat

1. Import `workshop/logs/import.yaml` weeks early. Load-test `logquery`.
2. Import `workshop/dev/import.yaml` (zcp only). Put `LOG_QUERY_URL` +
   `LOG_QUERY_TOKEN` on the zcp service. Confirm the agent can filter by
   hostname (`worker`) before stage day.
3. Agent provisions app services into workshop-dev (or import
   `workshop/dev/import-app.yaml`). Pipeline is repo-root `zerops.yaml`.
4. Submit a 3-slide deck with 1 worker — success.
5. Scale workers to 5, submit the same deck again — duplicates in worker logs.
6. Prod: import `workshop/prod/import.yaml`; CI deploys the same `zerops.yaml`.
   No zcp on prod. Replicas ≥ 3, HA on.

## What the agent is allowed to hold

| Credential | Scope |
|------------|--------|
| ZCP / deploy token | `workshop-dev` only |
| `LOG_QUERY_TOKEN` | Read-only logs, filter by hostname |
| Prod | None |

## Regression

`npm test` + `npm run build` is the proof the agent did not break the app.
`npm run repro:scale` is **your** characterization of the race — not CI.
