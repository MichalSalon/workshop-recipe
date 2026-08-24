export type JobLock = {
  tryAcquire(jobId: string): boolean;
  release(jobId: string): void;
  size(): number;
};

export function createLock(): JobLock {
  const inflight = new Set<string>();
  return {
    tryAcquire(jobId) {
      if (inflight.has(jobId)) return false;
      inflight.add(jobId);
      return true;
    },
    release(jobId) {
      inflight.delete(jobId);
    },
    size() {
      return inflight.size;
    },
  };
}

export const processLock = createLock();
