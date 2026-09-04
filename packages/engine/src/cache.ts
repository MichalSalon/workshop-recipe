import { EventEmitter } from "node:events";
import { Redis } from "ioredis";
import {
  VALKEY_PROGRESS_CHANNEL,
  valkeyLockKey,
  valkeyProgressKey,
  type JobEvent,
} from "@deck/shared";

/** How long a job's claim stays held. Long enough to outlive a render, short enough that a
 * replica killed mid-render frees the job. */
export const JOB_CLAIM_TTL_MS = 10 * 60 * 1000;

export interface Cache {
  /** Cross-replica claim on a job. True = this replica owns the render. Survives process
   * boundaries, unlike the in-process lock, so only one container of a scaled worker renders. */
  claimJob(jobId: string, holder: string, ttlMs?: number): Promise<boolean>;
  /** Release a claim this replica holds. No-op when another replica owns it. */
  releaseJob(jobId: string, holder: string): Promise<void>;
  incrProgress(jobId: string): Promise<number>;
  getProgress(jobId: string): Promise<number>;
  publishEvent(event: JobEvent): Promise<void>;
  subscribeEvents(handler: (event: JobEvent) => void): Promise<void>;
  close(): Promise<void>;
}

export function createMemoryCache(): Cache {
  const counts = new Map<string, number>();
  const claims = new Map<string, string>();
  const events = new EventEmitter();
  return {
    async claimJob(jobId, holder) {
      if (claims.has(jobId)) return false;
      claims.set(jobId, holder);
      return true;
    },
    async releaseJob(jobId, holder) {
      if (claims.get(jobId) === holder) claims.delete(jobId);
    },
    async incrProgress(jobId) {
      const next = (counts.get(jobId) ?? 0) + 1;
      counts.set(jobId, next);
      return next;
    },
    async getProgress(jobId) {
      return counts.get(jobId) ?? 0;
    },
    async publishEvent(event) {
      events.emit("event", event);
    },
    async subscribeEvents(handler) {
      events.on("event", handler);
    },
    async close() {
      events.removeAllListeners();
    },
  };
}

export function createValkeyCache(valkeyUrl: string): Cache {
  const redis = new Redis(valkeyUrl, {
    lazyConnect: false,
    maxRetriesPerRequest: 2,
  });
  const subscriber = new Redis(valkeyUrl, {
    lazyConnect: false,
    maxRetriesPerRequest: 2,
  });
  return {
    async claimJob(jobId, holder, ttlMs = JOB_CLAIM_TTL_MS) {
      // SET NX is atomic across replicas — exactly one caller gets "OK".
      const res = await redis.set(valkeyLockKey(jobId), holder, "PX", ttlMs, "NX");
      return res === "OK";
    },
    async releaseJob(jobId, holder) {
      // Compare-and-delete so a replica whose claim already expired cannot free someone
      // else's in-flight render.
      await redis.eval(
        "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
        1,
        valkeyLockKey(jobId),
        holder,
      );
    },
    async incrProgress(jobId) {
      return redis.incr(valkeyProgressKey(jobId));
    },
    async getProgress(jobId) {
      const raw = await redis.get(valkeyProgressKey(jobId));
      return raw ? Number(raw) : 0;
    },
    async publishEvent(event) {
      await redis.publish(VALKEY_PROGRESS_CHANNEL, JSON.stringify(event));
    },
    async subscribeEvents(handler) {
      await subscriber.subscribe(VALKEY_PROGRESS_CHANNEL);
      subscriber.on("message", (_channel: string, payload: string) => {
        handler(JSON.parse(payload) as JobEvent);
      });
    },
    async close() {
      await redis.quit();
      await subscriber.quit();
    },
  };
}
