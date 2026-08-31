export type WorkshopPrompt = {
  id: number;
  title: string;
  text: string;
};

/** Copy-paste prompts for ZCP during the workshop (see repo PROMPTS.md). */
export const WORKSHOP_PROMPTS: WorkshopPrompt[] = [
  {
    id: 1,
    title: "Fix deployment resources (using too many)",
    text: `We're using too many resources in workshop-dev. The homepage "My resources"
section shows an amber warning — frontend, api, and worker each run
3 containers instead of 1 like the AI Agent recipe.

import-app.yaml only sets the initial state when the project is imported; it
does not change a running project. Scale the live services in ZCP:
- frontend, api, worker: set horizontal autoscaling to 1 container each

db, cache, and queue are fine — leave them as-is.

After scaling, update apps/frontend/src/config/resources-dev.json so the
homepage diagram matches (1 container on those three). The amber warning and
"TOO BIG" badges should disappear and monthly cost should drop.`,
  },
  {
    id: 2,
    title: "Light Zerops theme",
    text: `Switch the workshop homepage and Deck Renderer SPA from the current dark theme to a
light theme that matches zerops.io — white/off-white backgrounds, Zerops teal accents,
dark text, and the existing zerops-logo.svg.

Keep layout and copy the same. Update apps/frontend/src/styles.css and the React
components (WorkshopHome, DeckApp, CouponBanner) so both / and /app feel cohesive
in light mode. Do not change API or worker behaviour.`,
  },
  {
    id: 3,
    title: "Slide count in the editor",
    text: `In the Deck Renderer app (/app), show a live slide count next to the markdown
editor title — e.g. "3 slides" — that updates as the user edits markdown.

Use the existing slide parsing logic from the shared package if available; keep
the UI minimal and consistent with the current design.`,
  },
  {
    id: 4,
    title: "Basic auth on the website",
    text: `Add HTTP Basic Auth to the workshop site. Visitors must enter a username and password
before they can use the homepage (/), Deck Renderer (/app), or prompts page (/prompts).

Protect the API the same way — unauthenticated requests should get 401.

Use env vars for credentials (e.g. WORKSHOP_AUTH_USER and WORKSHOP_AUTH_PASSWORD).
Wire them in zerops.yaml for frontend and api — never hardcode usernames or passwords.`,
  },
  {
    id: 5,
    title: "Keyboard shortcut to render",
    text: `Add a keyboard shortcut (Cmd/Ctrl + Enter) on the Deck Renderer page to submit
the current markdown for rendering, same as clicking the main render button.

Show a subtle hint near the button ("⌘↵ to render"). Guard against double-submit
while a job is in progress.`,
  },
];
