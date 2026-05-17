import { describe, expect, it } from "vitest";
import { layoutGraph } from "./layout.ts";
import { validateGraph } from "./validate.ts";

describe("layoutGraph", () => {
  it("places a horizontal chain left-to-right", () => {
    const result = layoutGraph({
      nodes: [
        { id: "a", label: "A" },
        { id: "b", label: "B" },
        { id: "c", label: "C" },
      ],
      edges: [
        { from: "a", to: "b" },
        { from: "b", to: "c" },
      ],
      layout: "horizontal",
    });
    const a = result.nodes.find((n) => n.id === "a")!;
    const c = result.nodes.find((n) => n.id === "c")!;
    expect(c.x).toBeGreaterThan(a.x);
  });

  it("layers a DAG so edges point downward", () => {
    const result = layoutGraph({
      nodes: [
        { id: "a", label: "Input" },
        { id: "b", label: "Hidden" },
        { id: "c", label: "Output" },
      ],
      edges: [
        { from: "a", to: "b" },
        { from: "b", to: "c" },
      ],
      layout: "layered",
    });
    const a = result.nodes.find((n) => n.id === "a")!;
    const c = result.nodes.find((n) => n.id === "c")!;
    expect(c.y).toBeGreaterThan(a.y);
  });
});

describe("validateGraph", () => {
  it("warns on dangling edges", () => {
    const v = validateGraph({
      nodes: [{ id: "a", label: "A" }],
      edges: [{ from: "a", to: "missing" }],
    });
    expect(v.warnings.length).toBeGreaterThan(0);
    expect(v.ok).toBe(false);
  });
});
