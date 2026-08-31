import { ArrowRight, ClipboardList } from "lucide-react";
import { SiteLogo } from "@/SiteLogo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LINKS } from "@/workshop-config";

export type WorkshopNavPage = "home" | "prompts";

type WorkshopNavProps = {
  current?: WorkshopNavPage;
  onOpenHome?: () => void;
  onOpenPrompts?: () => void;
  onOpenApp?: () => void;
};

const navLink =
  "rounded-md px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-white";

export function WorkshopNav({
  current,
  onOpenHome,
  onOpenPrompts,
  onOpenApp,
}: WorkshopNavProps) {
  return (
    <header className="relative z-10 border-b border-white/10 bg-[#12141a]/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:max-w-5xl">
        <a href={LINKS.zerops} target="_blank" rel="noreferrer" className="shrink-0 text-white">
          <SiteLogo />
        </a>

        <nav className="flex flex-1 items-center justify-end gap-1 sm:gap-2">
          {onOpenHome ? (
            <button
              type="button"
              className={cn(navLink, current === "home" && "bg-white/5 text-white")}
              onClick={onOpenHome}
            >
              Home
            </button>
          ) : (
            <a
              href="/"
              className={cn(navLink, current === "home" && "bg-white/5 text-white")}
            >
              Home
            </a>
          )}

          {onOpenPrompts ? (
            <button
              type="button"
              className={cn(
                navLink,
                "inline-flex items-center gap-1.5",
                current === "prompts" && "bg-white/5 text-white",
              )}
              onClick={onOpenPrompts}
            >
              <ClipboardList className="size-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">ZCP prompts</span>
              <span className="sm:hidden">Prompts</span>
            </button>
          ) : (
            <a
              href="/prompts"
              className={cn(
                navLink,
                "inline-flex items-center gap-1.5",
                current === "prompts" && "bg-white/5 text-white",
              )}
            >
              <ClipboardList className="size-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">ZCP prompts</span>
              <span className="sm:hidden">Prompts</span>
            </a>
          )}

          <Button size="sm" className="ml-1 sm:ml-2" asChild={!onOpenApp} onClick={onOpenApp}>
            {onOpenApp ? (
              <>
                Open app
                <ArrowRight />
              </>
            ) : (
              <a href="/app">
                Open app
                <ArrowRight />
              </a>
            )}
          </Button>
        </nav>
      </div>
    </header>
  );
}
