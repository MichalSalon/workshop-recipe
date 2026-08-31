# Zerops — Platform Capability Inventory

**Shipped capabilities and planned roadmap**
Compiled August 2026 from `zerops.io` and `docs.zerops.io`

---

## Architecture note

Zerops is a developer-first PaaS built from scratch on owned bare metal. No Kubernetes, no
hyperscaler underneath, no off-the-shelf orchestration. Every layer — container runtime, L3/L7
balancing, per-project networking, managed service lifecycle, build pipeline — is Zerops code
running on Zerops hardware.

The roadmap items in Part II are applications of that same substrate: each one reuses networking,
identity, storage lifecycle, balancing and observability that already exist rather than
introducing a parallel stack.

---

## At a glance

| Layer | Shipped today | Planned |
|---|---|---|
| **Isolation** | Incus system containers, shared kernel; KVM VMs for Docker | microZNodes — Cloud Hypervisor microVM per project |
| **Compute primitives** | System containers, Docker-in-VM | Firecracker sandboxes, Runc serverless, GPU nodes, plain VMs |
| **Geography** | Multi-region at project level (prg1, ny1, sea1) | Edge — anycast container placement, edge read replicas, prg2 |
| **AI** | ZCP agent infrastructure (MCP + workspace) | Managed inference, Model API |
| **Security ops** | Firewall, SSH isolation, RBAC, encrypted backups | AI SecOps with Authority Gate |
| **Data** | 11 managed services, HA modes, automated backups | Postgres PITR, cloning, cluster stability |
| **Observability** | Logger + stats per project, forwarding, one-click ELK/Prometheus | VictoriaMetrics, Coroot global |

---
---

# Part I — What Zerops Does Today

## 1. Foundation & architecture

**Hierarchy:** Organization → Project → Service → Container

**Owned infrastructure**
- AMD EPYC compute, NVMe storage, ECC RAM, n+1 redundancy, high-tier datacenters
- Regions live: `prg1` (Prague), `ny1` (New York), `sea1` (Seattle); `sgp1` in progress
- Compliance: GDPR/DPA, ISO 27001, SOC 2 in progress
- Origin: vshosting.eu spin-off, two decades of managed hosting operating experience

**Project core** — deployed per project, not shared
- Project controller, L3 balancer with firewall, unique IP allocation
- L7 HTTP balancer, two containers for HA — routing, TLS termination, certificate management
- Logger container (syslog-ng → VictoriaLogs) and Statistics container
- Per-project VXLAN private network, cgroup resource isolation

**Two core tiers**

| | Lightweight (free) | Serious ($10 / 30d) |
|---|---|---|
| Infrastructure | Single container | Multi-container, HA |
| Build time | 15 h | 150 h |
| Backup storage | 5 GB | 25 GB |
| Egress | 100 GB | 3 TB |
| Failover | Limited | Comprehensive |

Upgrade Light → Serious supported. Partially destructive: logs and statistics lost, ~35 s network
gap, IP addresses preserved. No downgrade path.

**Multiregionality today is at project level.** A project is anchored to one region at creation;
the private network and core cannot span regions. Cross-region means multiple projects. Region is
baked into artifacts: `*.prg1.zerops.app` subdomains, `storage-prg1.zerops.io` object storage,
`api.app-prg1.zerops.io` API base.

---

## 2. Compute primitives (current)

| Primitive | Isolation | Characteristics |
|---|---|---|
| **System container** | Incus, shared kernel | Full Linux userspace, root/`sudo`, `apt`/`apk`, multiple processes, SSH, cron. Container-speed startup and density with VM-level access. |
| **Docker service** | Full KVM VM | Any Docker image. Fixed resources, restart on resize, disk grow-only. Build phase still runs in containers. |

**Runtimes with prepared build + runtime images**

Node.js 18/20/22/24 · Bun 1.1–1.3 + nightly/canary · Deno 1/2 · Python 3.11/3.12/3.14 ·
Go 1.22 · Rust 1.78/1.80/1.86/nightly · Java 17/21 · .NET 6–10 · PHP 8.1–8.5 (+Apache or +nginx) ·
Elixir 1.16 · Gleam 1.5 · Ruby

