import { z } from "zod";

export const diagramTypeSchema = z.enum([
  "fractionBars",
  "flow",
  "particles",
  "numberLine",
  "comparison",
  "equationTransform",
  "orbit",
  "wave",
  "blankCanvas",
]);

export const motionBeatTypeSchema = z.enum([
  "drawPath",
  "morphBlob",
  "revealText",
  "pulseNode",
  "slidePanel",
  "transformEquation",
  "scatterParticles",
]);

const diagramSchema = z.object({
  type: diagramTypeSchema,
  label: z.string().trim().min(3).max(120),
  values: z.array(z.string().trim().min(1).max(80)).min(0).max(8),
});

const motionBeatSchema = z.object({
  type: motionBeatTypeSchema,
  target: z.enum(["ambient", "scene", "diagram", "equation", "keyLine", "particles"]),
  at: z.number().min(0).max(45),
});

const storyboardSceneSchema = z.object({
  title: z.string().trim().min(3).max(80),
  narration: z.string().trim().min(20).max(360),
  onScreenText: z.string().trim().min(3).max(140),
  visualMetaphor: z.string().trim().min(12).max(260),
  diagram: diagramSchema,
  motionBeats: z.array(motionBeatSchema).min(1).max(5),
});

export const storyboardSchema = z.object({
  lesson: z.object({
    title: z.string().trim().min(5).max(90),
    coreIdea: z.string().trim().min(12).max(240),
    learnerLevel: z.string().trim().min(3).max(80),
    durationSeconds: z.number().int().min(20).max(36),
  }),
  style: z.literal("monochromeLiquidGlass"),
  scenes: z.array(storyboardSceneSchema).length(4),
});

export type DiagramType = z.infer<typeof diagramTypeSchema>;
export type MotionBeatType = z.infer<typeof motionBeatTypeSchema>;
export type Storyboard = z.infer<typeof storyboardSchema>;
export type StoryboardScene = Storyboard["scenes"][number];

export function parseStoryboard(value: unknown): Storyboard {
  return storyboardSchema.parse(value);
}
