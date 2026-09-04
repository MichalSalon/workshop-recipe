import { splitSlides, type JobEvent } from "@deck/shared";
import type { Cache } from "./cache.js";
import { processLock, type JobLock } from "./lock.js";
import { renderAllSlides, slidesToPdf, type RenderDriver } from "./render.js";
import type { Store } from "./store.js";

export type HandleDeps = {
  store: Store;
  cache: Cache;
  replicaId: string;
  renderDriver: RenderDriver;
  spinMs?: number;
  lock?: JobLock;
  log?: (line: string) => void;
};

export async function handleJob(deps: HandleDeps, jobId: string): Promise<void> {
  const log = deps.log ?? console.log;
  const lock = deps.lock ?? processLock;
  // Two gates, in order. The in-process lock is cheap and stops the same container
  // re-entering a job it is already rendering. The cache claim is the one that matters
  // across containers: without it, every replica of a scaled worker renders every deck.
  if (!lock.tryAcquire(jobId)) {
    log(`skip, already rendering locally job=${jobId} replica=${deps.replicaId}`);
    return;
  }

  let claimed = false;
  try {
    claimed = await deps.cache.claimJob(jobId, deps.replicaId);
    if (!claimed) {
      log(`skip, claimed by another replica job=${jobId} replica=${deps.replicaId}`);
      return;
    }
    log(`acquired render claim job=${jobId} replica=${deps.replicaId}`);

    const job = await deps.store.getJob(jobId);
    if (!job) {
      log(`job missing job=${jobId} replica=${deps.replicaId}`);
      await deps.cache.releaseJob(jobId, deps.replicaId);
      return;
    }
    await deps.store.updateStatus(jobId, "rendering");
    const slides = splitSlides(job.markdown);
    const spinMs = deps.spinMs ?? Number(process.env.RENDER_SPIN_MS ?? 400);
    const pngs = await renderAllSlides(slides, deps.renderDriver, spinMs);
    for (const [index, png] of pngs.entries()) {
      const write = await deps.store.putSlide(jobId, index, png, deps.replicaId);
      if (write === "conflict") {
        const detail = `duplicate slide persist job=${jobId} replica=${deps.replicaId} index=${index}`;
        log(detail);
        const conflict: JobEvent = {
          type: "job.conflict",
          jobId,
          replicaId: deps.replicaId,
          detail,
        };
        await deps.cache.publishEvent(conflict);
        // Do NOT count a slide this replica did not persist. The row already exists, so
        // whoever wrote it counted it; counting again is what reported 6/3 for a 3-slide
        // deck. Skipping here keeps the counter equal to the number of distinct stored
        // slides even if a duplicate render ever slips past the gates above.
        continue;
      }
      const current = await deps.cache.incrProgress(jobId);
      const progress: JobEvent = {
        type: "job.progress",
        jobId,
        current,
        total: slides.length,
        replicaId: deps.replicaId,
      };
      await deps.cache.publishEvent(progress);
    }
    await deps.store.putPdf(jobId, await slidesToPdf(pngs));
    await deps.store.updateStatus(jobId, "done");
    await deps.cache.publishEvent({ type: "job.done", jobId });
    log(`render complete job=${jobId} replica=${deps.replicaId} slides=${slides.length}`);
  } catch (err) {
    log(`render failed job=${jobId} replica=${deps.replicaId} error=${(err as Error).message}`);
    await deps.store.updateStatus(jobId, "failed");
    // Hand the claim back so a retry can pick the job up instead of waiting out the TTL.
    // A SUCCESSFUL render deliberately keeps its claim: it then acts as a de-dup marker
    // that suppresses a redelivery of the same job until the TTL expires.
    if (claimed) await deps.cache.releaseJob(jobId, deps.replicaId);
  } finally {
    lock.release(jobId);
  }
}