**Web / static:** Nginx 1.22, Static service
**Plain OS:** Alpine 3.17–3.23, Ubuntu 22.04/24.04

OS selectable per service (`alpine` default or `ubuntu`), independently for build and runtime.

---

## 3. Managed data services

| Category | Services |
|---|---|
| Relational | PostgreSQL 14/16/17/18, MariaDB 10.6 |
| Analytical | ClickHouse 25.3 |
| Cache / KV | Valkey 7.2, KeyDB 6 (deprecated) |
| Search | Elasticsearch 8.16/9.2, Meilisearch 1.10/1.20, Typesense 27.1 |
| Vector | Qdrant 1.10/1.12 |
| Queue / streaming | NATS 2.10/2.12 (+JetStream), Kafka 3.8/3.9 |
| Storage | Object Storage (MinIO, S3-compatible), Shared Storage (SeaweedFS, POSIX) |

Every service is a first-class citizen of the project: same private network, reachable by hostname,
credentials injected as environment variables, health monitoring, automated backups, scaling.
**High availability is a toggle, not a tier upgrade.**

**Depth worth noting**

- **PostgreSQL** — `:single` / `:ha` type variants, fixed for service life. Scaling profiles:
 `oltp-hobby`, `oltp-staging`, `oltp-production`, `oltp-enterprise`, `olap-production`,
 `writeheavy-production`, `custom`. `profileOverrides` for raw parameters (`work_mem`,
 `max_wal_size`, `autovacuum_*`). Read replicas, pgBouncer. Only DB with direct public port access.
- **ClickHouse** — HA is 3 data nodes, replication factor 3, `Replicated` engine. Four wire
 protocols: native TCP 9000, HTTP 8123, MySQL 9004, PostgreSQL 9005.
- **MariaDB** — MaxScale routing, async replication.
- **Valkey** — profiles `hobby` / `staging` / `production`. Auth mandatory.
- **Elasticsearch** — plugins via `PLUGINS`, JVM heap via `HEAP_PERCENT`.
- **Meilisearch** — `masterKey` / `defaultSearchKey` / `defaultAdminKey`. Single-node only.
- **Typesense** — 3-node Raft consensus HA, CORS built in.
- **Qdrant** — HTTP + gRPC, `apiKey` / `readOnlyApiKey`, internal-only.
- **Object Storage** — six preset bucket policies plus raw JSON S3 policy with `{{ .BucketName }}`
 templating. CDN-enablable.
- **Shared Storage** — HA (2 containers, 1:1 replication) or single. Full POSIX, hard/symlinks.
 60 GB data cap independent of disk allocation. Per-mount-only file locks. Auto-vacuum at 15%.

---

## 4. Build & deploy pipeline

**`zerops.yaml`** — entire application lifecycle in one repo file. Official JSON Schema published
and registered with SchemaStore, so VS Code, all JetBrains IDEs, Neovim, Helix and anything backed
by `yaml-language-server` get autocomplete, hover docs, validation and enum suggestions with zero
setup.

**Configuration surface**

- `setup` · `extends` (config inheritance for DRY multi-environment definitions)
- **build:** `base` (multi-value), `os`, `prepareCommands`, `buildCommands`, `deployFiles`
 (`~` wildcard, `.deployignore`), `cache`, `addToRunPrepare`, `envVariables`
- **deploy:** `readinessCheck` (`httpGet`/`exec`, `failureTimeout`, `retryPeriod`),
 `temporaryShutdown`
- **run:** `base`, `os`, `ports` (10–65435, TCP/UDP, `httpSupport`), `prepareCommands`,
 `initCommands`, `start`, `startCommands` (multi-process, named, per-process init),
 `envVariables`, `envReplace` (file placeholder substitution, multi-delimiter), `routing`,
 `healthCheck` (four independent timeout controls), `crontab`, `documentRoot`, `siteConfigPath`

**Pipeline phases** — build container → optional runtime-prepare (custom runtime image) → deploy

