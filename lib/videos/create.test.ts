import { describe, expect, it } from "vitest";
import { createVideoFromQuestion } from "./create.ts";
import type { LectureLesson } from "../education/loop/schema.ts";

const lesson: LectureLesson = {
  id: "sky-blue-001",
  topic: {
    id: "sky-blue",
    title: "Why the sky is blue",
    question: "Why is the sky blue?",
    domain: "ml-dl",
  },
  promptVariant: { id: "whiteboard-v2", name: "Whiteboard v2 test fixture" },
  metadata: { generator: "openai-via-test", createdAt: "2026-05-15T00:00:00Z" },
  lesson: {
    title: "Why the Sky Is Blue",
    learnerLevel: "curious learner",
    durationSeconds: 90,
    payoff: "Blue light scatters about ten times more than red light, painting the whole sky",
    staircase: ["sunlight is many colors", "air scatters short wavelengths"],
    destination:
      "You will hold the rule that Rayleigh scattering goes as one over wavelength to the fourth power, explaining why blue dominates",
  },
  narration: {
    fullText:
      "narration full text body that is long enough to satisfy the minimum one hundred and twenty character requirement here ok",
    beats: [
      { atSec: 0, text: "sunlight enters the air", whyThisBeat: "introduce the topic rung one" },
      { atSec: 45, text: "blue light scatters most", whyThisBeat: "wrap rung two cleanly" },
    ],
  },
  board: {
    actions: [
      { at: 0, kind: "write", targetId: "title_lbl", content: "Why the Sky Is Blue", region: "top-left" },
      { at: 10, kind: "draw", targetId: "diagram_1", content: "white light splits into colors", region: "center" },
    ],
  },
};

describe("createVideoFromQuestion", () => {
  it("creates a lesson and returns a product-facing video response", async () => {
    const result = await createVideoFromQuestion("Why is the sky blue?", {
      planLesson: async (question) => {
        expect(question).toBe("Why is the sky blue?");
        return lesson;
      },
      renderLesson: async (lessonArg, question) => {
        expect(lessonArg).toBe(lesson);
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
    expect(result.title).toBe("Why the Sky Is Blue");
    expect("lesson" in result).toBe(false);
  });

  it("rejects very short questions before doing expensive work", async () => {
    let called = false;

    await expect(
      createVideoFromQuestion("why?", {
        planLesson: async () => {
          called = true;
          return lesson;
        },
        renderLesson: async () => {
          called = true;
          throw new Error("should not render");
        },
      }),
    ).rejects.toThrow("Enter a more specific question");
    expect(called).toBe(false);
  });
});
