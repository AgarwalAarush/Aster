import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { buildGeneratorPrompt } from "../loop/generate.ts";
import { buildPromptRevisionRequest } from "./revise.ts";
import { ensureSweepLayout, sweepDir } from "../loop/io.ts";
import { ITERATION_SUBJECT_IDS } from "../loop/iteration-subjects.ts";
import { getSubject } from "../loop/subjects.ts";
import type { PromptVariant } from "../loop/schema.ts";
import type { LoopState } from "./state.ts";
import { saveLoopState } from "./state.ts";

export type InIdePendingStep =
  | "lesson-generate"
  | "lesson-critic-generate"
  | "video-critic-generate"
  | "revise-generate"
  | "done";

export function appendRevision(userPrompt: string, revision: string): string {
  if (!revision.trim()) {
    return userPrompt;
  }
  return `${userPrompt}\n\n--- PROMPT REVISION (from prior autonomous loop iteration) ---\n${revision.trim()}\n`;
}

export function lessonSweepId(runId: string, iteration: number): string {
  return `${runId}-iter${String(iteration).padStart(2, "0")}-lesson`;
}

export function videoSweepId(runId: string, iteration: number): string {
  return `${runId}-iter${String(iteration).padStart(2, "0")}-video`;
}

export async function writeLessonGeneratorPrompts(
  sweepId: string,
  variant: PromptVariant,
  promptRevision: string,
): Promise<string[]> {
  await ensureSweepLayout(sweepId);
  const promptsDir = join(sweepDir(sweepId), "prompts");
  await mkdir(promptsDir, { recursive: true });
  const paths: string[] = [];

  for (const subjectId of ITERATION_SUBJECT_IDS) {
    const subject = getSubject(subjectId);
    const base = buildGeneratorPrompt(subject, variant);
    const userPrompt = appendRevision(base.userPrompt, promptRevision);
    const body = `${base.systemPrompt}\n\n---\n\n${userPrompt}\n\nYour final response must be exactly the JSON object. No commentary, no markdown fences, no preamble, no closing remarks. Just the JSON.\n`;
    const path = join(promptsDir, `${subjectId}.prompt.txt`);
    await writeFile(path, body, "utf8");
    paths.push(path);
  }

  return paths;
}

export async function writeAgentTasksFile(
  runId: string,
  sweepId: string,
  step: InIdePendingStep,
  details: string,
): Promise<string> {
  const path = join(sweepDir(sweepId), "AGENT_TASKS.md");
  const body = `# In-IDE agent tasks — ${runId}

**Step:** \`${step}\`

${details}

When finished, run:

\`\`\`bash
npm run qa:loop -- ${runId} step ${nextStepFor(step)}
\`\`\`
`;
  await writeFile(path, body, "utf8");
  return path;
}

function nextStepFor(step: InIdePendingStep): string {
  switch (step) {
    case "lesson-generate":
      return "lesson-ingest";
    case "lesson-critic-generate":
      return "lesson-critic-ingest";
    case "video-critic-generate":
      return "video-critic-ingest";
    case "revise-generate":
      return "apply-revision";
    default:
      return "status";
  }
}

export async function writeRevisionRequest(
  runId: string,
  iteration: number,
  variantId: string,
  prompt: string,
): Promise<string> {
  const path = join(process.cwd(), "qa-runs", "autonomous-loop", `${runId}-revision-request.txt`);
  await mkdir(join(process.cwd(), "qa-runs", "autonomous-loop"), { recursive: true });
  await writeFile(path, prompt, "utf8");
  return path;
}

export async function setPendingStep(
  state: LoopState,
  step: InIdePendingStep,
  options: { lessonSweepId?: string; videoSweepId?: string },
): Promise<void> {
  state.pendingStep = step;
  if (options.lessonSweepId) {
    state.currentLessonSweepId = options.lessonSweepId;
  }
  if (options.videoSweepId) {
    state.currentVideoSweepId = options.videoSweepId;
  }
  await saveLoopState(state);
}

export function buildLessonGenerateTaskDetails(sweepId: string, promptPaths: string[]): string {
  const rawDir = join(sweepDir(sweepId), "raw");
  const lines = promptPaths.map((p) => {
    const subjectId = p.split("/").pop()?.replace(/\.prompt\.txt$/, "") ?? "?";
    return `- Read \`${p}\`, respond with **only** the lesson JSON, save to \`${rawDir}/${subjectId}.txt\``;
  });
  return `## Lesson generation (${ITERATION_SUBJECT_IDS.length} subjects)

Use the Cursor agent in this chat (no \`CURSOR_API_KEY\`). For each prompt file:

${lines.join("\n")}
`;
}

export function buildLessonCriticTaskDetails(sweepId: string): string {
  const dir = join(sweepDir(sweepId), "critic-prompts");
  return `## Lesson JSON critique

For each \`${dir}/*.critic.txt\`, return **only** the critique JSON and save to \`${join(sweepDir(sweepId), "critiques")}/<subject>.raw.txt\`.
`;
}

export function buildVideoCriticTaskDetails(sweepId: string): string {
  const dir = join(sweepDir(sweepId), "visual-critic-prompts");
  const frames = join(sweepDir(sweepId), "frames");
  return `## Visual critique

Open the PNGs under \`${frames}/<subject>/\` (t00, t10, …) while running each \`${dir}/*.critic.txt\`.
Save JSON to \`${join(sweepDir(sweepId), "critiques")}/<subject>.raw.txt\`.
`;
}

export function buildReviseTaskDetails(revisionRequestPath: string, revisionOutputPath: string): string {
  return `## Prompt revision appendix

Read \`${revisionRequestPath}\` and write the appendix (plain text, not JSON) to \`${revisionOutputPath}\`.
`;
}

export { buildPromptRevisionRequest };