- Build resources: 1–5 CPU, 8 GB RAM, 1–100 GB disk. One-hour hard limit. Not billed separately.
- **Zero downtime by default** — new containers start alongside old, pass readiness, then cutover
- **10 versions retained.** Rollback activates a previous version rather than rebuilding.
 Environment variables restore to their state at that version. Artifact download available.
- **Two-layer build cache** — base layer + build layer, rename-based between `/build/source` and
 `/build/cache`, Go `filepath.Match` patterns. No packaging, compression, or network transfer.
- **Custom runtime image caching**, invalidated independently
- **Debug mode** — pause build and/or runtime-prepare at *before first command* / *on failure* /
 *after last command*, then drive with `zsc debug continue | success | fail`

**Triggers** — GitHub/GitLab connect (push-to-branch or tag with regex filter, `[ci skip]`),
`zcli service push`, `zcli service deploy` (artifact-only), GUI re-deploy, `buildFromGit` on import,
GitHub Actions via `zeropsio/actions@main`

---

## 5. Networking

- **Real service discovery** — `db:5432`, `cache:6379`, `api:3000`. Standard hostname resolution,
 no proprietary SDKs, no service mesh. Connection strings identical across environments.
- **Public access** — `.zerops.app` subdomain per HTTP port (dev/testing; 50 MB upload cap,
 shared balancer) · custom domains with free automatic Let's Encrypt · direct TCP/UDP port access
- **IPs** — free shared IPv4 (HTTP/S only), dedicated IPv4 $3/30d, free dedicated IPv6
- **L7 balancer tuning**, six configuration groups: connection handling, client request settings,
 buffers, proxy behaviour, performance (`sendfile`, `tcp_nopush`/`nodelay`, gzip, rate limit),
 file cache, security
- **Per-location advanced routing** — redirects (code, preservePath, preserveQuery) · IP access
 policy (allow/deny + CIDR, v4 and v6) · rate limiting (per-IP or per-domain, rate/burst/zone) ·
 HTTP Basic Auth · custom content responses
- **Forwarded headers** — `X-Real-IP`, `X-Forwarded-For/Proto/Host/Port` always set by the
 balancer; RFC 7239 `Forwarded` and `Proxy` stripped before reaching the app
- **Platform firewall (nftables)** — UDP unrestricted; TCP 1–1024 allows only 22/53/80/123/443/587;
 1025+ unrestricted
- **Per-port firewall** — blacklist or whitelist, single IP or CIDR
- **VPN** — WireGuard via `zcli vpn up`. Laptop joins the project private network; every service
 reachable by hostname. Custom MTU, auto-reconnect daemon.
- **SSH isolation** — `sshIsolation` at project and service level. Rules `vpn`, `project`,
 `service`, `service@name`, with `-` block prefix and specificity-ordered evaluation. Web Terminal
 bypasses all rules as guaranteed emergency access.

---

## 6. Environment variables

- **Scopes** — project-level (auto-inherited by every service, build and runtime) and service-level
- **Types** — build vars, runtime vars, secrets (GUI, bulk `.env` editor, `envSecrets`,
 `dotEnvSecrets`), system-generated
- **`envIsolation`** — `service` (default; explicit cross-service references) or `none` (legacy;
 prefix-based `servicename_var`). Overridable per service.
- **Cross-environment access** — `RUNTIME_` prefix reads runtime vars during build, `BUILD_` prefix
 reads build vars at runtime
- **Precedence** — service over project; build/runtime over secrets
- `zsc setSecretEnv` for runtime updates including stdin and multiline values
- **yamlPreprocessor** — `<@generateRandomString(<32>)>`, generated passwords, keypairs

---

## 7. Scaling & high availability

**Vertical (automatic)** — CPU, RAM, disk per container

- CPU mode: Shared (core shared with up to 10 others) or Dedicated. Switchable once per hour.
- `startCpuCoreCount`, min/max CPU/RAM/disk, `minFreeCpuCores`/`Percent`,
 `minFreeRamGB`/`Percent`
- Published tuning: 10 s collection interval; 10–20 s scale-up windows, 60–300 s scale-down;
 40–60 percentiles; steps from 0.1 core / 0.125 GB / 0.5 GB up to 40 / 32 GB / 128 GB
