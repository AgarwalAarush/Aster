import { describe, expect, it, vi } from "vitest";
import { createLesson, type LessonPlannerClient } from "./lesson.ts";
import { WHITEBOARD_V2 } from "./loop/prompts/v2.ts";
import type { LectureLesson } from "./loop/schema.ts";

function makeLesson(overrides: Partial<LectureLesson> = {}): LectureLesson {
  return {
    id: "test-lesson",
    topic: {
      id: "test",
      title: "Test Topic",
      question: "Why is the sky blue?",
      domain: "ml-dl",
    },
    promptVariant: { id: "whiteboard-v2", name: "Whiteboard v2 test fixture" },
    metadata: { generator: "openai-via-test", createdAt: "2026-05-15T00:00:00Z" },
    lesson: {
      title: "Sky Blue Explained",
      learnerLevel: "intro learners",
      durationSeconds: 120,
      payoff: "Concrete payoff with a number 47 percent",
      staircase: ["rung one short", "rung two short"],
      destination: "You will hold the precise formula F equals m a after this lesson",
    },
    narration: {
      fullText:
        "narration full text body that is long enough to satisfy the minimum schema requirement of one hundred and twenty characters here ok",
      beats: [
        { atSec: 0, text: "first beat goes here", whyThisBeat: "intro the topic rung one" },
        { atSec: 60, text: "second beat goes here", whyThisBeat: "wrap rung two cleanly" },
        { atSec: 110, text: "third beat closes lesson", whyThisBeat: "land destination cleanly" },
      ],
    },
    board: {
      actions: [
        { at: 0, kind: "write", targetId: "label_a", content: "Why is the sky blue?", region: "top-left" },
        { at: 5, kind: "draw", targetId: "diagram_1", content: "two circles A and B with an arrow A to B", region: "center" },
        { at: 30, kind: "write", targetId: "label_b", content: "answer label", region: "bottom-right" },
        { at: 60, kind: "highlight", targetId: "label_a", content: "underline in red", region: "top-left" },
        { at: 100, kind: "erase", targetId: "diagram_1", content: "diagram_1", region: "center" },
      ],
    },
    ...overrides,
  };
}

function makeClient(lesson: LectureLesson): LessonPlannerClient {
  return {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: JSON.stringify(lesson) } }],
        }),
      },
    },
  };
}

describe("createLesson", () => {
  it("rejects short or whitespace questions before calling the client", async () => {
    const client = makeClient(makeLesson());
    await expect(createLesson("   ", { client })).rejects.toThrow("Question is required");
    await expect(createLesson("short", { client })).rejects.toThrow("Question is required");
    expect(client.chat.completions.create).not.toHaveBeenCalled();
  });

  it("sends WHITEBOARD_V2 system prompt and a substituted user prompt", async () => {
    const lesson = makeLesson();
    const client = makeClient(lesson);
    await createLesson("Why is the sky blue?", { client });

    const calls = (client.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls).toHaveLength(1);
    const request = calls[0][0];
    expect(request.messages[0].role).toBe("system");
    expect(request.messages[0].content).toBe(WHITEBOARD_V2.systemPrompt);
    expect(request.messages[1].role).toBe("user");
    expect(request.messages[1].content).toContain("Why is the sky blue?");
    expect(request.response_format).toEqual({ type: "json_object" });
  });

  it("returns the parsed LectureLesson on success", async () => {
    const lesson = makeLesson();
    const client = makeClient(lesson);
    const result = await createLesson("Why is the sky blue?", { client });
    expect(result.lesson.title).toBe("Sky Blue Explained");
    expect(result.board.actions).toHaveLength(5);
  });

  it("throws when the OpenAI response content is empty", async () => {
    const client: LessonPlannerClient = {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({ choices: [{ message: { content: null } }] }),
        },
      },
    };
    await expect(createLesson("Why is the sky blue?", { client })).rejects.toThrow(
      "OpenAI returned an empty lesson",
    );
  });

  it("throws with a parse reason when the response is malformed JSON", async () => {
    const client: LessonPlannerClient = {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{ message: { content: "not json at all" } }],
          }),
        },
      },
    };
    await expect(createLesson("Why is the sky blue?", { client })).rejects.toThrow(/Lesson parse failed/);
  });
});
