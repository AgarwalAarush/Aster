import { describe, expect, it } from "vitest";
import type { LectureLesson } from "../loop/schema.ts";
import { getActiveBoardActionsAt, formatBoardStateTable } from "./board-state.ts";

function lessonWithActions(
  actions: LectureLesson["board"]["actions"],
  durationSeconds = 60,
): LectureLesson {
  return {
    id: "t-001",
    topic: { id: "test", title: "T", question: "Why?", domain: "ml-dl" },
    promptVariant: { id: "v5", name: "v5" },
    metadata: { generator: "test", createdAt: "2026-05-16T00:00:00Z" },
    lesson: {
      title: "Test",
      learnerLevel: "intro",
      durationSeconds,
      payoff: "Concrete payoff with a 2x speedup stake for learners",
      staircase: ["a", "b"],
      destination: "Hold formula F",
    },
    narration: {
      fullText: "x".repeat(120),
      beats: [{ atSec: 0, text: "intro beat here", whyThisBeat: "rung" }],
    },
    board: { actions },
  };
}

describe("getActiveBoardActionsAt", () => {
  it("detects overlapping regions at a timestamp", () => {
    const lesson = lessonWithActions([
      { at: 0, kind: "write", targetId: "a", content: "A", region: "center" },
      { at: 5, kind: "write", targetId: "b", content: "B", region: "center" },
    ]);
    const active = getActiveBoardActionsAt(lesson, 10);
    expect(active).toHaveLength(2);
    const table = formatBoardStateTable(lesson, [10]);
    expect(table).toContain("WARNING: multiple visible items share a region");
  });

  it("respects erase before showing new state", () => {
    const lesson = lessonWithActions([
      { at: 0, kind: "write", targetId: "a", content: "A", region: "center" },
      { at: 5, kind: "erase", targetId: "a", content: "a", region: "center" },
      { at: 6, kind: "write", targetId: "b", content: "B", region: "center" },
    ]);
    const active = getActiveBoardActionsAt(lesson, 10);
    expect(active.map((a) => a.targetId)).toEqual(["b"]);
  });
});
