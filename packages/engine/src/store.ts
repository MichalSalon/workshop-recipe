import { randomUUID } from "node:crypto";
import type { Job, JobStatus } from "@deck/shared";
import pg from "pg";

export type SlideWrite = "ok" | "conflict";

export interface Store {
  insertJob(input: {
    markdown: string;
    contentHash: string;
    slideCount: number;
  }): Promise<Job>;
  getJob(id: string): Promise<Job | null>;
  updateStatus(id: string, status: JobStatus): Promise<void>;
  putSlide(
    jobId: string,
    index: number,
    png: Buffer,
    replicaId: string,
  ): Promise<SlideWrite>;
  putPdf(jobId: string, pdf: Buffer): Promise<void>;
  getSlide(jobId: string, index: number): Promise<Buffer | null>;
  getPdf(jobId: string): Promise<Buffer | null>;
  queueDepth(): Promise<number>;
}

type MemoryJob = Job & { slides: Map<number, Buffer>; pdf: Buffer | null };

export function createMemoryStore(): Store {
  const jobs = new Map<string, MemoryJob>();

  return {
    async insertJob({ markdown, contentHash, slideCount }) {
      const job: MemoryJob = {
        id: randomUUID(),
        contentHash,
        markdown,
        status: "queued",
        slideCount,
        createdAt: new Date().toISOString(),
        slides: new Map(),
        pdf: null,
      };
      jobs.set(job.id, job);
      return job;
    },
    async getJob(id) {
      const row = jobs.get(id);
      if (!row) return null;
      const { slides: _s, pdf: _p, ...job } = row;
      return job;
    },
    async updateStatus(id, status) {
      const row = jobs.get(id);
      if (row) row.status = status;
    },
    async putSlide(jobId, index, png) {
      const row = jobs.get(jobId);
      if (!row) return "ok";
      if (row.slides.has(index)) return "conflict";
      row.slides.set(index, png);
      return "ok";
    },
    async putPdf(jobId, pdf) {
      const row = jobs.get(jobId);
      if (row) row.pdf = pdf;
    },
    async getSlide(jobId, index) {
      return jobs.get(jobId)?.slides.get(index) ?? null;
    },
    async getPdf(jobId) {
      return jobs.get(jobId)?.pdf ?? null;
    },
    async queueDepth() {
      return [...jobs.values()].filter(
        (job) => job.status === "queued" || job.status === "rendering",
      ).length;
    },
  };
}

const MIGRATION = `
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY,
  content_hash TEXT NOT NULL,
  markdown TEXT NOT NULL,
  status TEXT NOT NULL,
  slide_count INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS slides (
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  slide_index INT NOT NULL,
  png BYTEA NOT NULL,
  replica_id TEXT NOT NULL,
  PRIMARY KEY (job_id, slide_index)
);
CREATE TABLE IF NOT EXISTS job_pdfs (
  job_id UUID PRIMARY KEY REFERENCES jobs(id) ON DELETE CASCADE,
  pdf BYTEA NOT NULL
);
`;

export async function migratePostgres(databaseUrl: string): Promise<void> {
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query(MIGRATION);
  } finally {
    await client.end();
  }
}

export function createPostgresStore(databaseUrl: string): Store {
  const pool = new pg.Pool({ connectionString: databaseUrl });

  return {
    async insertJob({ markdown, contentHash, slideCount }) {
      const id = randomUUID();
      const createdAt = new Date().toISOString();
      await pool.query(
        `INSERT INTO jobs (id, content_hash, markdown, status, slide_count, created_at)
         VALUES ($1, $2, $3, 'queued', $4, $5)`,
        [id, contentHash, markdown, slideCount, createdAt],
      );
      return {
        id,
        contentHash,
        markdown,
        status: "queued",
        slideCount,
        createdAt,
      };
    },
    async getJob(id) {
      const { rows } = await pool.query(
        `SELECT id, content_hash, markdown, status, slide_count, created_at
         FROM jobs WHERE id = $1`,
        [id],
      );
      const row = rows[0];
      if (!row) return null;
      return {
        id: row.id,
        contentHash: row.content_hash,
        markdown: row.markdown,
        status: row.status,
        slideCount: row.slide_count,
        createdAt: new Date(row.created_at).toISOString(),
      };
    },
    async updateStatus(id, status) {
      await pool.query(`UPDATE jobs SET status = $2 WHERE id = $1`, [id, status]);
    },
    async putSlide(jobId, index, png, replicaId) {
      try {
        await pool.query(
          `INSERT INTO slides (job_id, slide_index, png, replica_id)
           VALUES ($1, $2, $3, $4)`,
          [jobId, index, png, replicaId],
        );
        return "ok";
      } catch (err) {
        const code = (err as { code?: string }).code;
        if (code === "23505") return "conflict";
        throw err;
      }
    },
    async putPdf(jobId, pdf) {
      await pool.query(
        `INSERT INTO job_pdfs (job_id, pdf) VALUES ($1, $2)
         ON CONFLICT (job_id) DO UPDATE SET pdf = EXCLUDED.pdf`,
        [jobId, pdf],
      );
    },
    async getSlide(jobId, index) {
      const { rows } = await pool.query(
        `SELECT png FROM slides WHERE job_id = $1 AND slide_index = $2`,
        [jobId, index],
      );
      return rows[0] ? Buffer.from(rows[0].png) : null;
    },
    async getPdf(jobId) {
      const { rows } = await pool.query(
        `SELECT pdf FROM job_pdfs WHERE job_id = $1`,
        [jobId],
      );
      return rows[0] ? Buffer.from(rows[0].pdf) : null;
    },
    async queueDepth() {
      const { rows } = await pool.query(
        `SELECT count(*)::int AS n FROM jobs WHERE status IN ('queued', 'rendering')`,
      );
      return rows[0]?.n ?? 0;
    },
  };
}
