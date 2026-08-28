# workshop-dev

<!-- #ZEROPS_EXTRACT_START:intro# -->
Development project for the workshop. Import creates only `zcp`. The agent
provisions the Deck Renderer topology (frontend, api, worker, db, queue,
cache) live and writes `zerops.yaml`. Give the agent the zcp token and the
read-only VictoriaLogs credential for this project — nothing that can touch
prod.
<!-- #ZEROPS_EXTRACT_END:intro# -->

Replace the `REPLACE_*` placeholders in `import.yaml` with this project's
own VictoriaLogs URL and read-only token before import, or set them in the
GUI after.

Optional: import `import-app.yaml` into this project to pre-create the full
AI Agent topology (dev + prod slots, db, cache, queue). Prod slots are
required; import intentionally oversizes them for workshop prompt #1.

Confirm the agent can query logs **before** stage day:

```text
Query VictoriaLogs and filter hostname=zcp
```
