import { z } from "zod";

const sectionKindSchema = z.enum([
  "motivation",
  "background",
  "mechanism",
  "math",
  "tradeoff",
  "example",
  "recap",
]);

const scriptSectionSchema = z.object({
  kind: sectionKindSchema,
  title: z.string().trim().min(3).max(120),
  narration: z.string().trim().min(40).max(1200),
  visual: z.string().trim().min(12).max(500),
  estimatedSeconds: z.number().int().min(10).max(60),
});

const visualPlanItemSchema = z.object({
  sceneTitle: z.string().trim().min(3).max(120),
  diagram: z.string().trim().min(3).max(80),
  animation: z.string().trim().min(12).max(500),
});

export const scriptCandidateSchema = z.object({
  id: z.string().trim().min(3).max(120).regex(/^[a-z0-9][a-z0-9-]*$/),
  topic: z.object({
    id: z.string().trim().min(2).max(80).regex(/^[a-z0-9][a-z0-9-]*$/),
    title: z.string().trim().min(3).max(160),
    question: z.string().trim().min(8).max(500),
  }),
  promptVariant: z.object({
    id: z.string().trim().min(3).max(120),
    name: z.string().trim().min(3).max(160),
    prompt: z.string().trim().min(20).max(12000),
  }),
  metadata: z.object({
    runner: z.enum(["in-cursor-agent", "manual", "fixture"]),
    model: z.string().trim().min(2).max(120).optional(),
    agentId: z.string().trim().min(2).max(160).optional(),
    createdAt: z.string().datetime().optional(),
  }),
  lesson: z.object({
    title: z.string().trim().min(5).max(160),
    learnerLevel: z.string().trim().min(3).max(120),
    targetDurationSeconds: z.number().int().min(90).max(240),
    learningObjective: z.string().trim().min(20).max(400),
  }),
  script: z.object({
    fullNarration: z.string().trim().min(120).max(10000),
    sections: z.array(scriptSectionSchema).min(3).max(10),
  }),
  visualPlan: z.array(visualPlanItemSchema).min(1).max(12),
});

export type ScriptCandidate = z.infer<typeof scriptCandidateSchema>;
export type ScriptSectionKind = z.infer<typeof sectionKindSchema>;

export function parseScriptCandidate(value: unknown): ScriptCandidate {
  return scriptCandidateSchema.parse(value);
}

export function candidateSearchText(candidate: ScriptCandidate): string {
  return [
    candidate.topic.title,
    candidate.topic.question,
    candidate.lesson.title,
    candidate.lesson.learningObjective,
    candidate.script.fullNarration,
    ...candidate.script.sections.flatMap((section) => [
      section.kind,
      section.title,
      section.narration,
      section.visual,
    ]),
    ...candidate.visualPlan.flatMap((item) => [item.sceneTitle, item.diagram, item.animation]),
  ]
    .join("\n")
    .toLowerCase();
}
