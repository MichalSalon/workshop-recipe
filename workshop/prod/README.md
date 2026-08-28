# workshop-prod

<!-- #ZEROPS_EXTRACT_START:intro# -->
Production project for the Deck Renderer: HA data services, three replicas
on frontend / api / worker, and **no `zcp` service**. CI deploys the
repo-root `zerops.yaml` (`zeropsSetup`: `frontend`, `api`, `worker`).
<!-- #ZEROPS_EXTRACT_END:intro# -->

Logs come from this project's own VictoriaLogs endpoint. It is a different
URL and token than workshop-dev's — the agent holds neither.
