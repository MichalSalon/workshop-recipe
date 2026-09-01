import { describe, expect, it } from "vitest";
import { renderAllSlides } from "@deck/engine";
import { contentHash, splitSlides } from "@deck/shared";

describe("splitSlides", () => {
  it("splits on a --- line", () => {
    expect(splitSlides("# One\n\n---\n\n# Two")).toEqual(["# One", "# Two"]);
  });

  it("keeps a single slide when there is no divider", () => {
    expect(splitSlides("# Only")).toEqual(["# Only"]);
  });

  it("does not treat --- inside a paragraph as a divider", () => {
    expect(splitSlides("see a-b --- c")).toEqual(["see a-b --- c"]);
  });
});

describe("stub renderer", () => {
  it("paints a full-size slide instead of a 1×1 placeholder", async () => {
    const [png] = await renderAllSlides(["# Deck Renderer\n\nSubmit markdown."], "stub", 0);
    expect(png).toBeDefined();
    expect(png!.readUInt32BE(16)).toBe(1920);
    expect(png!.readUInt32BE(20)).toBe(1080);
    expect(png!.byteLength).toBeGreaterThan(2000);
  });
});

describe("contentHash", () => {
  it("is stable for the same markdown", async () => {
    expect(await contentHash("abc")).toBe(await contentHash("abc"));
  });
});