- Swap enabled on all containers. Set min == max to disable scaling per resource.

**Horizontal (automatic)** — 1–10 containers for runtimes, Linux containers, Docker

**HA mode** — fixed multi-container for databases and shared storage. Chosen at creation,
immutable. Automatic failover, node replacement on a different physical machine, resync.

**Manual override** — `zsc scale cpu|ram | auto | min | max | +N`, 10 min minimum

---

## 8. Backups

- Automated daily (00:00–01:00 UTC default), or weekly / monthly / custom CRON / disabled
- **Tags** — automatic time-based (`daily`/`weekly`/`monthly`), user tags, **protected tags**
 exempt from retention pruning
- **Retention** — defaults ≥7 daily, ≥4 weekly, ≥3 monthly, max 50 per service. Fully customizable.
- 1 TiB technical cap per project. Seven-day grace period after project or service deletion.
- **End-to-end encrypted, per-project X25519 key.** Zerops staff cannot read backup data. Key
 destroyed 7 days post-deletion, rendering backups permanently unrecoverable.
- Supported: MariaDB, PostgreSQL, Qdrant, Elasticsearch, NATS, Meilisearch, Shared Storage,
 ClickHouse (native `BACKUP ALL`)
- `zsc object-storage backup / restore / list / truncate` for arbitrary directories

---

## 9. Observability

- Dedicated logger and statistics services **per project**
- Log types: build, prepare-runtime, runtime/database. Per-container or aggregated, severity and
 time filtering.
- `zcli service log` — `--follow`, formats FULL/SHORT/JSON/JSONSTREAM, custom templates
- **Log forwarding** via syslog-ng — Better Stack, Papertrail, self-hosted ELK/Logstash, any
 syslog-ng compatible target. No vendor lock-in, no premium tier gating log search.
- **One-click self-hosted stacks**
 - ELK: `elkstorage` + `kibana` + `logstash` + `apmserver` (tracing over HTTPS with secret token)
 - Prometheus + Grafana: `prometheus` + `grafana` + `grafanadb` + `prometheusbackups` (S3),
 plus `prometheuslight` remote-write forwarder for cross-project aggregation
 - Local (in-project) or global (dedicated observability project) deployment modes
 - Built-in metrics: scaling/resources, PostgreSQL + HAProxy, MariaDB, Valkey
 - Custom app metrics via `/metrics` endpoint and `ZEROPS_PROMETHEUS_PORT`

---

## 10. CDN

- Six regions — Prague, Falkenstein, London, Sydney, Singapore, Beauharnois
- Cloudflare geo-steering, 30 s DNS TTL, EU as ultimate fallback
- Modes: **Object Storage** (`storageCdnUrl`) · **Static** (`staticCdnUrl`) · **API** *(pending)*
- Fixed 30-day TTL, LRU eviction. Purge via `zsc cdn purge` or REST API.
- Per-node test URLs for debugging geo-routing

---

## 11. Developer & agent experience

**Three development paths, one private network**

| | Local + VPN | Cloud IDE | Native IDE over SSH |
|---|---|---|---|
| Editor runs | Local | Browser | Local |
| Toolchain | Local | Hosted workspace | Workspace or service container |
| Network entry | WireGuard | Browser into project | WireGuard, then SSH |
| Git auth | Local credentials | `gh` or token in env | SSH agent forwarding |

Switching paths is moving the cursor, not reprovisioning the project. Runtime filesystems mountable
into the workspace.

**ZCP — Zerops Control Plane**

MCP server for coding agents. Same `zcp` binary runs as a `zcp@1` service inside Zerops or locally
beside your editor.

- **Bring your own agent and subscription** — Claude Code, Codex, Antigravity, Grok Build, Gemini
 CLI, opencode. **No token reselling, no model proxying, no seat fees.**
