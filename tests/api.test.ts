import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createMemoryBus,
  createMemoryCache,
  createMemoryStore,
  handleJob,
} from "@deck/engine";
import { buildApp } from "../apps/api/src/app.ts";

describe("api contracts", () => {
  const apps: Array<{ close: () => Promise<void> }> = [];

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((app) => app.close()));
  });

  async function start() {
    const store = createMemoryStore();
    const bus = createMemoryBus();
    const cache = createMemoryCache();
    await bus.subscribe((jobId) =>
      handleJob(
        { store, cache, replicaId: "test", renderDriver: "stub", spinMs: 0 },
        jobId,
      ),
    );
    const app = await buildApp({
      store,
      bus,
      cache,
      appUrl: "http://localhost:5173",
    });
    apps.push(app);
    return app;
  }

  it("serves /health", async () => {
    const app = await start();
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });

  it("accepts a job with 200 and renders slides", async () => {
    const app = await start();
    const res = await app.inject({
      method: "POST",
      url: "/api/jobs",
      payload: { markdown: "# A\n\n---\n\n# B" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { id: string; slideCount: number };
    expect(body.slideCount).toBe(2);

    await vi.waitFor(async () => {
      const job = await app.inject({ method: "GET", url: `/api/jobs/${body.id}` });
      expect(job.json().status).toBe("done");
    });

    const slide = await app.inject({
      method: "GET",
      url: `/api/jobs/${body.id}/slides/0`,
    });
    expect(slide.statusCode).toBe(200);
    expect(slide.headers["content-type"]).toMatch(/png/);
    expect(slide.headers["content-disposition"]).toBeUndefined();

    const exported = await app.inject({
      method: "GET",
      url: `/api/jobs/${body.id}/slides/0?download=1`,
    });
    expect(exported.statusCode).toBe(200);
    expect(exported.headers["content-disposition"]).toMatch(/slide-01\.png/);

    const pdf = await app.inject({
      method: "GET",
      url: `/api/jobs/${body.id}/pdf`,
    });
    expect(pdf.statusCode).toBe(200);
    expect(pdf.headers["content-type"]).toMatch(/pdf/);
  });

  it("returns 404 for an unknown job", async () => {
    const app = await start();
    const res = await app.inject({
      method: "GET",
      url: "/api/jobs/00000000-0000-4000-8000-000000000000",
    });
    expect(res.statusCode).toBe(404);
  });
});
