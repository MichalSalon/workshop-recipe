import { EventEmitter } from "node:events";
import { connect, JSONCodec } from "nats";
import { NATS_JOBS_SUBJECT } from "@deck/shared";

export type JobHandler = (jobId: string) => Promise<void>;

export interface Bus {
  publish(jobId: string): Promise<void>;
  subscribe(handler: JobHandler): Promise<void>;
  close(): Promise<void>;
}

type JobMessage = { jobId: string };

export function createMemoryBus(): Bus {
  const events = new EventEmitter();
  events.setMaxListeners(50);
  return {
    async publish(jobId) {
      events.emit(NATS_JOBS_SUBJECT, jobId);
    },
    async subscribe(handler) {
      events.on(NATS_JOBS_SUBJECT, (jobId: string) => {
        void handler(jobId);
      });
    },
    async close() {
      events.removeAllListeners();
    },
  };
}

export type NatsConnect = {
  servers: string;
  user?: string;
  pass?: string;
};

export function natsFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): string | NatsConnect | undefined {
  if (env.NATS_HOST) {
    return {
      servers: `${env.NATS_HOST}:${env.NATS_PORT ?? "4222"}`,
      user: env.NATS_USER,
      pass: env.NATS_PASSWORD ?? env.NATS_PASS,
    };
  }
  if (env.NATS_URL) return env.NATS_URL;
  return undefined;
}

export async function createNatsBus(input: string | NatsConnect): Promise<Bus> {
  const opts = typeof input === "string" ? { servers: input } : input;
  const nc = await connect(opts);
  const codec = JSONCodec<JobMessage>();
  return {
    async publish(jobId) {
      nc.publish(NATS_JOBS_SUBJECT, codec.encode({ jobId }));
    },
    async subscribe(handler) {
      const sub = nc.subscribe(NATS_JOBS_SUBJECT);
      void (async () => {
        for await (const msg of sub) {
          const { jobId } = codec.decode(msg.data);
          await handler(jobId);
        }
      })();
    },
    async close() {
      await nc.drain();
    },
  };
}
