import { describe, expect, it } from "vitest";
import { createVideoFromQuestion } from "./create";
import type { Storyboard } from "../education/schema";

const storyboard: Storyboard = {
  lesson: {
    title: "Why the sky is blue",
    coreIdea: "Air scatters shorter blue wavelengths across the sky.",
    learnerLevel: "curious learner",
    durationSeconds: 24,
  },
  style: "monochromeLiquidGlass",
  scenes: [
    {
      title: "Sunlight arrives",
      narration: "White sunlight carries many colors as it enters the air.",
      onScreenText: "Sunlight enters the atmosphere",
      visualMetaphor: "A white wave passes through glass particles.",
      diagram: { type: "wave", label: "white light", values: ["white", "blue", "red"] },
      motionBeats: [{ type: "drawPath", target: "diagram", at: 0.8 }],
    },
    {
      title: "Tiny particles",
      narration: "Air molecules scatter shorter blue waves more than red waves.",
      onScreenText: "Blue scatters more",
      visualMetaphor: "Small bright particles redirect thin white lines.",
      diagram: { type: "particles", label: "scatter", values: ["air", "blue"] },
      motionBeats: [{ type: "scatterParticles", target: "particles", at: 1 }],
    },
    {
      title: "Every direction",
      narration: "Scattered blue light reaches your eyes from all across the sky.",
      onScreenText: "Light reaches you from every direction",
      visualMetaphor: "A dome of fine lines bends toward an eye.",
      diagram: { type: "orbit", label: "sky dome", values: ["sky", "eye"] },
      motionBeats: [{ type: "pulseNode", target: "diagram", at: 1.2 }],
    },
    {
      title: "The recap",
      narration: "The sky looks blue because air redirects blue light toward us.",
      onScreenText: "Air redirects blue light",
      visualMetaphor: "A black lens reveals a clean white takeaway.",
      diagram: { type: "flow", label: "light path", values: ["sun", "air", "eye"] },
      motionBeats: [{ type: "revealText", target: "keyLine", at: 1.4 }],
    },
  ],
};

describe("createVideoFromQuestion", () => {
  it("creates a storyboard and returns a product-facing video response", async () => {
    const result = await createVideoFromQuestion("Why is the sky blue?", {
      planStoryboard: async (question) => {
        expect(question).toBe("Why is the sky blue?");
        return storyboard;
      },
      renderStoryboard: async (visualStoryboard, question) => {
        expect(visualStoryboard).toBe(storyboard);
        expect(question).toBe("Why is the sky blue?");
        return {
          jobId: "job-abc",
          jobDir: "/tmp/job-abc",
          outputPath: "/tmp/job-abc.mp4",
          publicUrl: "/renders/job-abc.mp4",
        };
      },
    });

    expect(result.video.publicUrl).toBe("/renders/job-abc.mp4");
    expect(result.title).toBe("Why the sky is blue");
    expect("storyboard" in result).toBe(false);
  });

  it("rejects very short questions before doing expensive work", async () => {
    let called = false;

    await expect(
      createVideoFromQuestion("why?", {
        planStoryboard: async () => {
          called = true;
          return storyboard;
        },
        renderStoryboard: async () => {
          called = true;
          throw new Error("should not render");
        },
      }),
    ).rejects.toThrow("Enter a more specific question");
    expect(called).toBe(false);
  });
});
