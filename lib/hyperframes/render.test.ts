import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderStoryboard } from "./render";
import type { Storyboard } from "../education/schema";

const storyboard: Storyboard = {
  lesson: {
    title: "Why ice floats",
    coreIdea: "Ice floats because it is less dense than liquid water.",
    learnerLevel: "curious learner",
    durationSeconds: 24,
  },
  style: "monochromeLiquidGlass",
  scenes: [
    {
      title: "The surprise",
      narration: "Ice floats because frozen water takes up more space than liquid water.",
      onScreenText: "More space, same stuff",
      visualMetaphor: "A white cube rises through a black liquid plane.",
      diagram: { type: "comparison", label: "ice and water", values: ["ice", "water"] },
      motionBeats: [{ type: "slidePanel", target: "scene", at: 0.2 }],
    },
    {
      title: "Density",
      narration: "Density compares how much matter is packed into each bit of space.",
      onScreenText: "Density = matter per space",
      visualMetaphor: "Packed and sparse particles sit in adjacent lenses.",
      diagram: { type: "particles", label: "packing", values: ["dense", "spread"] },
      motionBeats: [{ type: "scatterParticles", target: "particles", at: 1 }],
    },
    {
      title: "Water expands",
      narration: "When water freezes, its molecules lock into an open crystal pattern.",
      onScreenText: "Freezing opens the structure",
      visualMetaphor: "Particles snap into a crystal lattice.",
      diagram: { type: "flow", label: "freezing", values: ["liquid", "open", "solid"] },
      motionBeats: [{ type: "pulseNode", target: "diagram", at: 1 }],
    },
    {
      title: "The result",
      narration: "That open structure makes ice less dense, so it rides on top.",
      onScreenText: "Less dense floats",
      visualMetaphor: "A final cube floats in a liquid-glass frame.",
      diagram: { type: "numberLine", label: "density line", values: ["less", "more"] },
      motionBeats: [{ type: "revealText", target: "keyLine", at: 1.4 }],
    },
  ],
};

describe("renderStoryboard", () => {
  it("writes a composition and runs Hyperframes lint before render", async () => {
    const root = await mkdtemp(join(tmpdir(), "aster-render-"));
    const commands: Array<{ command: string; args: string[]; cwd?: string }> = [];

    const result = await renderStoryboard(storyboard, "Why does ice float?", {
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
    await expect(readFile(join(root, "generated", "job-123", "storyboard.json"), "utf8")).resolves.toContain(
      "monochromeLiquidGlass",
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
