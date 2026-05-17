import { describe, expect, it } from "vitest";
import { renderLayoutChrome } from "./render-chrome.ts";

describe("renderLayoutChrome", () => {
  it("renders full layout pane", () => {
    const html = renderLayoutChrome({ id: "full" });
    expect(html).toContain("layout-full");
    expect(html).toContain("pane-full");
  });

  it("renders split with divider at 50-50", () => {
    const html = renderLayoutChrome({ id: "split-vertical", ratio: "50-50", divider: true });
    expect(html).toContain("layout-split-vertical");
    expect(html).toContain("layout-divider");
    expect(html).toContain('data-ratio="50-50"');
  });

  it("renders split at 33-67 without divider", () => {
    const html = renderLayoutChrome({ id: "split-vertical", ratio: "33-67", divider: false });
    expect(html).toContain("33.333%");
    expect(html).not.toContain("layout-divider");
  });
});
