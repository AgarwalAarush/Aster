import { z } from "zod";
import type { LectureLesson, Subject } from "../loop/schema.ts";
import { extractJsonObject } from "../loop/parse.ts";
import { formatBoardStateTable, regionBoxesForLesson } from "./board-state.ts";

const VISUAL_CRITERION_IDS = [
  "text-legibility",
  "text-overlap",
  "region-discipline",
  "diagram-presence",
  "diagram-correctness",
  "narration-sync",
  "pacing-60s",
  "overall-usability",
] as const;

export { VISUAL_CRITERION_IDS };

export type VisualCriterionId = (typeof VISUAL_CRITERION_IDS)[number];

export const VISUAL_CRITERION_MAX: Record<VisualCriterionId, number> = {
  "text-legibility": 15,
  "text-overlap": 20,
  "region-discipline": 10,
  "diagram-presence": 10,
  "diagram-correctness": 15,
  "narration-sync": 10,
  "pacing-60s": 10,
  "overall-usability": 10,
};

export const VISUAL_TOTAL_MAX = Object.values(VISUAL_CRITERION_MAX).reduce((a, b) => a + b, 0);

const criterionSchema = z.object({
  id: z.enum(VISUAL_CRITERION_IDS),
  label: z.string().trim().min(3).max(120),
  max: z.number().int().min(1).max(30),
  score: z.number().int().min(0).max(30),
  notes: z.string().trim().min(8).max(1600),
});

export const visualCritiqueReportSchema = z
  .object({
    candidateId: z.string().trim().min(3).max(160),
    subjectId: z.string().trim().min(2).max(120),
    promptVariantId: z.string().trim().min(2).max(120),
    architecture: z.enum(["baseline", "region-exclusive", "templates"]),
    frameMode: z.enum(["timeline", "mp4"]),
    criteria: z.array(criterionSchema).length(VISUAL_CRITERION_IDS.length),
    totalScore: z.number().int().min(0).max(VISUAL_TOTAL_MAX),
    maxScore: z.number().int().min(VISUAL_TOTAL_MAX).max(VISUAL_TOTAL_MAX),
    percent: z.number().int().min(0).max(100),
    topThreeIssues: z.array(z.string().trim().min(8).max(400)).min(0).max(5),
    wouldRecommendForPipeline: z.boolean(),
    summary: z.string().trim().min(40).max(1200),
  })
  .superRefine((report, ctx) => {
    const seen = new Set<string>();
    for (const criterion of report.criteria) {
      if (seen.has(criterion.id)) {
        ctx.addIssue({
          code: "custom",
          message: `duplicate criterion id: ${criterion.id}`,
          path: ["criteria"],
        });
      }
      seen.add(criterion.id);
      const expectedMax = VISUAL_CRITERION_MAX[criterion.id];
      if (criterion.max !== expectedMax) {
        ctx.addIssue({
          code: "custom",
          message: `criterion ${criterion.id} max ${criterion.max} != ${expectedMax}`,
          path: ["criteria"],
        });
      }
      if (criterion.score > criterion.max) {
        ctx.addIssue({
          code: "custom",
          message: `criterion ${criterion.id} score exceeds max`,
          path: ["criteria"],
        });
      }
    }
    for (const id of VISUAL_CRITERION_IDS) {
      if (!seen.has(id)) {
        ctx.addIssue({ code: "custom", message: `missing criterion: ${id}`, path: ["criteria"] });
      }
    }
    const computedTotal = report.criteria.reduce((sum, c) => sum + c.score, 0);
    if (computedTotal !== report.totalScore) {
      ctx.addIssue({
        code: "custom",
        message: `totalScore ${report.totalScore} != sum ${computedTotal}`,
        path: ["totalScore"],
      });
    }
  });

export type VisualCritiqueReport = z.infer<typeof visualCritiqueReportSchema>;

export function parseVisualCritiqueReportSafe(value: unknown) {
  return visualCritiqueReportSchema.safeParse(value);
}

const VISUAL_CRITIC_SYSTEM = `You are a senior whiteboard-video QA reviewer. You evaluate RENDERED frames from a narrated lesson video (screenshots at fixed timestamps), not the JSON plan alone.

Score every criterion using the integer maxes exactly. Be strict on text-overlap: duplicate or stacked text in the same screen region is a primary failure mode.

Return a single JSON object only. No markdown fences. No commentary.`;

