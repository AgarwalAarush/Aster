import { describe, expect, it } from "vitest";
import { generateCompositionHtml } from "./composition";
import type { ScenePlan } from "../education/schema";

const plan: ScenePlan = {
  title: "Gravity < pulls >",
  objective: "Explain why objects fall without implying gravity is a literal hand.",
  audience: "visual learner",
  durationSeconds: 24,
  scenes: [
    {
      title: "A familiar drop",
      narration: "Drop a ball and it speeds toward Earth because Earth curves the path it can take.",
      visual: "A ball floats, then arrows bend downward.",
      emphasis: "falling follows a curved path",
    },
    {
      title: "Not a magic pull",
      narration: "Gravity is not a rope; it is the shape of motion near mass.",
      visual: "A grid bends around a glowing planet.",
      emphasis: "mass shapes motion",
    },
    {
      title: "Every object joins",
      narration: "The ball also attracts Earth, but Earth is so massive that its motion is tiny.",
      visual: "Two arrows point toward each other with different sizes.",
      emphasis: "both objects attract",
    },
    {
      title: "The takeaway",
      narration: "Objects fall because mass changes the easiest path through space and time.",
      visual: "The ball rolls along a curved guide into a recap card.",
      emphasis: "gravity guides paths",
    },
  ],
};

describe("generateCompositionHtml", () => {
  it("creates a valid Hyperframes composition with timed clips and a matching timeline", () => {
    const html = generateCompositionHtml(plan, "why does gravity pull things down?");

    expect(html).toContain('data-composition-id="aster-lesson"');
    expect(html).toContain('window.__timelines["aster-lesson"] = tl;');
    expect(html.match(/class="clip/g)).toHaveLength(12);
    expect(html).toContain('tl.set({}, {}, 24);');
  });

  it("escapes scene content before embedding it in HTML", () => {
    const html = generateCompositionHtml(plan, "question");

    expect(html).toContain("Gravity &lt; pulls &gt;");
    expect(html).not.toContain("Gravity < pulls >");
  });
});
