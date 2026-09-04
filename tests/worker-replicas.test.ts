import { describe, expect, it } from "vitest";
import {
  createLock,
  createMemoryBus,
  createMemoryCache,
  createMemoryStore,
  handleJob,
} from "@deck/engine";
import { contentHash, splitSlides } from "@deck/shared";

const DECK = "# A\n\n---\n\n# B\n\n---\n\n# C";

async function seedJob(store: ReturnType<typeof createMemoryStore>) {
  return store.insertJob({
    markdown: DECK,
    contentHash: await contentHash(DECK),
    slideCount: splitSlides(DECK).length,
  });
}

describe("scaled worker (two replicas)", () => {
  // The production bug: two containers each rendered every slide and each bumped the
  // progress counter, so a 3-slide deck reported 6/3.
  it("counts each slide once when two replicas race the same job", async () => {
    const store = createMemoryStore();
    const cache = createMemoryCache();
    const job = await seedJob(store);

    // Separate locks = separate processes. A shared in-process lock would hide the bug.
    await Promise.all([
      handleJob(
        { store, cache, replicaId: "w1", renderDriver: "stub", spinMs: 0, lock: createLock(), log: () => {} },
        job.id,
      ),
      handleJob(
        { store, cache, replicaId: "w2", renderDriver: "stub", spinMs: 0, lock: createLock(), log: () => {} },
        job.id,
      ),
    ]);

    expect(await cache.getProgress(job.id)).toBe(3);
    expect((await store.getJob(job.id))?.status).toBe("done");
    expect(await store.getPdf(job.id)).not.toBeNull();
  });

  it("gives the job to exactly one replica", async () => {
    const store = createMemoryStore();
    const cache = createMemoryCache();
    const job = await seedJob(store);
    const rendered: string[] = [];

    await Promise.all(
      ["w1", "w2", "w3"].map((replicaId) =>
        handleJob(
          {
            store,
            cache,
            replicaId,
            renderDriver: "stub",
            spinMs: 0,
            lock: createLock(),
            log: (line) => {
              if (line.startsWith("render complete")) rendered.push(replicaId);
            },
          },
          job.id,
        ),
      ),
    );

    expect(rendered).toHaveLength(1);
  });

  it("delivers a queued job to one subscriber per queue group", async () => {
    // Guards the bus contract the memory bus stands in for: fan-out is the defect.
    const bus = createMemoryBus();
    const store = createMemoryStore();
    const cache = createMemoryCache();
    const job = await seedJob(store);
    const starts: string[] = [];

    for (const replicaId of ["w1", "w2"]) {
      await bus.subscribe((jobId) =>
        handleJob(
          {
            store,
            cache,
            replicaId,
            renderDriver: "stub",
            spinMs: 0,
            lock: createLock(),
            log: (line) => {
              if (line.startsWith("acquired render claim")) starts.push(replicaId);
            },
          },
          jobId,
        ),
      );
    }

    await bus.publish(job.id);
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(starts).toHaveLength(1);
    expect(await cache.getProgress(job.id)).toBe(3);
  });
});
