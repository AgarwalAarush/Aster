import { z } from "zod";

const sceneSchema = z.object({
  title: z.string().trim().min(3).max(80),
  narration: z.string().trim().min(20).max(360),
  visual: z.string().trim().min(12).max(240),
  emphasis: z.string().trim().min(3).max(120),
});

export const scenePlanSchema = z.object({
  title: z.string().trim().min(5).max(90),
  objective: z.string().trim().min(12).max(220),
  audience: z.string().trim().min(3).max(80),
  durationSeconds: z.number().int().min(18).max(45),
  scenes: z.array(sceneSchema).min(4).max(5),
});

export type ScenePlan = z.infer<typeof scenePlanSchema>;
export type Scene = ScenePlan["scenes"][number];

export function parseScenePlan(value: unknown): ScenePlan {
  return scenePlanSchema.parse(value);
}
