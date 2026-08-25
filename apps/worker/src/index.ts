import { existsSync } from "node:fs";
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

const renderDriver =
  process.env.RENDER_DRIVER === "chromium" ? "chromium" : "stub";

if (renderDriver === "chromium") {
  const chromePath = process.env.CHROMIUM_PATH;
  if (!chromePath || !existsSync(chromePath)) {
    throw new Error(
      `WORKER requires a working CHROMIUM_PATH when RENDER_DRIVER=chromium (${chromePath ?? "unset"})`,
    );
  }
} else if (process.env.NODE_ENV === "production") {
  throw new Error("WORKER requires RENDER_DRIVER=chromium in production");
}

await migratePostgres(databaseUrl);
const store = createPostgresStore(databaseUrl);
const bus = await createNatsBus(nats);
const cache = createValkeyCache(valkeyUrl);

await bus.subscribe((jobId) =>
  handleJob({ store, cache, replicaId, renderDriver }, jobId),
);

console.log(
  `worker listening replica=${replicaId} driver=${renderDriver} subject=deck.jobs`,
);
