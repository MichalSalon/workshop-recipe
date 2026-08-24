import { describe, expect, it } from "vitest";
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

describe("contentHash", () => {
  it("is stable for the same markdown", async () => {
    expect(await contentHash("abc")).toBe(await contentHash("abc"));
  });
});
