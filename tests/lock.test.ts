import { describe, expect, it } from "vitest";
import { createLock } from "@deck/engine";

describe("process-local lock", () => {
  it("admits the first acquire and rejects a second on the same instance", () => {
    const lock = createLock();
    expect(lock.tryAcquire("job-1")).toBe(true);
    expect(lock.tryAcquire("job-1")).toBe(false);
    lock.release("job-1");
    expect(lock.tryAcquire("job-1")).toBe(true);
  });

  it("does not coordinate across lock instances", () => {
    const a = createLock();
    const b = createLock();
    expect(a.tryAcquire("job-1")).toBe(true);
    expect(b.tryAcquire("job-1")).toBe(true);
  });
});
