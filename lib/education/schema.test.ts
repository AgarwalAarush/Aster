import { describe, expect, it } from "vitest";
import { parseStoryboard } from "./schema";

const validStoryboard = {
  lesson: {
    title: "Why fractions flip",
    coreIdea: "Dividing by a fraction asks how many fraction-sized groups fit.",
    learnerLevel: "curious middle school learner",
    durationSeconds: 24,
  },
  style: "monochromeLiquidGlass",
  scenes: [
    {
      title: "The puzzle",
      narration: "Dividing by one half asks how many half-sized pieces fit in the whole.",
      onScreenText: "How many halves fit?",
      visualMetaphor: "A glass slab splits into two bright half-units.",
      diagram: {
        type: "fractionBars",
        label: "1 whole = 2 halves",
        values: ["1", "1/2", "2"],
      },
      motionBeats: [
        { type: "slidePanel", target: "scene", at: 0.2 },
        { type: "drawPath", target: "diagram", at: 1.2 },
      ],
    },
    {
      title: "The model",
      narration: "Each whole contains two halves, so every whole counts as two groups.",
      onScreenText: "Every whole contains two halves",
      visualMetaphor: "Two white capsules lock into a single black frame.",
      diagram: {
        type: "comparison",
        label: "whole vs half groups",
        values: ["whole", "halves"],
      },
      motionBeats: [{ type: "pulseNode", target: "diagram", at: 1.4 }],
    },
    {
      title: "Scale it",
      narration: "For three wholes, each whole contributes two halves, making six half-groups.",
      onScreenText: "3 wholes make 6 halves",
      visualMetaphor: "Three glass rows duplicate into six outlined units.",
      diagram: {
        type: "equationTransform",
        label: "3 ÷ 1/2 = 3 × 2 = 6",
        values: ["3 ÷ 1/2", "3 × 2", "6"],
      },
      motionBeats: [{ type: "transformEquation", target: "equation", at: 1 }],
    },
    {
      title: "The shortcut",
      narration: "Multiplying by the reciprocal is just counting those smaller groups faster.",
      onScreenText: "Divide by a fraction = multiply by its reciprocal",
      visualMetaphor: "The fraction flips inside a liquid-glass lens.",
      diagram: {
        type: "flow",
        label: "divide -> flip -> multiply",
        values: ["divide", "flip", "multiply"],
      },
      motionBeats: [
        { type: "morphBlob", target: "ambient", at: 0 },
        { type: "revealText", target: "keyLine", at: 1.6 },
      ],
    },
  ],
};

describe("parseStoryboard", () => {
  it("accepts a visual-first storyboard with constrained diagrams and motion beats", () => {
    const parsed = parseStoryboard(validStoryboard);

    expect(parsed.lesson.title).toBe("Why fractions flip");
    expect(parsed.style).toBe("monochromeLiquidGlass");
    expect(parsed.scenes).toHaveLength(4);
    expect(parsed.scenes[0]?.diagram.type).toBe("fractionBars");
    expect(parsed.scenes[2]?.motionBeats[0]?.type).toBe("transformEquation");
  });

  it("rejects arbitrary diagram primitives from model output", () => {
    expect(() =>
      parseStoryboard({
        ...validStoryboard,
        scenes: [
          {
            ...validStoryboard.scenes[0],
            diagram: {
              type: "rawHtml",
              label: "unsafe",
              values: ["<div>unsafe</div>"],
            },
          },
          ...validStoryboard.scenes.slice(1),
        ],
      }),
    ).toThrow();
  });

  it("rejects storyboards that do not have enough scenes for a complete lesson", () => {
    expect(() =>
      parseStoryboard({
        ...validStoryboard,
        scenes: validStoryboard.scenes.slice(0, 2),
      }),
    ).toThrow();
  });
});
