# workshop-dev

<!-- #ZEROPS_EXTRACT_START:intro# -->
Development project for the workshop. Import creates only `zcp`. The agent
provisions the Deck Renderer topology (frontend, api, worker, db, queue,
cache) live and writes `zerops.yaml`. Give the agent the zcp token and the
read-only log-query credential — nothing that can touch prod.
<!-- #ZEROPS_EXTRACT_END:intro# -->

Replace the `REPLACE_*` placeholders in `import.yaml` with values from
`workshop-logs` before import, or set them in the GUI after.

Optional: import `import-app.yaml` into this project to pre-create
frontend / api / worker (dev + prod setups) plus db, cache, and queue.

Confirm the agent can query logs **before** stage day:

```text
Call the log query API and filter hostname=zcp
```
