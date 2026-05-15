import { describe, expect, it } from "vitest";
import { createScenePlan, type ScenePlannerClient } from "./script";

const responsePlan = {
  title: "Photosynthesis in one minute",
  objective: "Explain how plants turn light into stored food.",
  audience: "visual learner",
  durationSeconds: 24,
  scenes: [
    {
      title: "Light arrives",
      narration: "A leaf catches sunlight like a tiny solar panel.",
      visual: "Golden rays land on a simplified leaf.",
      emphasis: "plants capture light energy",
    },
    {
      title: "Ingredients",
      narration: "Water rises from roots while carbon dioxide enters through small openings.",
      visual: "Blue droplets and CO2 dots move into the leaf.",
      emphasis: "water + carbon dioxide",
    },
    {
      title: "Conversion",
      narration: "Inside the leaf, light powers a chemical rearrangement.",
      visual: "Atoms shuffle into a glowing sugar cube.",
      emphasis: "light powers the reaction",
    },
    {
      title: "Stored food",
      narration: "The plant stores sugar for growth and releases oxygen as a bonus.",
      visual: "Sugar travels down the stem while oxygen bubbles float away.",
      emphasis: "sugar stored, oxygen released",
    },
  ],
};

describe("createScenePlan", () => {
  it("asks OpenAI for structured educational scenes and parses the result", async () => {
    const calls: unknown[] = [];
    const fakeClient: ScenePlannerClient = {
      chat: {
        completions: {
          create: async (request) => {
            calls.push(request);
            return {
              choices: [
                {
                  message: {
                    content: JSON.stringify(responsePlan),
                  },
                },
              ],
            };
          },
        },
      },
    };

    const plan = await createScenePlan("How does photosynthesis work?", {
      client: fakeClient,
      model: "test-model",
    });

    expect(plan.title).toBe("Photosynthesis in one minute");
    expect(plan.scenes).toHaveLength(4);
    expect(calls).toHaveLength(1);
    expect(JSON.stringify(calls[0])).toContain("How does photosynthesis work?");
  });

  it("rejects empty questions before calling OpenAI", async () => {
    let called = false;
    const fakeClient: ScenePlannerClient = {
      chat: {
        completions: {
          create: async () => {
            called = true;
            throw new Error("should not be called");
          },
        },
      },
    };

    await expect(createScenePlan("   ", { client: fakeClient })).rejects.toThrow(
      "Question is required",
    );
    expect(called).toBe(false);
  });
});
