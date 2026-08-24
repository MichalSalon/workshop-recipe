import {
  createMemoryBus,
  createMemoryCache,
  createMemoryStore,
  createNatsBus,
  createPostgresStore,
  createValkeyCache,
  handleJob,
  migratePostgres,
  natsFromEnv,
} from "@deck/engine";
import { buildApp } from "./app.js";
import { readApiEnv } from "./env.js";

const env = readApiEnv();

if (env.databaseUrl) {
  await migratePostgres(env.databaseUrl);
}

const store = env.databaseUrl
  ? createPostgresStore(env.databaseUrl)
  : createMemoryStore();
const nats = natsFromEnv();
const bus = nats ? await createNatsBus(nats) : createMemoryBus();
const cache = env.valkeyUrl
  ? createValkeyCache(env.valkeyUrl)
  : createMemoryCache();

if (env.inlineWorker) {
  const replicaId = process.env.WORKER_ID ?? "inline";
  await bus.subscribe((jobId) =>
    handleJob({ store, cache, replicaId, renderDriver: "stub" }, jobId),
  );
}

const app = await buildApp({ store, bus, cache, appUrl: env.appUrl });
await app.listen({ port: env.port, host: env.host });
