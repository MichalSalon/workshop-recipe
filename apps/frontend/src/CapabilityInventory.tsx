import { useMemo } from "react";
import MarkdownIt from "markdown-it";
import inventoryMarkdown from "@/content/zerops-capability-inventory.md?raw";
import { AskAgentLinks } from "@/components/AskAgentLinks";
import { WorkshopNav } from "@/components/WorkshopNav";
import { LINKS } from "@/workshop-config";

const markdown = new MarkdownIt({ html: false, linkify: true });

type CapabilityInventoryProps = {
  onOpenHome?: () => void;
  onOpenPrompts?: () => void;
  onOpenApp?: () => void;
};

export function CapabilityInventory({ onOpenHome, onOpenPrompts, onOpenApp }: CapabilityInventoryProps) {
  const html = useMemo(() => markdown.render(inventoryMarkdown), []);

  return (
    <div className="relative min-h-svh overflow-x-hidden bg-background text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(2,179,164,0.12),transparent)]"
      />

      <WorkshopNav
        current="capabilities"
        onOpenHome={onOpenHome}
        onOpenPrompts={onOpenPrompts}
        onOpenApp={onOpenApp}
      />

      <main className="relative z-10 mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Static markdown · August 2026</p>
            <a
              href={LINKS.capabilityGist}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-xs text-primary underline-offset-4 hover:underline"
            >
              gist.github.com/fxck/abb186df2df39e672063baa6273c7de1
            </a>
          </div>
          <AskAgentLinks />
        </div>

        <article
          className="inventory-prose"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </main>
    </div>
  );
}
