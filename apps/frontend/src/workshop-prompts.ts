export type WorkshopPrompt = {
  id: number;
  title: string;
  text: string;
};

/** Copy-paste prompts for ZCP during the workshop (see repo PROMPTS.md). */
export const WORKSHOP_PROMPTS: WorkshopPrompt[] = [
  {
    id: 1,
    title: "Light Zerops theme",
    text: `Switch the entire workshop frontend from dark theme to a light theme matching
zerops.io: white/off-white backgrounds, Zerops teal accents, dark readable text,
and the existing zerops-logo.svg. Layout and copy stay the same. Do not change
API or worker behaviour.

1. apps/frontend/src/styles.css — replace dark :root tokens with light ones
   (background, foreground, card, primary teal, muted, border). Update .slide-prose
   for dark-on-light.

2. Replace hardcoded dark classes (bg-[#…], text-white, text-zinc-*, border-white/*,
   bg-black/*) with semantic tokens: bg-background, bg-card, bg-muted, text-foreground,
   text-muted-foreground, border-border, text-primary.

3. Update every workshop UI file — partial light fixes leave broken contrast:
   - WorkshopHome.tsx (/, hero, agenda cards, resources section, footer)
   - DeckApp.tsx (/app, editor shell, preview, benchmark panel, about, footer, modal)
   - CouponBanner.tsx (code box and pricing — no dark glass on light bg)
   - WorkshopNav.tsx, WorkshopPrompts.tsx (/prompts), WorkshopStack.tsx
   - ResourceOverprovisionBanner.tsx — amber alert must use dark text on light amber
     (text-amber-950, bg-amber-50); pale amber-on-amber is unreadable
   - draw-resources-diagram.ts — COLORS palette for light canvas (dark labels, light
     service cards, teal core header); diagram must match the page background

4. Verify /, /app, and /prompts look cohesive in light mode with readable text
   everywhere, including the resources diagram and over-provision warning on dev.`,
  },
  {
    id: 2,
    title: "Slide count in the editor",
    text: `In the Deck Renderer app (/app), show a live slide count next to the markdown
editor title — e.g. "3 slides" — that updates as the user edits markdown.

Use the existing slide parsing logic from the shared package if available; keep
the UI minimal and consistent with the current design.`,
  },
  {
    id: 3,
    title: "Basic auth on the website",
    text: `Add HTTP Basic Auth to the workshop site. Visitors must enter a username and password
before they can use the homepage (/), Deck Renderer (/app), or prompts page (/prompts).

Protect the API the same way — unauthenticated requests should get 401.

Use env vars for credentials (e.g. WORKSHOP_AUTH_USER and WORKSHOP_AUTH_PASSWORD).
Wire them in zerops.yaml for frontend and api — never hardcode usernames or passwords.`,
  },
];
