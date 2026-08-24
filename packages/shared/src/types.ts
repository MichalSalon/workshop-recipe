export type JobStatus = "queued" | "rendering" | "done" | "failed";

export type Job = {
  id: string;
  contentHash: string;
  markdown: string;
  status: JobStatus;
  slideCount: number;
  createdAt: string;
};

export type JobEvent =
  | {
      type: "job.accepted";
      jobId: string;
      slideCount: number;
      queueDepth: number;
    }
  | {
      type: "job.progress";
      jobId: string;
      current: number;
      total: number;
      replicaId: string;
    }
  | {
      type: "job.done";
      jobId: string;
    }
  | {
      type: "job.conflict";
      jobId: string;
      replicaId: string;
      detail: string;
    }
  | {
      type: "queue.depth";
      depth: number;
    };

export type SubmitJobBody = {
  markdown: string;
};

export type SubmitJobResponse = {
  id: string;
  slideCount: number;
  queueDepth: number;
};

export type QueueState = {
  depth: number;
};
