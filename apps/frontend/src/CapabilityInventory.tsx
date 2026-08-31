import { useMemo } from "react";
import MarkdownIt from "markdown-it";
import inventoryMarkdown from "@/content/zerops-capability-inventory.md?raw";
import { AskAgentLinks } from "@/components/AskAgentLinks";
import { WorkshopNav } from "@/components/WorkshopNav";

const markdown = new MarkdownIt({ html: false, linkify: true });

type CapabilityInventoryProps = {
  onOpenHome?: () => void;
  onOpenPrompts?: () => void;
  onOpenApp?: () => void;
};

export function CapabilityInventory({ onOpenHome, onOpenPrompts, onOpenApp }: CapabilityInventoryProps) {
  const html = useMemo(() => markdown.render(inventoryMarkdown), []);

  return (
    <div className="relative min-h-svh overflow-x-hidden bg-[#12141a] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(94,234,212,0.18),transparent)]"
      />

      <WorkshopNav
        current="capabilities"
        onOpenHome={onOpenHome}
        onOpenPrompts={onOpenPrompts}
        onOpenApp={onOpenApp}
      />

      <main className="relative z-10 mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-500">Static markdown · August 2026</p>
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
