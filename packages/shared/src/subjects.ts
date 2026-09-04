export const NATS_JOBS_SUBJECT = "deck.jobs";
/** Queue group for job delivery. NATS delivers each message to exactly ONE member of a
 * queue group, so worker replicas load-balance instead of every replica rendering every
 * deck. Without it a core subscribe fans out and an N-container worker renders N times. */
export const NATS_JOBS_QUEUE_GROUP = "deck-workers";
export const VALKEY_PROGRESS_CHANNEL = "deck:progress";
export const valkeyLockKey = (jobId: string) => `deck:lock:${jobId}`;
export const valkeyProgressKey = (jobId: string) => `deck:progress:${jobId}`;
