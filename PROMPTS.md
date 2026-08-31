# ZCP workshop prompts

Copy-paste these into ZCP during the workshop. Each prompt is scoped so the agent
can finish in a few minutes without touching unrelated parts of the app.

---

## 1. Fix deployment resources (using too many)

```
We're using too many resources in workshop-dev. The homepage "My resources"
section shows an amber warning — frontend, api, and worker each run
3 containers instead of 1 like the AI Agent recipe.

import-app.yaml only sets the initial state when the project is imported; it
does not change a running project. Scale the live services in ZCP:
- frontend, api, worker: set horizontal autoscaling to 1 container each

db, cache, and queue are fine — leave them as-is.

After scaling, update apps/frontend/src/config/resources-dev.json so the
homepage diagram matches (1 container on those three). The amber warning and
"TOO BIG" badges should disappear and monthly cost should drop.
```

---

## 2. Light Zerops theme

```
Switch the workshop homepage and Deck Renderer SPA from the current dark theme to a
light theme that matches zerops.io — white/off-white backgrounds, Zerops teal accents,
dark text, and the existing zerops-logo.svg.

Keep layout and copy the same. Update apps/frontend/src/styles.css and the React
components (WorkshopHome, DeckApp, CouponBanner) so both / and /app feel cohesive
in light mode. Do not change API or worker behaviour.
```

---

## 3. Slide count in the editor

```
In the Deck Renderer app (/app), show a live slide count next to the markdown
editor title — e.g. "3 slides" — that updates as the user edits markdown.

Use the existing slide parsing logic from the shared package if available; keep
the UI minimal and consistent with the current design.
```

---

## 4. Sample deck picker

```
Add a small "Load sample" control on the Deck Renderer editor that inserts the
welcome fixture deck (fixtures/welcome.md) into the textarea with one click.

Include a confirmation if the editor already has content. Keep it a simple button
or dropdown — no new routes.
```

---

## 5. Keyboard shortcut to render

```
Add a keyboard shortcut (Cmd/Ctrl + Enter) on the Deck Renderer page to submit
the current markdown for rendering, same as clicking the main render button.

Show a subtle hint near the button ("⌘↵ to render"). Guard against double-submit
while a job is in progress.
```
