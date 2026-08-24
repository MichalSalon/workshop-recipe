import {
  createLock,
  createMemoryBus,
  createMemoryCache,
  createMemoryStore,
  handleJob,
} from "@deck/engine";
import { contentHash, splitSlides } from "@deck/shared";

const DECK = "# A\n\n---\n\n# B\n\n---\n\n# C";
const REPLICAS = 5;

async function main(): Promise<void> {
  const store = createMemoryStore();
  const cache = createMemoryCache();
  const bus = createMemoryBus();
  const logs: string[] = [];

  for (let i = 0; i < REPLICAS; i += 1) {
    const replicaId = `worker-${i + 1}`;
    const lock = createLock();
    await bus.subscribe((jobId) =>
      handleJob(
        {
          store,
          cache,
          replicaId,
          renderDriver: "stub",
          spinMs: 0,
          lock,
          log: (line) => logs.push(line),
        },
        jobId,
      ),
    );
  }

  const job = await store.insertJob({
    markdown: DECK,
    contentHash: await contentHash(DECK),
    slideCount: splitSlides(DECK).length,
  });
  await bus.publish(job.id);
  await new Promise((resolve) => setTimeout(resolve, 200));

  const acquired = logs.filter((line) =>
    line.startsWith("acquired local render lock"),
  );
  const conflicts = logs.filter((line) =>
    line.startsWith("duplicate slide persist"),
  );
  const progress = await cache.getProgress(job.id);

  console.log(`replicas=${REPLICAS}`);
  console.log(`acquired=${acquired.length}`);
  console.log(`conflicts=${conflicts.length}`);
  console.log(`progress=${progress} (slide count is 3)`);
  for (const line of logs) console.log(line);

  if (acquired.length <= 1) {
    throw new Error("expected multiple replicas to acquire the local lock");
  }
}

void main();
