import { useCallback, useState } from "react";
import { Check, Copy } from "lucide-react";
import { WorkshopNav } from "@/components/WorkshopNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WORKSHOP_PROMPTS } from "@/workshop-prompts";

const CONTAINER = "mx-auto max-w-6xl lg:max-w-5xl";
const SECTION = "px-4 py-16 sm:px-6 lg:py-20";

type WorkshopPromptsProps = {
  onOpenHome?: () => void;
  onOpenApp?: () => void;
};

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function PromptCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(text);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
      {copied ? (
        <>
          <Check />
          Copied
        </>
      ) : (
        <>
          <Copy />
          Copy prompt
        </>
      )}
    </Button>
  );
}

export function WorkshopPrompts({ onOpenHome, onOpenApp }: WorkshopPromptsProps) {
  const [allCopied, setAllCopied] = useState(false);

  const copyAll = useCallback(async () => {
    const body = WORKSHOP_PROMPTS.map(
      (prompt) => `## ${prompt.id}. ${prompt.title}\n\n${prompt.text}`,
    ).join("\n\n---\n\n");
    const ok = await copyToClipboard(body);
    if (!ok) return;
    setAllCopied(true);
    window.setTimeout(() => setAllCopied(false), 2000);
  }, []);

  return (
    <div className="relative min-h-svh overflow-x-hidden bg-[#12141a] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(94,234,212,0.18),transparent)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]"
      />

      <WorkshopNav current="prompts" onOpenHome={onOpenHome} onOpenApp={onOpenApp} />

      <main className="relative z-10">
        <section className={`${CONTAINER} px-4 pb-8 pt-12 sm:px-6 sm:pt-16 lg:pt-20`}>
          <Badge
            variant="secondary"
            className="mb-5 border border-primary/20 bg-primary/10 text-primary hover:bg-primary/10"
          >
            Workshop
          </Badge>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">ZCP prompts</h1>
              <p className="mt-3 text-base leading-relaxed text-zinc-400">
                Copy-paste these into ZCP during the workshop. Each prompt is scoped so the agent
                can finish in a few minutes without touching unrelated parts of the app.
              </p>
            </div>

            <Button type="button" variant="secondary" onClick={copyAll}>
              {allCopied ? (
                <>
                  <Check />
                  All copied
                </>
              ) : (
                <>
                  <Copy />
                  Copy all
                </>
              )}
            </Button>
          </div>
        </section>

        <section className={`border-t border-white/10 bg-[#0f1115]/80 ${SECTION}`}>
          <div className={`${CONTAINER} space-y-6`}>
            {WORKSHOP_PROMPTS.map((prompt) => (
              <Card key={prompt.id} className="border-white/10 bg-[#161922]/80 shadow-none">
                <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                  <div className="space-y-1">
                    <p className="font-mono text-xs text-primary">{String(prompt.id).padStart(2, "0")}</p>
                    <CardTitle className="text-lg text-white">{prompt.title}</CardTitle>
                    <CardDescription className="text-zinc-500">
                      Paste into ZCP and send — no edits needed.
                    </CardDescription>
                  </div>
                  <PromptCopyButton text={prompt.text} />
                </CardHeader>
                <CardContent>
                  <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-[#12141a] p-4 font-mono text-sm leading-relaxed text-zinc-300">
                    {prompt.text}
                  </pre>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
