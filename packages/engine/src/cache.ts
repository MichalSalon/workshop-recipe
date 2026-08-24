import { EventEmitter } from "node:events";
import { Redis } from "ioredis";
import {
  VALKEY_PROGRESS_CHANNEL,
  valkeyProgressKey,
  type JobEvent,
} from "@deck/shared";

export interface Cache {
  incrProgress(jobId: string): Promise<number>;
  getProgress(jobId: string): Promise<number>;
  publishEvent(event: JobEvent): Promise<void>;
  subscribeEvents(handler: (event: JobEvent) => void): Promise<void>;
  close(): Promise<void>;
}

export function createMemoryCache(): Cache {
  const counts = new Map<string, number>();
  const events = new EventEmitter();
  return {
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
