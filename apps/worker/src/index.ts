import {
  createNatsBus,
  createPostgresStore,
  createValkeyCache,
  handleJob,
  migratePostgres,
  natsFromEnv,
} from "@deck/engine";

const replicaId =
  process.env.WORKER_ID ?? process.env.HOSTNAME ?? "worker";
const databaseUrl = process.env.DATABASE_URL;
const nats = natsFromEnv();
const valkeyUrl = process.env.VALKEY_URL;

if (!databaseUrl || !nats || !valkeyUrl) {
  throw new Error(
    "WORKER requires DATABASE_URL, VALKEY_URL, and NATS_URL or NATS_HOST",
  );
}

await migratePostgres(databaseUrl);
const store = createPostgresStore(databaseUrl);
const bus = await createNatsBus(nats);
const cache = createValkeyCache(valkeyUrl);
const renderDriver =
  process.env.RENDER_DRIVER === "chromium" ? "chromium" : "stub";

await bus.subscribe((jobId) =>
  handleJob({ store, cache, replicaId, renderDriver }, jobId),
);

console.log(
  `worker listening replica=${replicaId} driver=${renderDriver} subject=deck.jobs`,
);