- Project-scoped `ZCP_API_KEY`
- **MCP tools** — read-only: `zerops_discover`, `zerops_logs`, `zerops_events`, `zerops_verify`,
 `zerops_process`, `zerops_knowledge`, `zerops_export`. Mutating: `zerops_deploy`, `zerops_env`,
 `zerops_manage`, `zerops_scale`, `zerops_subdomain`, `zerops_delete`. Operational:
 `zerops_workflow`, `zerops_import`, `zerops_mount`, `zerops_preprocess`.
- **Confirmation gates** — service deletion requires named approval in-conversation; destructive
 import override refuses once and names targets, requiring acknowledgement on the second call
- **Work loop** — edit on `appdev` → deploy to `appstage` → check reachability → verify behaviour
 against real managed services → read logs/events → fix from evidence. Session ends in **proof**
 (working URL, endpoint response, UI state, stored data) or a **named blocker**.
- **Production boundary is architectural** — production is a separate project with no `zcp` service
 at all. A human gates the merge.
- Recipe ecosystem with per-recipe environments: AI Agent / Remote CDE / Local / Stage /
 Small Production / HA Production

**Tooling**

- **zCLI** — login, VPN, scope, project and service lifecycle, push/deploy, logs, backup, import,
 self-upgrade with checksum verification, shell completions
- **zsc** (present in every container) — `install`, `scale`, `resources`, `setSecretEnv`,
 `execOnce` (run-once-per-service, built for migrations in clustered setups), `crontab`,
 `cdn purge`, `object-storage`, `shared-storage`, `backup-create`, `noop`, `fail-me`,
 `test tcp`, `debug`
- Web Terminal and File Browser in GUI

---

## 12. Access control & infrastructure-as-code

**RBAC** — Owner / Admin / Developer / Guest, with per-project overrides (Full access / Read only).
API-only roles `BASIC_USER`, `READ_ONLY`, `NO_ACCESS` override. Permission flags `canViewFinances`,
`canEditFinances`, `canCreateProjects`. Integration tokens (full / read / custom-per-project) that
can never exceed the creating user's permissions.

**Import / Export YAML** — full project and service definition covering core package, tags,
environment variables, service type and mode, scaling profiles, secrets, object storage policy,
`buildFromGit`, subdomain access, priority, override, vertical and horizontal autoscaling, shared
storage mounts, custom nginx config, and embedded `zerops.yaml`. Export any project or service from
the GUI. JSON Schema published and SchemaStore-registered.

**REST API** — `https://api.app-prg1.zerops.io/api/rest/public`, Bearer auth, full Swagger.
16 resource groups.

---

## 13. Billing

Per-minute metering, hourly credit deduction.

| Resource | Price |
|---|---|
| Shared CPU | $0.60 / core / 30d |
| Dedicated CPU | $6.00 / core / 30d |
| RAM | $0.75 / 0.25 GB / 30d |
| Disk | $0.05 / 0.5 GB / 30d |
| Object storage | $0.01 / GB / 30d |
| Dedicated IPv4 | $3.00 / 30d |

Overages: egress $0.02/GB, backup $0.50/5 GB, build time $0.50/15 h.
Daily spend limit with email warning (non-blocking, resets midnight UTC).
Manual and automatic top-ups with threshold, fixed amount, and calendar-month cap.

**No plans. No feature tiers. No seat fees.** Adding a teammate — or a second agent — does not
add a line to the invoice.

---
---

# Part II — Roadmap

Each item below: what it is, how it's implemented on the existing substrate, and what it gives
developers using the platform.

---

## 1. Sandboxes & serverless

**What it is**

