import { describe, expect, it } from "vitest";
import { runScaleRepro } from "@deck/engine";

describe("scale failure characterization", () => {
  it("reproduces duplicate acquires at the prod floor (3 replicas)", async () => {
    const result = await runScaleRepro(3);
    expect(result.acquired).toBeGreaterThan(1);
    expect(result.progress).toBeGreaterThan(result.slideCount);
  });

  it("reproduces duplicate acquires at the dev demo scale (5 replicas)", async () => {
    const result = await runScaleRepro(5);
    expect(result.acquired).toBeGreaterThan(1);
    expect(result.progress).toBeGreaterThan(result.slideCount);
  });
});
