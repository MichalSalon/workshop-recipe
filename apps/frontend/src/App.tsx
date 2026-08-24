import { useEffect, useMemo, useState } from "react";
import type { JobEvent, SubmitJobResponse } from "@deck/shared";
import { SAMPLE_DECK } from "./sample";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(
  /\/$/,
  "",
);

function wsUrl(): string {
  const url = new URL(API);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws";
  return url.toString();
}

export function App() {
  const [markdown, setMarkdown] = useState(SAMPLE_DECK);
  const [depth, setDepth] = useState(0);
  const [busy, setBusy] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [slideCount, setSlideCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [note, setNote] = useState("Idle — submit a deck.");

  useEffect(() => {
    const socket = new WebSocket(wsUrl());
    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data) as JobEvent;
      if (msg.type === "queue.depth" || msg.type === "job.accepted") {
        setDepth(msg.type === "job.accepted" ? msg.queueDepth : msg.depth);
      }
      if (msg.type === "job.accepted") {
        setJobId(msg.jobId);
        setSlideCount(msg.slideCount);
        setProgress(0);
        setDone(false);
        setNote(`Accepted ${msg.jobId.slice(0, 8)}…`);
      }
      if (msg.type === "job.progress") {
        setJobId(msg.jobId);
        setSlideCount(msg.total);
        setProgress(msg.current);
        setNote(`Slide ${msg.current} / ${msg.total}`);
      }
      if (msg.type === "job.done") {
        setDone(true);
        setBusy(false);
        setNote("Render complete.");
        void refreshDepth();
      }
    };
    return () => socket.close();
  }, []);

  useEffect(() => {
    void refreshDepth();
  }, []);

  const ratio = useMemo(() => {
    if (!slideCount) return 0;
    return Math.min(100, Math.round((progress / slideCount) * 100));
  }, [progress, slideCount]);

  async function refreshDepth() {
    const res = await fetch(`${API}/api/queue`);
    const body = (await res.json()) as { depth: number };
    setDepth(body.depth);
  }

  async function submit() {
    setBusy(true);
    setDone(false);
    setProgress(0);
    setNote("Submitting…");
    const res = await fetch(`${API}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ markdown }),
    });
    const body = (await res.json()) as SubmitJobResponse;
    if (!res.ok) {
      setBusy(false);
      setNote("Submit failed.");
      return;
    }
    setJobId(body.id);
    setSlideCount(body.slideCount);
    setDepth(body.queueDepth);
    setNote(`Queued ${body.id.slice(0, 8)}…`);
  }

  return (
    <div className="app">
      <header className="masthead">
        <div>
          <h1>Deck Renderer</h1>
          <p className="lede">
            Markdown in. Slides out. The queue is live because the work is not
            happening in this tab.
          </p>
        </div>
        <div className="queue">
          <b>{depth}</b>
          <span>jobs in flight</span>
        </div>
      </header>

      <div className="layout">
        <section className="panel">
          <label htmlFor="deck">Markdown deck</label>
          <textarea
            id="deck"
            value={markdown}
            onChange={(event) => setMarkdown(event.target.value)}
          />
          <div className="actions">
            <button type="button" disabled={busy} onClick={() => void submit()}>
              Render slides
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() => setMarkdown(SAMPLE_DECK)}
            >
              Reset sample
            </button>
          </div>
        </section>

        <section className="panel">
          <p className="status">{note}</p>
          <div className="bar" aria-hidden="true">
            <i style={{ width: `${ratio}%` }} />
          </div>
          {done && jobId ? (
            <>
              <a className="pdf" href={`${API}/api/jobs/${jobId}/pdf`}>
                Download PDF
              </a>
              <div className="film">
                {Array.from({ length: slideCount }, (_, index) => (
                  <img
                    key={index}
                    alt={`Slide ${index + 1}`}
                    src={`${API}/api/jobs/${jobId}/slides/${index}`}
                  />
                ))}
              </div>
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}
