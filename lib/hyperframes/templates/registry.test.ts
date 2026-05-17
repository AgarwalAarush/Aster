import { describe, expect, it } from "vitest";
import { renderDrawInnerHtml, parseTemplateParams } from "./registry.ts";

describe("renderDrawInnerHtml", () => {
  it("renders flowchart template SVG via layout engine", () => {
    const html = renderDrawInnerHtml({
      at: 0,
      kind: "draw",
      targetId: "d1",
      content: "fallback",
      templateId: "flowchart",
      templateParams: {
        nodes: [
          { id: "a", label: "Start" },
          { id: "b", label: "End" },
        ],
        edges: [{ from: "a", to: "b" }],
      },
    });
    expect(html).toContain("box-graph");
    expect(html).toContain("Start");
    expect(html).toContain("End");
  });

  it("renders box-graph with topology layout", () => {
    const html = renderDrawInnerHtml({
      at: 0,
      kind: "draw",
      targetId: "g1",
      content: "fallback",
      templateId: "box-graph",
      templateParams: {
        nodes: [
          { id: "x", label: "X" },
          { id: "y", label: "Y" },
          { id: "z", label: "Z" },
        ],
        edges: [
          { from: "x", to: "y" },
          { from: "y", to: "z" },
        ],
        layout: "horizontal",
      },
    });
    expect(html).toContain('data-node-id="z"');
  });

  it("renders matrix-math with katex", () => {
    const html = renderDrawInnerHtml({
      at: 0,
      kind: "draw",
      targetId: "m1",
      content: "fallback",
      templateId: "matrix-math",
      templateParams: {
        matrix: [
          ["1", "0"],
          ["0", "1"],
        ],
      },
    });
    expect(html).toContain("katex");
  });
});

describe("parseTemplateParams", () => {
  it("parses bar-chart params", () => {
    const p = parseTemplateParams("bar-chart", {
      bars: [{ label: "A", value: 3 }],
    });
    expect(p.bars).toHaveLength(1);
    expect(p.bars[0]?.value).toBe(3);
  });
});
