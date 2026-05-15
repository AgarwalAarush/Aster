import { describe, expect, it } from "vitest";
import { renderDiagramSvg } from "./svg-primitives";
import type { StoryboardScene } from "../education/schema";

const scene: StoryboardScene = {
  title: "Scale < it >",
  narration: "For three wholes, each whole contributes two halves, making six half-groups.",
  onScreenText: "3 ÷ 1/2 becomes 3 × 2",
  visualMetaphor: "Three glass rows duplicate into six outlined units.",
  diagram: {
    type: "fractionBars",
    label: "3 < wholes >",
    values: ["3", "1/2", "6"],
  },
  motionBeats: [{ type: "drawPath", target: "diagram", at: 1 }],
};

describe("renderDiagramSvg", () => {
  it("renders safe monochrome SVG for a constrained diagram primitive", () => {
    const svg = renderDiagramSvg(scene, 2);

    expect(svg).toContain("<svg");
    expect(svg).toContain('class="diagram-svg diagram-fractionBars"');
    expect(svg).toContain("3 &lt; wholes &gt;");
    expect(svg).not.toContain("3 < wholes >");
  });

  it("renders a different structure for equation transforms", () => {
    const svg = renderDiagramSvg(
      {
        ...scene,
        diagram: {
          type: "equationTransform",
          label: "flip the divisor",
          values: ["3 ÷ 1/2", "3 × 2", "6"],
        },
      },
      1,
    );

    expect(svg).toContain("equation-step");
    expect(svg).toContain("3 × 2");
  });
});
