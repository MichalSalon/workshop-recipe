import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  ImageDown,
  Layers,
  Loader2,
  Play,
  RotateCcw,
} from "lucide-react";
import MarkdownIt from "markdown-it";
import { splitSlides, type JobEvent, type SubmitJobResponse } from "@deck/shared";
import { SAMPLE_DECK } from "./sample";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(
  /\/$/,
  "",
);

const LINKS = {
  home: "https://zerops.io",
  app: "https://app.zerops.io",
  docs: "https://docs.zerops.io",
  discord: "https://discord.gg/zeropsio",
  github: "https://github.com/zeropsio/workshop-recipe",
  org: "https://github.com/zeropsio",
} as const;

const markdown = new MarkdownIt({ html: false, linkify: false });

function wsUrl(): string {
  const url = new URL(API);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws";
  return url.toString();
}

export function App() {
  const [source, setSource] = useState(SAMPLE_DECK);
  const [depth, setDepth] = useState(0);
  const [busy, setBusy] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [slideCount, setSlideCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [note, setNote] = useState("Idle — submit a deck.");
  const [failed, setFailed] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [previewIndex, setPreviewIndex] = useState(0);

  const drafts = useMemo(() => splitSlides(source), [source]);
  const preview = drafts[Math.min(previewIndex, drafts.length - 1)] ?? "";

  useEffect(() => {
    if (previewIndex > drafts.length - 1) setPreviewIndex(Math.max(0, drafts.length - 1));
  }, [drafts.length, previewIndex]);

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
        setFailed(false);
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
        setFailed(false);
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

  const phase = failed
    ? "failed"
    : done
      ? "complete"
      : busy
        ? "rendering"
        : "idle";

  async function refreshDepth() {
    const res = await fetch(`${API}/api/queue`);
    const body = (await res.json()) as { depth: number };
    setDepth(body.depth);
  }

  async function submit() {
    setBusy(true);
    setDone(false);
    setFailed(false);
    setProgress(0);
    setNote("Submitting…");
    const res = await fetch(`${API}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ markdown: source }),
    });
    const body = (await res.json()) as SubmitJobResponse;
    if (!res.ok) {
      setBusy(false);
      setFailed(true);
      setNote("Submit failed.");
      return;
    }
    setJobId(body.id);
    setSlideCount(body.slideCount);
    setDepth(body.queueDepth);
    setNote(`Queued ${body.id.slice(0, 8)}…`);
  }

  async function downloadPngs() {
    if (!jobId || !slideCount) return;
    setExporting(true);
    try {
      for (let index = 0; index < slideCount; index += 1) {
        const res = await fetch(`${API}/api/jobs/${jobId}/slides/${index}`);
        if (!res.ok) throw new Error("png export failed");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `slide-${String(index + 1).padStart(2, "0")}.png`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      setNote("PNG export failed.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="min-h-svh bg-[#1b1d21]">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white text-zinc-950">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-4 sm:px-6">
          <a href={LINKS.home} className="flex items-center gap-2.5">
            <img src="/zerops-logo.png" alt="Zerops" className="size-8 object-contain" />
            <span className="text-sm font-semibold tracking-tight text-zinc-950">
              Zerops
            </span>
          </a>
          <Button
            asChild
            className="h-8 rounded-full bg-zinc-950 px-4 text-white hover:bg-zinc-800"
          >
            <a href={LINKS.app} target="_blank" rel="noreferrer">
              Open Zerops
              <ExternalLink />
            </a>
          </Button>
        </div>
      </header>

      <section className="px-4 pb-6 pt-14 text-center sm:px-6 sm:pt-16">
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-5xl">
          Turn your Markdown into a slide deck
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-zinc-400 sm:text-base">
          Workers on Zerops render each section to PNG and PDF. The queue in
          this tab is live because the work is not.
        </p>
      </section>

      <section className="mx-auto w-full max-w-[1200px] px-4 pb-16 sm:px-6">
        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#111317] shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5">
            <div className="flex items-center gap-3 text-sm text-zinc-400">
              <span>Markdown → slides</span>
              <span className="hidden h-4 w-px bg-white/10 sm:block" />
              <span className="hidden items-center gap-1.5 sm:flex">
                <Layers className="size-3.5 text-primary" />
                <span className="tabular-nums text-primary">{depth}</span>
                in flight
              </span>
              <Badge
                variant={
                  phase === "failed"
                    ? "destructive"
                    : phase === "complete"
                      ? "default"
                      : "secondary"
                }
              >
                {phase}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {done && jobId ? (
                <>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`${API}/api/jobs/${jobId}/pdf`}>
                      <Download />
                      Download PDF
                    </a>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={exporting}
                    onClick={() => void downloadPngs()}
                  >
                    {exporting ? <Loader2 className="animate-spin" /> : <ImageDown />}
                    {slideCount === 1 ? "Download PNG" : "Download PNGs"}
                  </Button>
                </>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowGuide((open) => !open)}
              >
                {showGuide ? "Hide instructions" : "Show instructions"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSource(SAMPLE_DECK);
                  setPreviewIndex(0);
                }}
              >
                <RotateCcw />
                Reset
              </Button>
              <Button type="button" size="sm" disabled={busy} onClick={() => void submit()}>
                {busy ? <Loader2 className="animate-spin" /> : <Play />}
                Create slides
              </Button>
            </div>
          </div>

          <div
            className={cn(
              "grid min-h-[34rem]",
              showGuide ? "lg:grid-cols-2" : "grid-cols-1",
            )}
          >
            <label className="sr-only" htmlFor="deck">
              Markdown deck
            </label>
            <Textarea
              id="deck"
              value={source}
              onChange={(event) => setSource(event.target.value)}
              spellCheck={false}
              placeholder="Paste or type Markdown here."
              className="min-h-[34rem] resize-none rounded-none border-0 bg-transparent px-5 py-4 font-mono text-[13px] leading-relaxed shadow-none focus-visible:ring-0"
            />

            {showGuide ? (
              <aside className="border-t border-white/10 p-6 text-sm leading-relaxed text-zinc-300 lg:border-l lg:border-t-0">
                <h2 className="text-base font-semibold text-white">
                  Markdown → presentation
                </h2>
                <p className="mt-2 text-zinc-400">{note}</p>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>
                      {slideCount
                        ? `${progress} / ${slideCount} rendered`
                        : `${drafts.length} draft slide${drafts.length === 1 ? "" : "s"}`}
                    </span>
                    <span className="tabular-nums">{ratio}%</span>
                  </div>
                  <Progress value={ratio} />
                </div>

                <h3 className="mt-6 font-semibold text-white">Separate slides</h3>
                <p className="mt-1 text-zinc-400">
                  Use a line that is only <code className="text-primary">---</code>{" "}
                  between slides. The worker renders what you typed — no outbound
                  fetches.
                </p>
                <pre className="mt-3 overflow-x-auto rounded-md bg-black/40 px-3 py-2 font-mono text-xs text-zinc-200">
                  {`# Title slide\n\n---\n\n## Second slide`}
                </pre>

                <h3 className="mt-6 font-semibold text-white">Markdown syntax</h3>
                <table className="mt-2 w-full text-left text-xs">
                  <thead className="text-zinc-500">
                    <tr>
                      <th className="py-1 font-medium">Markdown</th>
                      <th className="py-1 font-medium">Output</th>
                    </tr>
                  </thead>
                  <tbody className="text-zinc-300">
                    <tr className="border-t border-white/10">
                      <td className="py-1.5 font-mono"># Heading 1</td>
                      <td>Title</td>
                    </tr>
                    <tr className="border-t border-white/10">
                      <td className="py-1.5 font-mono">## Heading 2</td>
                      <td>Section</td>
                    </tr>
                    <tr className="border-t border-white/10">
                      <td className="py-1.5 font-mono">**bold**</td>
                      <td>
                        <strong>bold</strong>
                      </td>
                    </tr>
                    <tr className="border-t border-white/10">
                      <td className="py-1.5 font-mono">`code`</td>
                      <td>
                        <code>code</code>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {done && jobId ? (
                  <div className="mt-6 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={`${API}/api/jobs/${jobId}/pdf`}>
                          <Download />
                          Download PDF
                        </a>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={exporting}
                        onClick={() => void downloadPngs()}
                      >
                        {exporting ? <Loader2 className="animate-spin" /> : <ImageDown />}
                        {slideCount === 1 ? "Download PNG" : "Download PNGs"}
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {Array.from({ length: slideCount }, (_, index) => (
                        <a
                          key={index}
                          href={`${API}/api/jobs/${jobId}/slides/${index}?download=1`}
                          download={`slide-${String(index + 1).padStart(2, "0")}.png`}
                          className="overflow-hidden rounded-md border border-white/10"
                        >
                          <img
                            alt={`Slide ${index + 1}`}
                            src={`${API}/api/jobs/${jobId}/slides/${index}`}
                            className="aspect-video w-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white">Live preview</h3>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          disabled={previewIndex === 0}
                          onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
                        >
                          <ChevronLeft />
                        </Button>
                        <span className="min-w-12 text-center text-xs tabular-nums text-zinc-500">
                          {previewIndex + 1} / {drafts.length}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          disabled={previewIndex >= drafts.length - 1}
                          onClick={() =>
                            setPreviewIndex((i) => Math.min(drafts.length - 1, i + 1))
                          }
                        >
                          <ChevronRight />
                        </Button>
                      </div>
                    </div>
                    <div className="slide-prose mt-3 aspect-video overflow-auto rounded-md border border-white/10 bg-black/40 p-6">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: markdown.render(preview),
                        }}
                      />
                    </div>
                  </div>
                )}
              </aside>
            ) : null}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#14161a] px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold text-white">About this tool</h2>
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-zinc-400">
              Paste Markdown, split slides on <code className="text-zinc-200">---</code>,
              and send the job to workers running on{" "}
              <a
                href={LINKS.home}
                className="text-primary underline-offset-4 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                Zerops
              </a>
              . The API accepts the job on HTTP 200; progress arrives here over a
              WebSocket.
            </p>
          </div>
          <ol className="space-y-3 text-sm text-zinc-300">
            <li>
              <span className="font-medium text-white">1. Write slides</span>
              <p className="text-zinc-400">Markdown in the editor on the left.</p>
            </li>
            <li>
              <span className="font-medium text-white">2. Create the deck</span>
              <p className="text-zinc-400">
                Workers render each section to PNG, then a PDF.
              </p>
            </li>
            <li>
              <span className="font-medium text-white">3. Export</span>
              <p className="text-zinc-400">Download PNG slides or the full PDF.</p>
            </li>
          </ol>
        </div>
      </section>

      <footer className="border-t border-white/10 px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-8 sm:flex-row sm:justify-between">
          <a href={LINKS.home} className="flex items-center gap-2">
            <img src="/zerops-logo.png" alt="" className="size-7 object-contain" />
            <span className="text-sm font-medium text-white">Zerops</span>
          </a>
          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Product</p>
              <a className="block text-zinc-300 hover:text-white" href={LINKS.home}>
                zerops.io
              </a>
              <a className="block text-zinc-300 hover:text-white" href={LINKS.app}>
                App
              </a>
              <a className="block text-zinc-300 hover:text-white" href={LINKS.docs}>
                Docs
              </a>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Community</p>
              <a className="block text-zinc-300 hover:text-white" href={LINKS.discord}>
                Discord
              </a>
              <a className="block text-zinc-300 hover:text-white" href={LINKS.org}>
                GitHub
              </a>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-zinc-500">This recipe</p>
              <a className="block text-zinc-300 hover:text-white" href={LINKS.github}>
                workshop-recipe
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
