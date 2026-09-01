import { useEffect, useState } from "react";
import {
  capabilityMarkdownUrl,
  openInChatGptUrl,
  openInClaudeUrl,
} from "@/workshop-config";
import { cn } from "@/lib/utils";

type AskAgentLinksProps = {
  className?: string;
  compact?: boolean;
};

export function AskAgentLinks({ className, compact = false }: AskAgentLinksProps) {
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const markdownUrl = origin ? capabilityMarkdownUrl(origin) : "/capabilities.md";

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-2", className)}>
      <a
        href={openInClaudeUrl(markdownUrl)}
        target="_blank"
        rel="noreferrer"
        className={askClass(compact)}
      >
        Open in Claude
      </a>
      <a
        href={openInChatGptUrl(markdownUrl)}
        target="_blank"
        rel="noreferrer"
        className={askClass(compact)}
      >
        Open in ChatGPT
      </a>
      <a href="/capabilities.md" target="_blank" rel="noreferrer" className={askClass(compact)}>
        Raw markdown
      </a>
    </div>
  );
}

function askClass(compact: boolean): string {
  return compact
    ? "rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
    : "inline-flex h-8 items-center rounded-md border border-border bg-background px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground";
}
