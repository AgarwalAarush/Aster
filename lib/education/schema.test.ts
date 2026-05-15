import { describe, expect, it } from "vitest";
import { parseScenePlan } from "./schema";

const validPlan = {
  title: "Why fractions flip",
  objective: "Explain division by fractions with an intuitive sharing model.",
  audience: "curious middle school learner",
  durationSeconds: 24,
  scenes: [
    {
      title: "The puzzle",
      narration: "Dividing by one half asks how many half-sized pieces fit in the whole.",
      visual: "A whole bar splits into two glowing half-bars.",
      emphasis: "division asks how many groups fit",
    },
    {
      title: "The model",
      narration: "Each whole contains two halves, so every whole counts as two groups.",
      visual: "Two bracket labels appear above the halves.",
      emphasis: "1 divided by 1/2 equals 2",
    },
    {
      title: "Scale it",
      narration: "For three wholes, each whole contributes two halves, making six half-groups.",
      visual: "Three bars become six highlighted half-pieces.",
      emphasis: "3 divided by 1/2 equals 6",
    },
    {
      title: "The shortcut",
      narration: "Multiplying by the reciprocal is just counting those smaller groups faster.",
      visual: "The fraction flips as the grouped pieces snap into a final equation.",
      emphasis: "divide by a fraction = multiply by its reciprocal",
    },
  ],
};

describe("parseScenePlan", () => {
  it("accepts a compact educational plan with four scenes", () => {
    const parsed = parseScenePlan(validPlan);

    expect(parsed.title).toBe("Why fractions flip");
    expect(parsed.scenes).toHaveLength(4);
  });

  it("rejects plans that do not have enough scenes for a useful video", () => {
    expect(() =>
      parseScenePlan({
        ...validPlan,
        scenes: validPlan.scenes.slice(0, 2),
      }),
    ).toThrow();
  });
});
