import { describe, expect, it } from "vitest";
import { validateRegionOccupancy } from "./schema.ts";
import type { LectureLesson } from "./schema.ts";

function baseLesson(actions: LectureLesson["board"]["actions"]): LectureLesson {
  return {
    id: "x-001",
    topic: { id: "x", title: "X", question: "Why x?", domain: "ml-dl" },
    promptVariant: { id: "v5", name: "v5" },
    metadata: { generator: "test", createdAt: "2026-05-16T00:00:00Z" },
    lesson: {
      title: "X",
      learnerLevel: "intro",
      durationSeconds: 60,
      payoff: "Payoff with 3x improvement stake for the learner audience",
      staircase: ["a"],
      destination: "Formula X",
    },
    narration: {
      fullText: "x".repeat(120),
      beats: [{ atSec: 0, text: "beat one here", whyThisBeat: "rung" }],
    },
    board: { actions },
  };
}

describe("validateRegionOccupancy", () => {
  it("warns when reusing a region without erase", () => {
    const issues = validateRegionOccupancy(
      baseLesson([
        { at: 0, kind: "write", targetId: "a", content: "A", region: "center" },
        { at: 5, kind: "write", targetId: "b", content: "B", region: "center" },
      ]),
    );
    expect(issues.some((i) => i.includes("reuses region=center"))).toBe(true);
  });
});
