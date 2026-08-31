export const WORKSHOP = {
  title: "From Prompt to Prod: Build and Deploy with ZCP",
  tagline: "Build and Deploy with ZCP",
  description:
    "You built a real app with an AI coding agent and took it from prompt to deployment with ZCP — a multi-service stack on Zerops, scaled and debugged while keeping production under control.",
  /** Hostname fragments that identify the workshop-dev Zerops project (not prod). */
  devProjectHostnameMarkers: ["workshop-dev", "frontenddev", "apidev"] as const,
  /** Hostname fragments for workshop-prod — hide the over-provision prompt there. */
  prodProjectHostnameMarkers: ["workshop-prod"] as const,
  coupon: {
    code: "CYC2026",
    verificationPaymentUsd: 10,
    defaultBonusUsd: 50,
    workshopBonusUsd: 100,
    defaultTotalUsd: 75,
    workshopTotalUsd: 125,
  },
  repo: "https://github.com/zeropsio/workshop-recipe",
  appName: "Deck Renderer",
} as const;

export const LINKS = {
  zerops: "https://zerops.io",
  app: "https://app.zerops.io",
  /** Credit & Spend — top-up and coupon entry after signup. */
  payment: "https://app.zerops.io/dashboard/finances",
  paymentDocs: "https://docs.zerops.io/company/payment",
  docs: "https://docs.zerops.io",
  recipeDocs: "https://docs.zerops.io/recipes",
  discord: "https://discord.gg/zeropsio",
  github: "https://github.com/zeropsio",
} as const;

/** Promo top-up link — coupon code is URL-safe base64 without padding. */
export function couponPromoUrl(code: string): string {
  const encoded = btoa(code).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `https://app.zerops.io/promo/${encoded}/top-up`;
}

export const AGENDA = [
  {
    step: "01",
    title: "Used the recipe",
    body: "Imported the Deck Renderer from `.zerops-recipe/` and deployed the full stack — frontend, API, worker, PostgreSQL, NATS, and Valkey.",
  },
  {
    step: "02",
    title: "Deployed",
    body: "Ran pipelines, opened the app, scaled workers, and watched markdown flow through the queue to PNG/PDF slides.",
  },
  {
    step: "03",
    title: "Debugged",
    body: "Queried logs by hostname, traced jobs across services, and kept production credentials out of the agent's hands.",
  },
  {
    step: "04",
    title: "Used ZCP prompts",
    body: "Extended the app with predefined workshop prompts — right-size resources, tweak the UI, add auth, and more.",
  },
] as const;

export const STACK = [
  { name: "frontend", role: "Vite SPA" },
  { name: "api", role: "REST + WebSocket" },
  { name: "worker", role: "Chromium renders" },
  { name: "db", role: "PostgreSQL" },
  { name: "queue", role: "NATS jobs" },
  { name: "cache", role: "Valkey progress" },
] as const;
