import { runScaleRepro } from "@deck/engine";

const replicas = Number(process.env.REPLICAS ?? 5);

async function main(): Promise<void> {
  const result = await runScaleRepro(replicas);

  console.log(`replicas=${result.replicas}`);
  console.log(`acquired=${result.acquired}`);
  console.log(`conflicts=${result.conflicts}`);
  console.log(`progress=${result.progress} (slide count is ${result.slideCount})`);
  for (const line of result.logs) console.log(line);

  if (result.acquired <= 1) {
    throw new Error("expected multiple replicas to acquire the local lock");
  }
}

void main();
