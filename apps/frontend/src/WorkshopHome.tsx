import type { ReactNode } from "react";
import {
  ArrowRight,
  Bot,
  Bug,
  Layers,
  Rocket,
  Scale,
  Terminal,
  Ticket,
} from "lucide-react";
import { WorkshopNav } from "@/components/WorkshopNav";
import { SiteLogo } from "@/SiteLogo";
import { CouponBanner } from "@/CouponBanner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResourceOverprovisionBanner } from "@/components/ResourceOverprovisionBanner";
import { ResourcesDiagram } from "@/components/ResourcesDiagram";
import { WorkshopStack } from "@/components/WorkshopStack";
import {
  activeResourceConfig,
  analyzeResourceConfig,
  workshopEnv,
} from "@/lib/workshop-resources";
import { AGENDA, LINKS, WORKSHOP } from "@/workshop-config";

const PILLS = [
  { label: "AI coding agent", Icon: Bot },
  { label: "ZCP workspace", Icon: Terminal },
  { label: "Multi-service app", Icon: Layers },
  { label: "Scale & observe", Icon: Scale },
  { label: "Production control", Icon: Bug },
] as const;

const SECTION = "px-4 py-16 sm:px-6 lg:py-20";
const CONTAINER = "mx-auto max-w-6xl lg:max-w-5xl";
const SECTION_TITLE = "text-2xl font-semibold tracking-tight text-white sm:text-[1.625rem]";
const SECTION_DESC = "mt-3 max-w-2xl text-base leading-relaxed text-zinc-400";
const SECTION_BODY = "mt-8";

function SectionHeader({
  title,
  description,
  aside,
}: {
  title: string;
  description: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <h2 className={SECTION_TITLE}>{title}</h2>
        <div className={`${SECTION_DESC} space-y-2`}>
          {typeof description === "string" ? <p>{description}</p> : description}
        </div>
      </div>
      {aside ? <p className="shrink-0 text-sm text-zinc-500">{aside}</p> : null}
    </div>
  );
}

type WorkshopHomeProps = {
  onOpenApp?: () => void;
  onOpenPrompts?: () => void;
};

export function WorkshopHome({ onOpenApp, onOpenPrompts }: WorkshopHomeProps) {
  const resourceConfig = activeResourceConfig();
  const resourceAnalysis = analyzeResourceConfig(resourceConfig);
  const isDevProject = workshopEnv() === "dev";

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

      <WorkshopNav
        current="home"
        onOpenPrompts={onOpenPrompts}
        onOpenApp={onOpenApp}
      />

      <main className="relative z-10">
        <section className={`${CONTAINER} px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:pt-20`}>
          <Badge
            variant="secondary"
            className="mb-5 border border-primary/20 bg-primary/10 text-primary hover:bg-primary/10"
          >
            <Rocket className="size-3" />
            Zerops workshop
          </Badge>

          <h1 className="max-w-4xl text-balance text-3xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            From Prompt to Prod:{" "}
            <span className="bg-gradient-to-r from-primary via-teal-200 to-primary bg-clip-text text-transparent">
              Build and Deploy with ZCP
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-400 sm:mt-6 sm:text-lg">
            {WORKSHOP.description}
          </p>

          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Button
              size="lg"
              className="h-[3.25rem] w-full px-8 text-base font-semibold shadow-[0_0_50px_-10px_rgba(94,234,212,0.65)] transition-shadow hover:shadow-[0_0_60px_-8px_rgba(94,234,212,0.8)] sm:w-auto"
              asChild={!onOpenApp}
              onClick={onOpenApp}
            >
              {onOpenApp ? (
                <>
                  Open Deck Renderer
                  <ArrowRight />
                </>
              ) : (
                <a href="/app">
                  Open Deck Renderer
                  <ArrowRight />
                </a>
              )}
            </Button>
            <a
              href="#coupon"
              className="inline-flex items-center gap-1.5 text-sm text-zinc-400 underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              <Ticket className="size-4" aria-hidden="true" />
              Get your workshop coupon
            </a>
          </div>

          <ul className="mt-10 flex flex-wrap gap-2">
            {PILLS.map(({ label, Icon }) => (
              <li key={label}>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300">
                  <Icon className="size-3.5 text-primary" />
                  {label}
                </span>
              </li>
            ))}
          </ul>

        </section>

        <section className={`border-y border-white/10 bg-[#0f1115]/80 ${SECTION}`}>
          <div className={CONTAINER}>
            <SectionHeader
              title="What you did"
              description="You used the Zerops recipe to deploy the stack, debugged on the platform, then extended the app in ZCP with predefined prompts."
              aside="Markdown → workers → PNG/PDF"
            />

            <ol className={`${SECTION_BODY} grid gap-4 sm:grid-cols-2 lg:grid-cols-4`}>
              {AGENDA.map(({ step, title, body }) => (
                <li key={step}>
                  <Card className="h-full border-white/10 bg-[#161922]/80 shadow-none">
                    <CardHeader className="space-y-3 pb-2">
                      <span className="font-mono text-xs text-primary">{step}</span>
                      <CardTitle className="text-base text-white">{title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-zinc-400">{body}</CardDescription>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="coupon" className={`scroll-mt-20 border-b border-white/10 ${SECTION}`}>
          <div className={CONTAINER}>
            <CouponBanner embedded />
          </div>
        </section>

        <section className={`border-y border-white/10 bg-[#0f1115]/80 ${SECTION}`}>
          <div className={CONTAINER}>
            <SectionHeader
              title="My resources"
              description="Live allocation for this project — same layout as the Zerops recipe resources diagram, with monthly cost from platform pricing."
            />

            {isDevProject && resourceAnalysis.oversizedServices.length > 0 ? (
              <div className={SECTION_BODY}>
                <ResourceOverprovisionBanner analysis={resourceAnalysis} />
              </div>
            ) : null}

            <div
              className={`${isDevProject && resourceAnalysis.oversizedServices.length > 0 ? "mt-6" : SECTION_BODY} overflow-hidden rounded-xl border border-white/10 bg-[#161922]/60 p-4 sm:p-6`}
            >
              <ResourcesDiagram config={resourceConfig} highlightOversized={isDevProject} />
            </div>
          </div>
        </section>

        <section className={SECTION}>
          <div className={CONTAINER}>
            <SectionHeader
              title="The stack you deployed"
              description="Six services on Zerops — frontend, API, worker, PostgreSQL, NATS, and Valkey — from the recipe you deployed."
            />

            <WorkshopStack className={SECTION_BODY} />
          </div>
        </section>
      </main>

      <footer className={`relative z-10 border-t border-white/10 ${SECTION} pb-12 pt-10`}>
        <div className={`${CONTAINER} flex flex-col gap-8 sm:flex-row sm:justify-between`}>
          <a href={LINKS.zerops} target="_blank" rel="noreferrer" className="text-white">
            <SiteLogo />
          </a>
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Product</p>
              <a className="block text-zinc-400 hover:text-white" href={LINKS.zerops}>
                zerops.io
              </a>
              <a className="block text-zinc-400 hover:text-white" href={LINKS.app}>
                App
              </a>
              <a className="block text-zinc-400 hover:text-white" href={LINKS.docs}>
                Docs
              </a>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Community</p>
              <a className="block text-zinc-400 hover:text-white" href={LINKS.discord}>
                Discord
              </a>
              <a className="block text-zinc-400 hover:text-white" href={LINKS.github}>
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
