import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import type { Bus, Cache, Store } from "@deck/engine";
import {
  contentHash,
  splitSlides,
  type JobEvent,
  type SubmitJobBody,
  type SubmitJobResponse,
} from "@deck/shared";

export type AppDeps = {
  store: Store;
  bus: Bus;
  cache: Cache;
  appUrl: string;
};

export async function buildApp(deps: AppDeps) {
  const app = Fastify({ logger: false });
  await app.register(cors, { origin: [deps.appUrl, /localhost/] });
  await app.register(websocket);

  const sockets = new Set<{ send: (raw: string) => void }>();

  const broadcast = (event: JobEvent) => {
    const raw = JSON.stringify(event);
    for (const socket of sockets) {
      try {
        socket.send(raw);
      } catch {
        sockets.delete(socket);
      }
    }
  };

  await deps.cache.subscribeEvents(broadcast);

  app.get("/health", async () => ({ ok: true }));

  app.get("/api/queue", async () => {
    const depth = await deps.store.queueDepth();
    return { depth };
  });

  app.post<{ Body: SubmitJobBody }>("/api/jobs", async (req, reply) => {
    const markdown = req.body?.markdown ?? "";
    const slides = splitSlides(markdown);
    const job = await deps.store.insertJob({
      markdown,
      contentHash: await contentHash(markdown),
      slideCount: slides.length,
    });
    const queueDepth = await deps.store.queueDepth();
    await deps.bus.publish(job.id);
    const body: SubmitJobResponse = {
      id: job.id,
      slideCount: job.slideCount,
      queueDepth,
    };
    await deps.cache.publishEvent({
      type: "job.accepted",
      jobId: job.id,
      slideCount: job.slideCount,
      queueDepth,
    });
    return reply.code(200).send(body);
  });

  app.get<{ Params: { id: string } }>("/api/jobs/:id", async (req, reply) => {
    const job = await deps.store.getJob(req.params.id);
    if (!job) return reply.code(404).send({ error: "not found" });
    const progress = await deps.cache.getProgress(job.id);
    return { ...job, progress };
  });

  app.get<{
    Params: { id: string; index: string };
    Querystring: { download?: string };
  }>("/api/jobs/:id/slides/:index", async (req, reply) => {
    const index = Number(req.params.index);
    const png = await deps.store.getSlide(req.params.id, index);
    if (!png) return reply.code(404).send({ error: "not found" });
    const name = `slide-${String(index + 1).padStart(2, "0")}.png`;
    if (req.query.download !== undefined) {
      reply.header("content-disposition", `attachment; filename="${name}"`);
    }
    return reply.type("image/png").send(png);
  });

  app.get<{ Params: { id: string } }>("/api/jobs/:id/pdf", async (req, reply) => {
    const pdf = await deps.store.getPdf(req.params.id);
    if (!pdf) return reply.code(404).send({ error: "not found" });
    return reply
      .type("application/pdf")
      .header(
        "content-disposition",
        `attachment; filename="${req.params.id}.pdf"`,
      )
      .send(pdf);
  });

  app.get("/ws", { websocket: true }, (socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
  });

  return app;
}
