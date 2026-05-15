import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderScenePlan } from "./render";
import type { ScenePlan } from "../education/schema";

const plan: ScenePlan = {
  title: "Why ice floats",
  objective: "Explain density with an everyday water example.",
  audience: "curious learner",
  durationSeconds: 24,
  scenes: [
    {
      title: "The surprise",
      narration: "Ice floats because frozen water takes up more space than liquid water.",
      visual: "An ice cube rests above a water line.",
      emphasis: "more space, same stuff",
    },
    {
      title: "Density",
      narration: "Density compares how much matter is packed into each bit of space.",
      visual: "Packed dots and spread dots appear side by side.",
      emphasis: "density = matter per space",
    },
    {
      title: "Water expands",
      narration: "When water freezes, its molecules lock into an open crystal pattern.",
      visual: "Dots snap into a hexagon lattice.",
      emphasis: "freezing opens the structure",
    },
    {
      title: "The result",
      narration: "That open structure makes ice less dense, so it rides on top.",
      visual: "The cube rises with a final density label.",
      emphasis: "less dense floats",
    },
  ],
};

describe("renderScenePlan", () => {
  it("writes a composition and runs Hyperframes lint before render", async () => {
    const root = await mkdtemp(join(tmpdir(), "aster-render-"));
    const commands: Array<{ command: string; args: string[]; cwd?: string }> = [];

    const result = await renderScenePlan(plan, "Why does ice float?", {
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
