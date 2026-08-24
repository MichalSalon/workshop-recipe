export const SAMPLE_DECK = `# Deck Renderer

Submit markdown. Workers turn each section into a slide.

---

## How it splits

Use a line that is only \`---\` between slides.

No outbound fetches. The worker renders what you typed.

---

## Watch the queue

Queue depth and per-slide progress land in this browser over a WebSocket
while the API stays on HTTP 200 for the submit itself.
`;
