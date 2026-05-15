import { describe, expect, it } from "vitest";
import { createStoryboard, type StoryboardPlannerClient } from "./script";

const responseStoryboard = {
  lesson: {
    title: "Photosynthesis in glass",
    coreIdea: "Plants use light to rearrange water and carbon dioxide into stored sugar.",
    learnerLevel: "visual learner",
    durationSeconds: 24,
  },
  style: "monochromeLiquidGlass",
  scenes: [
    {
      title: "Light arrives",
      narration: "A leaf catches sunlight like a tiny solar panel.",
      onScreenText: "Light enters the leaf",
      visualMetaphor: "White rays bend through a glass leaf silhouette.",
      diagram: {
        type: "wave",
        label: "incoming light",
        values: ["light", "leaf"],
      },
      motionBeats: [{ type: "drawPath", target: "diagram", at: 0.8 }],
    },
    {
      title: "Ingredients",
      narration: "Water rises from roots while carbon dioxide enters through small openings.",
      onScreenText: "Water and carbon dioxide move in",
      visualMetaphor: "Two streams of white particles converge inside a frosted panel.",
      diagram: {
        type: "particles",
        label: "inputs",
        values: ["water", "CO2"],
      },
      motionBeats: [{ type: "scatterParticles", target: "particles", at: 0.6 }],
    },
    {
      title: "Conversion",
      narration: "Inside the leaf, light powers a chemical rearrangement.",
      onScreenText: "Light powers the rearrangement",
      visualMetaphor: "Particles snap into a crystal-like sugar mark.",
      diagram: {
        type: "equationTransform",
        label: "light + inputs -> sugar",
        values: ["light", "water + CO2", "sugar"],
      },
      motionBeats: [{ type: "transformEquation", target: "equation", at: 1.1 }],
    },
    {
      title: "Stored food",
      narration: "The plant stores sugar for growth and releases oxygen as a bonus.",
      onScreenText: "Sugar stays. Oxygen leaves.",
      visualMetaphor: "A bright sugar node sinks while oxygen dots drift upward.",
      diagram: {
        type: "flow",
        label: "outputs",
        values: ["sugar", "oxygen"],
      },
      motionBeats: [{ type: "revealText", target: "keyLine", at: 1.5 }],
    },
  ],
};

describe("createStoryboard", () => {
  it("asks OpenAI for a constrained visual storyboard and parses the result", async () => {
    const calls: unknown[] = [];
    const fakeClient: StoryboardPlannerClient = {
      chat: {
        completions: {
          create: async (request) => {
            calls.push(request);
            return {
              choices: [
                {
                  message: {
                    content: JSON.stringify(responseStoryboard),
                  },
                },
              ],
            };
          },
        },
      },
    };

    const storyboard = await createStoryboard("How does photosynthesis work?", {
      client: fakeClient,
      model: "test-model",
    });

    expect(storyboard.lesson.title).toBe("Photosynthesis in glass");
    expect(storyboard.style).toBe("monochromeLiquidGlass");
    expect(storyboard.scenes[0]?.diagram.type).toBe("wave");
    expect(calls).toHaveLength(1);
    expect(JSON.stringify(calls[0])).toContain("How does photosynthesis work?");
    expect(JSON.stringify(calls[0])).toContain("monochromeLiquidGlass");
    expect(JSON.stringify(calls[0])).toContain("diagram");
  });

  it("rejects empty questions before calling OpenAI", async () => {
    let called = false;
    const fakeClient: StoryboardPlannerClient = {
      chat: {
        completions: {
          create: async () => {
            called = true;
            throw new Error("should not be called");
          },
        },
      },
    };

    await expect(createStoryboard("   ", { client: fakeClient })).rejects.toThrow(
      "Question is required",
    );
    expect(called).toBe(false);
  });
});
