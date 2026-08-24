export const NATS_JOBS_SUBJECT = "deck.jobs";
export const VALKEY_PROGRESS_CHANNEL = "deck:progress";
export const valkeyLockKey = (jobId: string) => `deck:lock:${jobId}`;
export const valkeyProgressKey = (jobId: string) => `deck:progress:${jobId}`;
