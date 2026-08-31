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
editor title — e.g. "3 slides" — that updates as the user types. Do not change
API or worker behaviour. Do not use the job \`slideCount\` state — that is
rendered-slide progress after submit, not the live draft count.

1. apps/frontend/src/DeckApp.tsx — the editor pane (left column) has only an
   sr-only <label> today. Add a visible header above the textarea that matches
   the "Live preview" header on the right:
   - Title: "Markdown"
   - Count: "\${drafts.length} slide" / "slides" (pluralize)
   - tabular-nums + muted text, same weight as the preview pager (1 / N)

2. Reuse the existing \`drafts\` memo. It already calls \`splitSlides(source)\`
   from \`@deck/shared\` (split on a line that is only \`---\`). Do not write a
   second parser.

3. Verify on /app: the sample deck shows "3 slides"; deleting a \`---\` divider
   drops the count immediately; an empty editor shows "1 slide"
   (\`splitSlides\` fallback). The live preview pager still matches drafts.length.`,
  },
  {
    id: 3,
    title: "Basic auth on the website",
    text: `Add HTTP Basic Auth so visitors must sign in before using the workshop site
(/, /app, /prompts, /capabilities) and before calling the API. Credentials
come from env vars — never hardcode a username or password, and never bake
them into the Vite bundle (no VITE_* secrets). Leave /health open so Zerops
readiness checks keep passing. Do not change worker behaviour.

1. apps/api/src/app.ts — Fastify onRequest hook:
   - If WORKSHOP_AUTH_USER or WORKSHOP_AUTH_PASSWORD is unset, skip auth
     (local \`npm run dev\` and existing tests stay open)
   - Always allow GET /health
   - Allow /ws (browsers cannot send Basic headers on WebSocket)
   - Everything else requires Authorization: Basic … matching the env vars
   - On failure: 401 and WWW-Authenticate: Basic realm="Workshop"
   - CORS must allow the Authorization header

2. apps/frontend — small login gate wrapping App (e.g. WorkshopAuthGate):
   - On load, GET \${VITE_API_URL}/api/queue with no credentials
   - 200 → auth is off, render the app
   - 401 → show a username/password form (match workshop dark UI, teal button)
   - On submit, retry /api/queue with Basic; store the header value in
     sessionStorage so a refresh does not re-prompt
   - Gate every workshop route — not just the deck editor

3. apps/frontend/src/DeckApp.tsx — send the stored Authorization header on
   every fetch to the API (queue, jobs, slides, pdf). Do not send it on the
   WebSocket URL.

4. zerops.yaml — add WORKSHOP_AUTH_USER and WORKSHOP_AUTH_PASSWORD under
   run.envVariables for api and api-dev only. Do not put literal values in
   the yaml; set the secrets in the Zerops UI. Never KEY: \${KEY} (self-shadow:
   the literal \${...} string is what gets injected). Do not add these to
   frontend, worker, or worker-dev.

5. Verify: with env unset, / and /app work as today and GET /health is 200.
   With both env vars set, a request without Authorization gets 401; /health
   stays 200; after signing in, the homepage and deck app work and Create
   slides succeeds.`,
  },
];
