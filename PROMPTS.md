# ZCP workshop prompts

Copy-paste these into ZCP during the workshop. Each prompt is scoped so the agent
can finish in a few minutes without touching unrelated parts of the app.

---

## 1. Light Zerops theme

```
Switch the workshop homepage and Deck Renderer SPA from the current dark theme to a
light theme that matches zerops.io — white/off-white backgrounds, Zerops teal accents,
dark text, and the existing zerops-logo.svg.

Keep layout and copy the same. Update apps/frontend/src/styles.css and the React
components (WorkshopHome, DeckApp, CouponBanner) so both / and /app feel cohesive
in light mode. Do not change API or worker behaviour.
```

---

## 2. Slide count in the editor

```
In the Deck Renderer app (/app), show a live slide count next to the markdown
editor title — e.g. "3 slides" — that updates as the user edits markdown.

Use the existing slide parsing logic from the shared package if available; keep
the UI minimal and consistent with the current design.
```

---

## 3. Basic auth on the website

```
Add HTTP Basic Auth to the workshop site. Visitors must enter a username and password
before they can use the homepage (/), Deck Renderer (/app), or prompts page (/prompts).

Protect the API the same way — unauthenticated requests should get 401.

Use env vars for credentials (e.g. WORKSHOP_AUTH_USER and WORKSHOP_AUTH_PASSWORD).
Wire them in zerops.yaml for frontend and api — never hardcode usernames or passwords.
```