const RUBRIC = `Visual rubric (score 0 to max for each):

1) text-legibility (max 15)
   Text is readable: adequate size, contrast, not clipped by region bounds.

2) text-overlap (max 20) — PRIMARY
   No illegible stacking: two or more distinct text blocks occupying the same region at once, ghosting from prior writes, or blurred duplicate labels. Score 0-5 if overlap is severe in multiple frames.

3) region-discipline (max 10)
   Board layout uses regions sensibly; not overcrowded; primary content has space.

4) diagram-presence (max 10)
   When the lesson plan includes draw actions active at a timestamp, a diagram or visual structure is visible (not empty DIAGRAM placeholder only).

5) diagram-correctness (max 15)
   Labels, arrows, and structure match the topic question (best effort from pixels).

6) narration-sync (max 10)
   Narration strip text at each timestamp aligns with what the board shows.

7) pacing-60s (max 10)
   For ~60s lessons: concept progresses without long empty board or dead air in later frames.

8) overall-usability (max 10)
   Would you ship this clip to a learner?

wouldRecommendForPipeline: true only if percent >= 75 AND text-overlap score >= half its max (${VISUAL_CRITERION_MAX["text-overlap"] / 2}).`;

function buildOutputShape(architecture: string, frameMode: string): string {
  const criteriaLines = VISUAL_CRITERION_IDS.map(
    (id) =>
      `    { "id": "${id}", "label": "...", "max": ${VISUAL_CRITERION_MAX[id]}, "score": <0-${VISUAL_CRITERION_MAX[id]}>, "notes": "..." }`,
  ).join(",\n");

  return `Return JSON:
{
  "candidateId": "<from lesson.id>",
  "subjectId": "<from lesson.topic.id>",
  "promptVariantId": "<from lesson.promptVariant.id>",
  "architecture": "${architecture}",
  "frameMode": "${frameMode}",
  "criteria": [
${criteriaLines}
  ],
  "totalScore": <sum>,
  "maxScore": ${VISUAL_TOTAL_MAX},
  "percent": <round(totalScore/maxScore*100)>,
  "topThreeIssues": ["...", "..."],
  "wouldRecommendForPipeline": <true|false>,
  "summary": "<2-3 sentences>"
}`;
}

export type FrameRef = {
  timestampSec: number;
  absolutePath: string;
  label: string;
};

export function buildVisualCriticPrompt(
  subject: Subject,
  lesson: LectureLesson,
  frames: FrameRef[],
  options: {
    architecture: "baseline" | "region-exclusive" | "templates";
    frameMode: "timeline" | "mp4";
    timestampsSec: readonly number[];
  },
): { systemPrompt: string; userPrompt: string } {
  const frameList = frames
    .map((f) => `  - ${f.label}: ${f.absolutePath} (t=${f.timestampSec}s)`)
    .join("\n");

  const userPrompt = `SUBJECT
  id: ${subject.id}
  title: ${subject.title}
  question: ${subject.question}
  domain: ${subject.domain}
  difficulty: ${subject.difficulty}

LESSON
  title: ${lesson.lesson.title}
  durationSeconds: ${lesson.lesson.durationSeconds}
  promptVariant: ${lesson.promptVariant.id}
  architecture: ${options.architecture}
  frameMode: ${options.frameMode}

SCREENSHOTS (attach these PNG files when running this review)
${frameList}

${regionBoxesForLesson(lesson)}

BOARD STATE BY TIMESTAMP (derived from lesson JSON — use to cross-check overlap)
${formatBoardStateTable(lesson, options.timestampsSec)}

NARRATION BEATS
${lesson.narration.beats.map((b) => `  t=${b.atSec}s: ${b.text.slice(0, 120)}${b.text.length > 120 ? "…" : ""}`).join("\n")}

${RUBRIC}

${buildOutputShape(options.architecture, options.frameMode)}`;

  return { systemPrompt: VISUAL_CRITIC_SYSTEM, userPrompt };
}

export type VisualCritiqueParseSuccess = { ok: true; report: VisualCritiqueReport };
export type VisualCritiqueParseFailure = {
  ok: false;
  reason: "no-json-found" | "invalid-json" | "schema-mismatch";
  detail: string;
  raw: string;
};
export type VisualCritiqueParseResult = VisualCritiqueParseSuccess | VisualCritiqueParseFailure;

export function parseVisualCritiqueResponse(raw: string): VisualCritiqueParseResult {
  const jsonText = extractJsonObject(raw);
  if (!jsonText) {
    return { ok: false, reason: "no-json-found", detail: "No JSON object found", raw };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    return {
      ok: false,
      reason: "invalid-json",
      detail: error instanceof Error ? error.message : String(error),
      raw,
    };
  }
  const result = parseVisualCritiqueReportSafe(parsed);
  if (!result.success) {
    return {
      ok: false,
      reason: "schema-mismatch",
      detail: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
      raw,
    };
  }
  return { ok: true, report: result.data };
}
