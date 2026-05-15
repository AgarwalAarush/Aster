import { describe, expect, it } from "vitest";
import { createVideoFromQuestion } from "./create";
import type { ScenePlan } from "../education/schema";

const plan: ScenePlan = {
  title: "Why the sky is blue",
  objective: "Explain scattering with a simple light analogy.",
  audience: "curious learner",
  durationSeconds: 24,
  scenes: [
    {
      title: "Sunlight arrives",
      narration: "White sunlight carries many colors as it enters the air.",
      visual: "A white beam enters a field of small air dots.",
      emphasis: "sunlight contains many colors",
    },
    {
      title: "Tiny particles",
      narration: "Air molecules scatter shorter blue waves more than red waves.",
      visual: "Blue waves bounce outward while red waves pass through.",
      emphasis: "blue scatters more",
    },
    {
      title: "Every direction",
      narration: "Scattered blue light reaches your eyes from all across the sky.",
      visual: "Blue arrows arrive from the whole dome above.",
      emphasis: "blue comes from everywhere",
    },
    {
      title: "The recap",
      narration: "The sky looks blue because air redirects blue light toward us.",
      visual: "A final sky dome fills with soft blue.",
      emphasis: "air redirects blue light",
    },
  ],
};

describe("createVideoFromQuestion", () => {
  it("creates a scene plan and renders it into a video response", async () => {
    const result = await createVideoFromQuestion("Why is the sky blue?", {
      planQuestion: async (question) => {
        expect(question).toBe("Why is the sky blue?");
        return plan;
      },
      renderPlan: async (scenePlan, question) => {
        expect(scenePlan).toBe(plan);
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
    expect(result.plan.title).toBe("Why the sky is blue");
  });

  it("rejects very short questions before doing expensive work", async () => {
    let called = false;

    await expect(
      createVideoFromQuestion("why?", {
        planQuestion: async () => {
          called = true;
          return plan;
        },
        renderPlan: async () => {
          called = true;
          throw new Error("should not render");
        },
      }),
    ).rejects.toThrow("Enter a more specific question");
    expect(called).toBe(false);
  });
});
