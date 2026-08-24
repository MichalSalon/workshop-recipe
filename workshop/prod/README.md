# workshop-prod

<!-- #ZEROPS_EXTRACT_START:intro# -->
Production project for the Deck Renderer: HA data services, three replicas
on frontend / api / worker, and **no `zcp` service**. CI deploys the
repo-root `zerops.yaml` (`zeropsSetup`: `frontend`, `api`, `worker`).
<!-- #ZEROPS_EXTRACT_END:intro# -->

Point log forwarding at the same public Logstash URL as workshop-dev.
