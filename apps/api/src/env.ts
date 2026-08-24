export type ApiEnv = {
  port: number;
  host: string;
  appUrl: string;
  databaseUrl: string;
  natsUrl: string;
  valkeyUrl: string;
  inlineWorker: boolean;
};

export function readApiEnv(
  env: NodeJS.ProcessEnv = process.env,
): ApiEnv {
  const databaseUrl = env.DATABASE_URL ?? "";
  const natsUrl = env.NATS_URL ?? env.NATS_HOST ?? "";
  const valkeyUrl = env.VALKEY_URL ?? "";
  const isolated = !databaseUrl && !natsUrl && !valkeyUrl;
  return {
    port: Number(env.PORT ?? 3000),
    host: env.HOST ?? "0.0.0.0",
    appUrl: env.APP_URL ?? "http://localhost:5173",
    databaseUrl,
    natsUrl,
    valkeyUrl,
    inlineWorker: env.INLINE_WORKER === "1" || isolated,
  };
}
