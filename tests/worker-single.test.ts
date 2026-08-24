import { describe, expect, it } from "vitest";
import {
  createLock,
  createMemoryCache,
  createMemoryStore,
  handleJob,
} from "@deck/engine";
import { contentHash, splitSlides } from "@deck/shared";

const DECK = "# A\n\n---\n\n# B\n\n---\n\n# C";

describe("single replica worker", () => {
  it("renders each slide once and finishes the job", async () => {
    const store = createMemoryStore();
    const cache = createMemoryCache();
    const slides = splitSlides(DECK);
    const job = await store.insertJob({
      markdown: DECK,
      contentHash: await contentHash(DECK),
      slideCount: slides.length,
    });

    await handleJob(
      {
        store,
        cache,
        replicaId: "w1",
        renderDriver: "stub",
        spinMs: 0,
        lock: createLock(),
      },
      job.id,
    );

    const done = await store.getJob(job.id);
    expect(done?.status).toBe("done");
    expect(await cache.getProgress(job.id)).toBe(3);
    expect(await store.getSlide(job.id, 0)).not.toBeNull();
    expect(await store.getPdf(job.id)).not.toBeNull();
  });
});
