import { describe, expect, it } from "vitest";
import { generateCompositionHtml } from "./composition";
import type { Storyboard } from "../education/schema";

const storyboard: Storyboard = {
  lesson: {
    title: "Gravity < pulls >",
    coreIdea: "Mass changes the paths objects follow.",
    learnerLevel: "visual learner",
    durationSeconds: 24,
  },
  style: "monochromeLiquidGlass",
  scenes: [
    {
      title: "A familiar drop",
      narration: "Drop a ball and it speeds toward Earth because Earth curves the path it can take.",
      onScreenText: "Falling follows a curved path",
      visualMetaphor: "A white orb bends across a black glass grid.",
      diagram: { type: "orbit", label: "curved path", values: ["path", "mass"] },
      motionBeats: [{ type: "drawPath", target: "diagram", at: 0.8 }],
    },
    {
      title: "Not a magic pull",
      narration: "Gravity is not a rope; it is the shape of motion near mass.",
      onScreenText: "Mass shapes motion",
      visualMetaphor: "A glass lens distorts a clean line field.",
      diagram: { type: "wave", label: "curved grid", values: ["mass"] },
      motionBeats: [{ type: "morphBlob", target: "ambient", at: 0.5 }],
    },
    {
      title: "Every object joins",
      narration: "The ball also attracts Earth, but Earth is so massive that its motion is tiny.",
      onScreenText: "Both objects attract",
      visualMetaphor: "Two monochrome nodes pulse at different sizes.",
      diagram: { type: "comparison", label: "large and small mass", values: ["Earth", "ball"] },
      motionBeats: [{ type: "pulseNode", target: "diagram", at: 1 }],
    },
    {
      title: "The takeaway",
      narration: "Objects fall because mass changes the easiest path through space and time.",
      onScreenText: "Gravity guides paths",
      visualMetaphor: "A final black lens reveals one bright line.",
      diagram: { type: "flow", label: "mass to path", values: ["mass", "path", "fall"] },
      motionBeats: [{ type: "revealText", target: "keyLine", at: 1.4 }],
    },
  ],
};

describe("generateCompositionHtml", () => {
  it("creates a visual Hyperframes composition with SVG diagrams and a matching timeline", () => {
    const html = generateCompositionHtml(storyboard, "why does gravity pull things down?");

    expect(html).toContain('data-composition-id="aster-lesson"');
    expect(html).toContain('window.__timelines["aster-lesson"] = tl;');
    expect(html.match(/class="clip/g)).toHaveLength(4);
    expect(html).toContain("liquid-glass");
    expect(html).toContain("diagram-svg");
    expect(html).toContain("drawSVGPath");
    expect(html).toContain('tl.set({}, {}, 24);');
  });

  it("escapes storyboard content before embedding it in HTML", () => {
    const html = generateCompositionHtml(storyboard, "question");

    expect(html).toContain("Gravity &lt; pulls &gt;");
    expect(html).not.toContain("Gravity < pulls >");
  });
});
