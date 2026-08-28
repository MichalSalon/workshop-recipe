# Facilitator notes — do not give this file to the on-stage agent

This repo is the pre-written Deck Renderer. The agent gets the app, a
single-project `workshop-dev` token, and a read-only VictoriaLogs
credential for that same project.

## Deliberate bug

Dedup lives in **worker process memory** (`packages/engine/src/lock.ts`), not Valkey.

| Replicas | What you see |
|----------|----------------|
| 1 | Correct: one render, progress 1…N, one PDF |
| 5 | Duplicate renders, progress counters overshoot, occasional Postgres `23505` on `slides` |

The API still returns **200** on submit. The frontend does not surface the
conflict. Only **worker logs** (via VictoriaLogs) show
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

1. Import `workshop/dev/import.yaml` (zcp only). Confirm the agent can read
   the project's logs and filter by hostname (`worker`) before stage day.
2. Agent provisions app services into workshop-dev (or import
   `workshop/dev/import-app.yaml`). Pipeline is repo-root `zerops.yaml`.
3. Submit a 3-slide deck with 1 worker — success.
4. Scale workers to 5, submit the same deck again — duplicates in worker logs.
5. Prod: import `workshop/prod/import.yaml`; CI deploys the same `zerops.yaml`.
   No zcp on prod. Replicas ≥ 3, HA on.

## What the agent is allowed to hold

| Credential | Scope |
|------------|--------|
| ZCP / deploy token | `workshop-dev` only |
| Logs | `workshop-dev` only, through the project's own log view |
| Prod | None |

## Regression

`npm test` + `npm run build` is the proof the agent did not break the app.
`npm run repro:scale` is **your** characterization of the race — not CI.
