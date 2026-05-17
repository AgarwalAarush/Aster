import { z } from "zod";

const idSlugSchema = z.string().trim().min(2).max(120).regex(/^[a-z0-9][a-z0-9-]*$/);

export const subjectSchema = z.object({
  id: idSlugSchema,
  domain: z.enum([
    "ml-dl",
    "classical-ml",
    "probability-stats",
    "pure-math",
    "cs-theory",
    "ai-systems",
  ]),
  title: z.string().trim().min(3).max(160),
  question: z.string().trim().min(8).max(400),
  difficulty: z.enum(["intro", "intermediate", "advanced"]),
});

export const promptVariantSchema = z.object({
  id: idSlugSchema,
  name: z.string().trim().min(3).max(160),
  systemPrompt: z.string().trim().min(40).max(20000),
  userPromptTemplate: z.string().trim().min(40).max(20000),
});

export const boardActionKindSchema = z.enum([
  "write",
  "draw",
  "highlight",
  "transform",
  "erase",
]);

export const writeStyleSchema = z.enum(["body", "header", "equation"]);

export const boardLayoutSchema = z.object({
  id: z.enum(["full", "split-vertical"]),
  ratio: z.enum(["50-50", "33-67"]).optional(),
  divider: z.boolean().optional(),
});

const boardActionSchema = z.object({
  at: z.number().min(0).max(360),
  kind: boardActionKindSchema,
  targetId: z.string().trim().min(1).max(80).regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/),
  content: z.string().trim().min(1).max(1200),
  region: z.string().trim().min(1).max(80).optional(),
  writeStyle: writeStyleSchema.optional(),
  templateId: z.string().trim().min(1).max(80).optional(),
  templateParams: z.record(z.string(), z.unknown()).optional(),
});

const narrationBeatSchema = z.object({
  atSec: z.number().min(0).max(360),
  text: z.string().trim().min(8).max(800),
  whyThisBeat: z.string().trim().min(8).max(300),
});

const codeBlockSchema = z.object({
  atSec: z.number().min(0).max(360),
  language: z.string().trim().min(1).max(40),
  code: z.string().trim().min(4).max(4000),
  purpose: z.string().trim().min(8).max(300),
});

export const lectureLessonSchema = z.object({
  id: idSlugSchema,
  topic: z.object({
    id: idSlugSchema,
    title: z.string().trim().min(3).max(160),
    question: z.string().trim().min(8).max(400),
    domain: z.string().trim().min(2).max(40),
  }),
  promptVariant: z.object({
    id: idSlugSchema,
    name: z.string().trim().min(3).max(160),
  }),
  metadata: z.object({
    generator: z.string().trim().min(2).max(80),
    createdAt: z.string().datetime(),
  }),
  lesson: z.object({
    title: z.string().trim().min(5).max(160),
    learnerLevel: z.string().trim().min(3).max(120),
    durationSeconds: z.number().int().min(60).max(360),
    payoff: z.string().trim().min(20).max(500),
    staircase: z.array(z.string().trim().min(4).max(200)).min(2).max(10),
    destination: z.string().trim().min(20).max(500),
  }),
  narration: z.object({
    fullText: z.string().trim().min(120).max(12000),
    beats: z.array(narrationBeatSchema).min(3).max(40),
  }),
  board: z.object({
    layout: boardLayoutSchema.optional(),
    actions: z.array(boardActionSchema).min(5).max(150),
  }),
  codeBlocks: z.array(codeBlockSchema).max(20).optional(),
});

export type Subject = z.infer<typeof subjectSchema>;
export type PromptVariant = z.infer<typeof promptVariantSchema>;
export type LectureLesson = z.infer<typeof lectureLessonSchema>;
export type BoardAction = z.infer<typeof boardActionSchema>;
export type BoardLayoutConfig = z.infer<typeof boardLayoutSchema>;
export type WriteStyle = z.infer<typeof writeStyleSchema>;
export type NarrationBeat = z.infer<typeof narrationBeatSchema>;

export function parseLectureLesson(value: unknown): LectureLesson {
  return lectureLessonSchema.parse(value);
}

export function parseLectureLessonSafe(value: unknown) {
  return lectureLessonSchema.safeParse(value);
}

