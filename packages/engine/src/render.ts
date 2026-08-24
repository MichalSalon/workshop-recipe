import { PDFDocument } from "pdf-lib";
import MarkdownIt from "markdown-it";
import { slideHtml } from "@deck/shared";

const markdown = new MarkdownIt({ html: false, linkify: false });

export const STUB_PNG = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082",
  "hex",
);

export type RenderDriver = "stub" | "chromium";

function spin(ms: number): void {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    Math.sqrt(Date.now());
  }
}

export function renderSlideHtml(source: string, index: number, total: number): string {
  return slideHtml(markdown.render(source), index, total);
}

export async function renderSlidePng(
  source: string,
  index: number,
  total: number,
  driver: RenderDriver,
  spinMs: number,
): Promise<Buffer> {
  if (spinMs > 0) spin(spinMs);
  if (driver !== "chromium") return STUB_PNG;

  const { chromium } = await import("playwright");
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1920, height: 1080 },
    });
    await page.setContent(renderSlideHtml(source, index, total), {
      waitUntil: "load",
    });
    return Buffer.from(await page.screenshot({ type: "png" }));
  } finally {
    await browser.close();
  }
}

export async function slidesToPdf(pngs: Buffer[]): Promise<Buffer> {
  const doc = await PDFDocument.create();
  for (const png of pngs) {
    const image = await doc.embedPng(png);
    const page = doc.addPage([1920, 1080]);
    page.drawImage(image, { x: 0, y: 0, width: 1920, height: 1080 });
  }
  return Buffer.from(await doc.save());
}
