export type WorkshopPrompt = {
  id: number;
  title: string;
  text: string;
};

/** Copy-paste prompts for ZCP during the workshop (see repo PROMPTS.md). */
export const WORKSHOP_PROMPTS: WorkshopPrompt[] = [
  {
    id: 1,
    title: "Dark Zerops theme",
    text: `Switch the entire workshop frontend from the current light theme to a dark
theme: charcoal backgrounds, Zerops teal accents, light readable text, and
the existing zerops-logo.svg. Layout and copy stay the same. Do not change
API or worker behaviour.

1. apps/frontend/src/styles.css — replace light :root tokens with dark ones
   (background, foreground, card, primary teal, muted, border). Update
   .slide-prose and .inventory-prose for light-on-dark.

2. Keep semantic tokens (bg-background, bg-card, text-foreground,
   text-muted-foreground, border-border, text-primary). Flipping :root covers
   most of the UI — do not reintroduce hardcoded bg-[#…] / text-white /
   text-zinc-* on pages that already use tokens.

3. Update remaining light-only palettes — tokens alone will not fix these:
   - ResourceOverprovisionBanner.tsx — amber alert on dark: dark amber panel
     (bg-amber-950, text-amber-50); pale amber-on-amber is unreadable
   - draw-resources-diagram.ts — COLORS for dark canvas (light labels, dark
     service cards, teal core header); fill the canvas with the page background
   - download-coupon-image.ts — coupon PNG COLORS for a dark card on charcoal
   - WorkshopHome.tsx / WorkshopPrompts.tsx — grid overlay lines must be
     light-on-dark (white at ~3% opacity), not the current dark hairlines
   - apps/frontend/index.html — add class="dark" on <html>

4. Verify /, /app, /prompts, and /capabilities look cohesive in dark mode
   with readable text everywhere, including the resources diagram and
   over-provision warning on dev.`,
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
