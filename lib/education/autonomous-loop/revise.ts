import type { SweepSummary } from "../loop/aggregate.ts";
import type { VisualSweepSummary } from "../video-eval/aggregate.ts";

export function buildPromptRevisionRequest(
  options: {
    runId: string;
    iteration: number;
    variantId: string;
    lessonSummary?: SweepSummary;
    videoSummary?: VisualSweepSummary;
    currentRevision: string;
  },
): string {
  const lessonBlock = options.lessonSummary
    ? `LESSON JSON CRITIQUE SUMMARY (${options.lessonSummary.sweepId})
Mean: ${options.lessonSummary.mean}%
Common issues:
${options.lessonSummary.commonIssues.map((i) => `- (${i.count}x) ${i.issue}`).join("\n")}
Worst criteria:
${options.lessonSummary.perCriterion
  .slice(0, 4)
  .map((c) => `- ${c.id}: ${c.meanPercent}%`)
  .join("\n")}
`
    : "";

  const videoBlock = options.videoSummary
    ? `VISUAL CRITIQUE SUMMARY (${options.videoSummary.sweepId})
Mean: ${options.videoSummary.mean}%
Architecture: ${options.videoSummary.architectures.join(", ")}
Common issues:
${options.videoSummary.commonIssues.map((i) => `- (${i.count}x) ${i.issue}`).join("\n")}
Worst criteria:
${options.videoSummary.perCriterion
  .slice(0, 4)
  .map((c) => `- ${c.id}: ${c.meanPercent}%`)
  .join("\n")}
`
    : "";

  return `You are improving a whiteboard lesson GENERATOR prompt (variant: ${options.variantId}).

Read the critique summaries below from iteration ${options.iteration} of autonomous run "${options.runId}".

${lessonBlock}
${videoBlock}

CURRENT PROMPT REVISION APPENDIX (concatenated to the user prompt on the next iteration):
${options.currentRevision || "(empty — first revision)"}

Write a NEW PROMPT REVISION APPENDIX (plain text, not JSON) that will be appended to the generator user prompt next iteration.
Rules for the appendix:
- Bullet list of concrete, testable changes (region erase before reuse, diagram timing, sync rules, etc.)
- Fix the top failures from the critiques (especially text-overlap and board-visual-balance if visual scores are low)
- Do NOT repeat the entire base prompt — only the delta
- Max 40 lines

Return ONLY the appendix text. No markdown fences. No preamble.`;
}