A managed full-KVM VM (same grade as today's Docker VM) runs a Go orchestrator, addressable by both
the Zerops platform and the project's own UI and API. The orchestrator manages **Firecracker** for
sandboxes and **Runc** (OCI containers) for serverless.

**Both support**

- Deployments of 1–N instances from the same image
- Forking
- Pause and restore
- TTL
- Locally persistent storage
- Fully flexible image source — anywhere inside Zerops or any external registry
- A pre-prepared minimal Zerops base image for operational needs

**Sandbox-specific**

- Two types: **persistent** and **one-shot**
- Spawnable with restricted egress or **no egress at all**

**Serverless-specific**

- Router with **scale-to-zero**. When a packet arrives for a service scaled to zero, the router
 holds the packet, wakes or respawns the Runc container, and forwards it.

**Implementation basis**

Managed KVM VMs already run today for Docker services, so the orchestrator sits on existing
infrastructure. Private networking, identity, storage lifecycle, balancing and observability are
inherited from the project rather than rebuilt.

**For developers**

- A sandbox pool is declared as a service in the project, next to Postgres and NATS — per-tenant
 runtimes, per-request compute, plugin systems, preview environments, CI runners, notebooks.
 Provisioning step, not a third-party integration.
- Sandboxes spawn onto **your own project network next to your own data** — no network round trip
 to an external execution provider, no second vendor, no separate bill.
- Zero-egress mode for executing untrusted or model-generated code.
- Fork / pause / restore / TTL semantics available directly, no SDK-specific lifecycle model.
- Scale-to-zero applies to full OCI containers with state on the private network, not just
 function-shaped workloads.

**Related roadmap item:** `zswarm` — SDKs, language clients, CLI and scaling for the sandbox and
serverless layer.

---

## 2. GPU, inference & model API

Three tiers, escalating in managedness and descending in isolation.

**GPU container**

Zerops spins up an instance with the required GPU on a partner platform via their API, installs the
Zerops platform inside it, and connects it to the project. It becomes a GPU runtime container on
the project's private network where anything can run. Partners are selected for full KVM
virtualization so everything works. Fully dedicated, shared with no one. Billed on running time
following partner pricing. Multiple platforms integrated with selection by current on-demand price
— explicitly **not spot**, so never pre-emptible.

**Managed inference**

Pick a model from a supported list, the way managed databases work today. Zerops spins up the
matching GPU instance and runs an optimized vLLM or llama.cpp for that specific model, with correct
quantization for both weights and KV cache, tuned for maximum performance at stable operation. You
get endpoints to the inference engine directly **and** to a LiteLLM router running in a normal
container, so routing logic stays yours. Everything on the project's internal network. Fully
dedicated. Same billing as above.

**Model API**

Zerops-selected models, operated at the same quality but shared. Endpoint-only, via a managed
LiteLLM router. Per-1M-token billing. Traffic stays inside the platform in encrypted transit, with
a guarantee that Zerops will never read customer data, let alone train on it.

**Implementation basis**

Heterogeneous compute is onboarded into the project network the same way existing nodes are; the
managed-service lifecycle pattern (provision, credentials as env vars, health, scaling) is reused
for inference engines. No GPU fleet is owned — partner capacity is orchestrated.

**For developers**

- The full AI application anatomy — app, vector store, queue, cache, object storage, inference —
 lives on one VXLAN. Inference is reachable at hostname distance.
- No egress cost and no cross-cloud latency on inference calls; for agentic apps making thousands
 of calls per session, that's a runtime property, not a billing detail.
- Dedicated GPU with no co-tenancy and no pre-emption, so long-running or stateful GPU work
 behaves predictably.
- Managed inference removes the vLLM/quantization/KV-cache tuning work without hiding the engine:
 you get the raw endpoint as well as the router.
- Tokens and data never leave the project boundary — relevant for workloads with residency or
 contractual constraints.

---

## 3. Edge & container-level multiregion

**This extends the project model rather than replacing it.**

A project keeps a **home region** holding everything that can't be everywhere: project core
(controller, L3/L7 balancer, firewall, logger, stats), primary Postgres, and anything taking
writes. On top of that, a project can project two new container types outward:

- **Edge runtime containers** — anycast-routed, served from the nearest region
- **Edge DB read nodes** — Postgres and Valkey first

**The level shifts from one to two**

| | Today | With edge |
|---|---|---|
| Project | Pinned to one region | Anchored to a **home** region |
| Core, primary DB, writes | Home region | Home region *(unchanged)* |
| Runtime containers | Home region | Home **or projected to edge** |
| DB reads | Home region | Home **or served locally at edge** |
| Entry point | Regional | **Anycast**, lands nearest |

A project with no edge nodes behaves exactly as it does today. Additive, not migratory — which
matters given thousands of live projects.

**Also in this track:** project region exposed as environment variables, `prg2` alongside `prg1`
with a live migration process (enabled by Cloud Hypervisor host-to-host migration — evacuate or
rebalance hardware without restarting every service in the project).

**Implementation basis**

Anycast over networking Zerops owns end to end. No CDN vendor, no third-party global load balancer,
no cloud provider's regional abstractions in the way. Live migration machinery is shared with the
microZNodes track.

**For developers**

- Full Linux containers at the edge with real Postgres reads next to them — not an isolate runtime
 with a bespoke data model.
- Multi-region is a placement attribute on an existing service, not a separate architecture.
 Dev/stage/prod keep the same primitives and the same config; parity survives going global.
- Existing services gain a geography dimension: CDN gets an API-mode origin, object storage gets
 regional locality, inference endpoints get edge serving points.
- Hardware refresh and region migration (prg1 → prg2) happen without restarting services.

**Open design questions**

Read-your-writes semantics (write home, read local, user GETs stale — needs a documented answer,
whether replay-style routing or an application-level contract); where the L7 balancer lives under
anycast (projected per edge region, changing the per-project core footprint and cost model, or
hoisted above the project); and region env vars needing to be plural — a container needs both its
project's home region and its own.

---

## 4. microZNodes

**KVM provides the hardware isolation boundary. Cloud Hypervisor runs a lightweight microVM per
project. Incus manages system and application containers inside it.** The microVM is the outer
tenant boundary; it does not replace the flexible full-Linux container runtime within.

**Why Cloud Hypervisor rather than Firecracker**

Firecracker is excellent for its intended case: secure, high-density, disposable function and
container workloads. Its deliberately narrow device and lifecycle model is an advantage there. The
distinction isn't microVM versus full VM — both are lightweight KVM guests — it's the workload
lifecycle each is designed to support.

Zerops runs almost any application shape on one platform: websites, custom Linux services, workers,
databases, queues, search engines, long-running and stateful workloads. A substrate optimized
around disposable, uniform workloads would eventually force either restricting supported workloads
and lifecycle operations, or rebuilding resize, migration and recovery in the control plane through
disruptive restart or snapshot-and-restore.

Cloud Hypervisor gives the microVM characteristics — minimal emulation, low memory overhead, Rust
implementation, fast direct PVH kernel boot without firmware or bootloader — **plus** CPU, memory
and device hotplug and machine-to-machine migration. Those matter when the microVM is a durable
project boundary containing several services: resize a project, evacuate hardware, or rebalance a
nest without restarting every application and managed service inside it.

Cloud Hypervisor is Linux Foundation governed, backed by Alibaba, AMD, Ampere, Arm, ByteDance,
Intel, Microsoft, SAP and Tencent Cloud, integrated with Kata Containers, built on the shared
`rust-vmm` ecosystem with significant code shared with Firecracker and crosvm.

**What Zerops owns is above the VMM:** storage replication, network identity transfer, per-project
VXLAN, L3/L7 balancing, managed service lifecycle, resource scaling, readiness checks, backups,
rollback, deterministic reconciliation.

**For developers**

- Every project gets a hardware isolation boundary by default. A kernel CVE in another tenant is
 contained to that tenant rather than being a platform-wide patching event.
- Nothing changes inside the project: same system containers, same root access, same `apt`/`apk`,
 same multi-process services. The boundary is added underneath, not layered on top of the
 developer surface.
- Hotplug resize means changing project resources without restarting the services inside it.
- Sandboxes gain defense in depth — Firecracker instances inside a Cloud Hypervisor project
 boundary.
- Security review answers become short: hardware-isolated per project, per-project encryption,
 per-project audit.

---

## 5. AI SecOps & the Authority Gate

A **nest-native AI SecOps and autonomous operations layer.** Each nest orchestrates its own
observability and detection stack rather than shipping platform-wide telemetry into one global
cluster — bounding storage, query load, failure scope and capacity planning. Deploying another nest
deploys another detection plane.

**Signal sources**

- **Coroot / eBPF** — service topology, latency, resource use, application behaviour
- **VictoriaMetrics / VictoriaLogs** — metrics and structured logs
- **Falco** — syscall and runtime anomalies
- **Suricata** — network detection
- **CrowdSec** — behavioural detection and network enforcement
- **Wazuh** — host security, file integrity monitoring, security event correlation

Adapters normalize output into a common tenant-scoped signal format (source, event type, severity,
project, target, timestamp, evidence) published to a per-nest event bus, with detailed logs and
metrics retained for drill-down. One consistent stream to correlate without forcing every tool into
a proprietary data model. **High-impact containment requires corroboration from multiple
independent sources** — a Falco runtime event plus a Suricata or CrowdSec signal — rather than
trusting one detector.

Standard customers share heavier analytics within the nest under strict project-level identity,
access and data separation. Customers with stronger regulatory or contractual isolation
requirements can run the entire telemetry, detection and agent stack inside their dedicated
KVM-backed boundary.

For projects spanning nests or regions, detection stays local in each nest; project-specific
signals aggregate into the nest running that project's agent. Complete cross-region view through
local queries, no global Wazuh, no continuous cross-region querying. Inter-nest failure does not
disable local detection, and actions requiring unavailable cross-region evidence **fail closed**.

**The Authority Gate**

The agent diagnoses incidents and proposes bounded actions — restart, scale, rollback, temporary
containment. **It never holds production mutation credentials.** Every proposal passes a
deterministic gate that validates identity and scope, derives risk from the actual infrastructure
change, applies tenant policy, requires audit persistence, and executes only through the existing
reconciler.

> **The model proposes; the platform decides.**

**Implementation basis**

Signal quality depends on owning eBPF on the hosts, the network fabric for Suricata, the syscall
layer for Falco, and the reconciler that executes actions. The agent's own reasoning runs on
in-boundary managed inference (tier 2); containment and forensics use the sandbox primitive;
nests and edge provide the scoping model.

**For developers**

- Production gets an autonomous first responder with deterministic authority: bounded actions,
 mandatory audit trail, fail-closed behaviour when evidence is missing.
- No credentials are ever held by a model, and no action bypasses the reconciler that already
 governs every other infrastructure change.
- The Authority Gate generalizes beyond SecOps — it's the authorization pattern for any autonomous
 actor on the platform, ZCP agents included.
- Detection failure is bounded to a nest; another nest's incident doesn't degrade your monitoring.

---

## 6. Platform hardening & remaining items

| Item | What it does |
|---|---|
| `buildFromGit` for private repos | Removes the current documented limitation that private repos can't be built on import |
| **Env system v2** — vault, `.env` linking, zcli envs | Simplifies the isolation and reference model; local `.env` linking and CLI-managed env sets |
| Audit log | Full record of who changed what, per project |
| Notification system | Event notifications for deploys, failures, scaling, incidents |
| **Postgres**: point-in-time recovery, cloning, cluster stability | Restore to a timestamp, clone a database for staging or debugging, improved failover behaviour |
| VictoriaMetrics for statistics | Completes the Victoria migration started with logs; consistent metrics backend |
| Coroot global | Topology and behaviour observability across the platform |
| New WebSocket system, Elastic off | Internal architecture cleanup |
| garagefs migration | Object storage backend replacement |
| VM without Docker | A plain VM primitive between system container and Docker-in-VM |
| Global serverless service | Serverless as a platform-level primitive |
| zswarm | SDKs, CLI and scaling for sandboxes and serverless |
| Project instance in GUI | Project-level view and controls in the GUI |
| Named subdomains | Choose the subdomain instead of a generated one |
| Preview subdomain basic auth | HTTP auth on preview subdomains |
| Deploy coordination | Ordering and coordination across services during deploy |
| ZCP config as first-class import parameter | Declare ZCP config in import YAML, same class as the currently missing `region` field |
| prg2 + prg1 migration process | New Prague capacity with a live migration path off existing hardware |

---

*Sources: `zerops.io`, `zerops.io/platform`, `docs.zerops.io` (features, references, ZCP, service
overviews, zerops.yaml and import specifications, pricing), and internal roadmap document.*