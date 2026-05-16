import { describe, expect, it } from "vitest";
import { renderDrawInnerHtml } from "./registry.ts";

describe("renderDrawInnerHtml", () => {
  it("renders flowchart template SVG", () => {
    const html = renderDrawInnerHtml({
      at: 0,
      kind: "draw",
      targetId: "d1",
      content: "fallback",
      templateId: "flowchart",
      templateParams: {
        nodes: [{ id: "a", label: "Start" }],
        edges: [],
      },
    });
    expect(html).toContain("flowchart");
    expect(html).toContain("Start");
  });
});