export function validateBoardCoherence(lesson: LectureLesson): string[] {
  const issues: string[] = [];
  const knownIds = new Set<string>();
  let lastAt = -1;

  for (const [index, action] of lesson.board.actions.entries()) {
    if (action.at < lastAt) {
      issues.push(`board.actions[${index}] at=${action.at} is not monotonic (prev ${lastAt})`);
    }
    lastAt = action.at;

    if (action.at > lesson.lesson.durationSeconds) {
      issues.push(`board.actions[${index}] at=${action.at} exceeds durationSeconds=${lesson.lesson.durationSeconds}`);
    }

    if (action.kind === "write" || action.kind === "draw") {
      knownIds.add(action.targetId);
      continue;
    }

    if (action.kind === "erase" && action.targetId === "all") {
      knownIds.clear();
      continue;
    }

    if (!knownIds.has(action.targetId)) {
      issues.push(`board.actions[${index}] kind=${action.kind} references unknown targetId=${action.targetId}`);
    }

    if (action.kind === "erase") {
      knownIds.delete(action.targetId);
    }
  }

  let lastBeat = -1;
  for (const [index, beat] of lesson.narration.beats.entries()) {
    if (beat.atSec < lastBeat) {
      issues.push(`narration.beats[${index}] atSec=${beat.atSec} is not monotonic (prev ${lastBeat})`);
    }
    lastBeat = beat.atSec;

    if (beat.atSec > lesson.lesson.durationSeconds) {
      issues.push(`narration.beats[${index}] atSec=${beat.atSec} exceeds durationSeconds=${lesson.lesson.durationSeconds}`);
    }
  }

  const lastBeatAt = lesson.narration.beats[lesson.narration.beats.length - 1]?.atSec ?? 0;
  const lastActionAt = lesson.board.actions[lesson.board.actions.length - 1]?.at ?? 0;
  const narrationGap = lesson.lesson.durationSeconds - lastBeatAt;

  if (narrationGap > 30) {
    issues.push(
      `narration coverage gap: last beat at ${lastBeatAt}s but durationSeconds=${lesson.lesson.durationSeconds}s (${narrationGap}s of unaccompanied air at end)`,
    );
  }

  if (lastActionAt > lastBeatAt + 15) {
    issues.push(
      `board actions extend ${lastActionAt - lastBeatAt}s past the final narration beat (last beat at ${lastBeatAt}s, last action at ${lastActionAt}s)`,
    );
  }

  return issues;
}

function normalizeRegionKey(region?: string): string {
  return (region ?? "center").toLowerCase();
}

/**
 * Warns when multiple write/draw items are simultaneously visible in the same region
 * without an erase clearing that region between them.
 */
export function validateRegionOccupancy(lesson: LectureLesson): string[] {
  const issues: string[] = [];
  const visibleByTarget = new Map<string, { region: string; index: number }>();
  const occupiedRegions = new Map<string, string>();

  for (const [index, action] of lesson.board.actions.entries()) {
    if (action.at > lesson.lesson.durationSeconds) {
      continue;
    }

    if (action.kind === "erase") {
      if (action.targetId === "all") {
        visibleByTarget.clear();
        occupiedRegions.clear();
        continue;
      }
      const removed = visibleByTarget.get(action.targetId);
      visibleByTarget.delete(action.targetId);
      if (removed) {
        const stillInRegion = [...visibleByTarget.values()].some((v) => v.region === removed.region);
        if (!stillInRegion) {
          occupiedRegions.delete(removed.region);
        }
      }
      continue;
    }

    if (action.kind !== "write" && action.kind !== "draw") {
      continue;
    }

    const region = normalizeRegionKey(action.region);
    const priorTarget = occupiedRegions.get(region);
    if (priorTarget && priorTarget !== action.targetId) {
      issues.push(
        `board.actions[${index}] kind=${action.kind} reuses region=${region} while targetId=${priorTarget} is still visible (add erase or transform before reusing region)`,
      );
    }

    const duplicateTarget = visibleByTarget.get(action.targetId);
    if (duplicateTarget) {
      issues.push(
        `board.actions[${index}] reintroduces targetId=${action.targetId} while still visible from board.actions[${duplicateTarget.index}]`,
      );
    }

    visibleByTarget.set(action.targetId, { region, index });
    occupiedRegions.set(region, action.targetId);
  }

  const targetIds = new Set<string>();
  for (const action of lesson.board.actions) {
    if (action.kind !== "write" && action.kind !== "draw") {
      continue;
    }
    if (targetIds.has(action.targetId)) {
      issues.push(
        `duplicate targetId=${action.targetId} on write/draw actions (ambiguous highlight/transform)`,
      );
    }
    targetIds.add(action.targetId);
  }

  return issues;
}
