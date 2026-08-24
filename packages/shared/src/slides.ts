const DIVIDER = /^\s*---\s*$/m;

export function splitSlides(markdown: string): string[] {
  const parts = markdown
    .split(DIVIDER)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length > 0) return parts;
  const fallback = markdown.trim();
  return [fallback.length > 0 ? fallback : "# Empty deck"];
}

export function slideHtml(markdownHtml: string, index: number, total: number): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <style>
    html, body {
      margin: 0;
      width: 1920px;
      height: 1080px;
      background: #14110e;
      color: #f4efe6;
      font-family: "Liberation Sans", "Noto Sans", "DejaVu Sans", sans-serif;
    }
    .slide {
      box-sizing: border-box;
      height: 100%;
      padding: 96px 120px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    h1, h2, h3 { margin: 0 0 24px; letter-spacing: -0.03em; }
    h1 { font-size: 88px; }
    h2 { font-size: 64px; }
    p, li { font-size: 36px; line-height: 1.45; }
    .meta {
      position: absolute;
      right: 64px;
      bottom: 48px;
      opacity: 0.45;
      font-size: 22px;
    }
  </style>
</head>
<body>
  <article class="slide">${markdownHtml}</article>
  <div class="meta">${index + 1} / ${total}</div>
</body>
</html>`;
}
