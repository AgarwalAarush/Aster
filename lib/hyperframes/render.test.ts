import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderLesson } from "./render.ts";
import type { LectureLesson } from "../education/loop/schema.ts";

const lesson: LectureLesson = {
  id: "ice-floats-001",
  topic: {
    id: "ice-floats",
    title: "Why ice floats",
    question: "Why does ice float on water?",
    domain: "ml-dl",
  },
  promptVariant: { id: "whiteboard-v2", name: "Whiteboard v2 test fixture" },
  metadata: { generator: "openai-via-test", createdAt: "2026-05-15T00:00:00Z" },
  lesson: {
    title: "Why Ice Floats on Water",
    learnerLevel: "curious learner",
    durationSeconds: 90,
    payoff: "Ice is roughly 9 percent less dense than liquid water, so it always floats",
    staircase: ["density definition", "water expands when frozen", "less dense floats"],
    destination:
      "You will hold the rule density = mass / volume and know that ice has lower density than liquid water due to its open hexagonal crystal structure",
  },
  narration: {
    fullText:
      "narration full text body that is long enough to satisfy the minimum one hundred and twenty character requirement here ok",
    beats: [
      { atSec: 0, text: "first beat of narration content", whyThisBeat: "introduce the topic rung one" },
      { atSec: 45, text: "second beat closes the lesson", whyThisBeat: "wrap rung two cleanly" },
    ],
  },
  board: {
    actions: [
      { at: 0, kind: "write", targetId: "title_lbl", content: "Why Ice Floats", region: "top-left" },
      { at: 10, kind: "draw", targetId: "diagram_1", content: "water molecules in lattice", region: "center" },
    ],
  },
};

describe("renderLesson", () => {
  it("writes a whiteboard composition and runs Hyperframes lint before render", async () => {
    const root = await mkdtemp(join(tmpdir(), "aster-render-"));
    const commands: Array<{ command: string; args: string[]; cwd?: string }> = [];

    const result = await renderLesson(lesson, "Why does ice float?", {
      generatedRoot: join(root, "generated"),
      rendersRoot: join(root, "renders"),
      jobId: "job-123",
      runCommand: async (command, args, options) => {
        commands.push({ command, args, cwd: options.cwd });
      },
    });

    await expect(stat(join(root, "generated", "job-123", "index.html"))).resolves.toBeTruthy();
    await expect(readFile(join(root, "generated", "job-123", "question.txt"), "utf8")).resolves.toBe(
      "Why does ice float?",
    );
    await expect(readFile(join(root, "generated", "job-123", "lesson.json"), "utf8")).resolves.toContain(
      "whiteboard-v2",
    );
    expect(result.publicUrl).toBe("/renders/job-123.mp4");
    expect(commands).toEqual([
      {
        command: "npx",
        args: ["hyperframes", "lint", join(root, "generated", "job-123")],
        cwd: undefined,
      },
      {
        command: "npx",
        args: [
          "hyperframes",
          "render",
          "--output",
          join(root, "renders", "job-123.mp4"),
          "--quality",
          "standard",
        ],
        cwd: join(root, "generated", "job-123"),
      },
    ]);
  });
});
