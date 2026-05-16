import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { buildGeneratorPrompt } from "../loop/generate.ts";
import { buildCriticPrompt } from "../loop/critique.ts";
import { ingestAgentOutput, ingestCritiqueOutput } from "../loop/generate.ts";
import { loadCritiquesForSweep, summarizeSweep, writeSummary } from "../loop/aggregate.ts";
import { ensureSweepLayout } from "../loop/io.ts";
import { ensureVideoSweepLayout } from "../video-eval/io.ts";
import { ITERATION_SUBJECT_IDS } from "../loop/iteration-subjects.ts";
import { parseLectureLesson } from "../loop/schema.ts";
import { getSubject } from "../loop/subjects.ts";
import type { PromptVariant } from "../loop/schema.ts";
import { loadVisualCritiquesForSweep, summarizeVisualSweep, writeVisualSummary } from "../video-eval/aggregate.ts";
import { buildVisualCriticPrompt } from "../video-eval/visual-critique.ts";
import { DEFAULT_FRAME_TIMESTAMPS_SEC } from "../video-eval/constants.ts";
import { ingestVisualCritiqueOutput } from "../video-eval/ingest.ts";
import { framesDir, writeVideoManifest } from "../video-eval/io.ts";
import type { VideoSweepManifest } from "../video-eval/manifest.ts";
import type { AutonomousLoopConfig } from "./config.ts";
import { runCursorAgent } from "./cursor.ts";
import { runNodeScript } from "./exec.ts";
import { buildPromptRevisionRequest } from "./revise.ts";
import type { LoopState } from "./state.ts";
import { saveLoopState } from "./state.ts";

function appendRevision(userPrompt: string, revision: string): string {
  if (!revision.trim()) {
    return userPrompt;
  }
  return `${userPrompt}\n\n--- PROMPT REVISION (from prior autonomous loop iteration) ---\n${revision.trim()}\n`;
}

async function loadVariant(modulePath: string, exportName: string): Promise<PromptVariant> {
  const imported = (await import(resolve(process.cwd(), modulePath))) as Record<string, unknown>;
  const variant = imported[exportName] as PromptVariant | undefined;
  if (!variant?.systemPrompt) {
    throw new Error(`Invalid variant export ${exportName} in ${modulePath}`);
  }
  return variant;
}

async function runLessonPhase(
  config: AutonomousLoopConfig,
  state: LoopState,
  sweepId: string,
  variant: PromptVariant,
): Promise<{ summaryPath: string; thresholdMet: boolean }> {
  const layout = await ensureSweepLayout(sweepId);
  await mkdir(layout.root, { recursive: true });

  process.stdout.write(`\n[${sweepId}] lesson generate (${ITERATION_SUBJECT_IDS.length} Cursor agents)\n`);

  for (const subjectId of ITERATION_SUBJECT_IDS) {
    const subject = getSubject(subjectId);
    const base = buildGeneratorPrompt(subject, variant);
    const userPrompt = appendRevision(base.userPrompt, state.promptRevision);
    const prompt = `${base.systemPrompt}\n\n---\n\n${userPrompt}\n\nReturn ONLY the JSON object. No markdown fences. No commentary.\n`;

    process.stdout.write(`  generating ${subjectId}...\n`);
    const { text } = await runCursorAgent(prompt, { model: config.cursorModel });
    const outcome = await ingestAgentOutput(sweepId, subject, text);
    if (outcome.kind === "ok") {
      process.stdout.write(`  OK   ${subjectId}\n`);
    } else {
      process.stdout.write(`  FAIL ${subjectId}: ${outcome.reason}\n`);
    }
  }

  process.stdout.write(`[${sweepId}] lesson critique\n`);
  for (const subjectId of ITERATION_SUBJECT_IDS) {
    const candidatePath = join(layout.candidates, `${subjectId}.json`);
    let lesson;
    try {
      lesson = parseLectureLesson(JSON.parse(await readFile(candidatePath, "utf8")));
    } catch {
      process.stdout.write(`  skip critique ${subjectId}: no candidate\n`);
      continue;
    }
    const subject = getSubject(subjectId);
    const { systemPrompt, userPrompt } = buildCriticPrompt(subject, lesson);
    const prompt = `${systemPrompt}\n\n---\n\n${userPrompt}\n\nReturn ONLY the JSON object.\n`;
    process.stdout.write(`  critiquing ${subjectId}...\n`);
    const { text } = await runCursorAgent(prompt, { model: config.cursorModel });
    const outcome = await ingestCritiqueOutput(sweepId, subject, text);
    if (outcome.kind === "ok") {
      process.stdout.write(`  OK   ${subjectId} ${outcome.percent}%\n`);
    } else {
      process.stdout.write(`  FAIL ${subjectId}: ${outcome.reason}\n`);
    }
  }

  const reports = await loadCritiquesForSweep(sweepId);
  const summary = summarizeSweep(sweepId, reports);
  const paths = await writeSummary(sweepId, summary);
  await runNodeScript("decide", [sweepId]);

  const thresholdMet =
    summary.mean >= config.lessonThreshold.meanGte &&
    summary.perCriterion.every((c) => c.meanPercent >= config.lessonThreshold.perCriterionMeanGte) &&
    summary.perSubject.every((s) => s.percent >= config.lessonThreshold.perSubjectGte);

  process.stdout.write(`  lesson mean=${summary.mean}% thresholdMet=${thresholdMet}\n`);
  return { summaryPath: paths.json, thresholdMet };
}

async function copyCandidates(fromSweep: string, toSweep: string): Promise<void> {
  const from = await ensureSweepLayout(fromSweep);
  const to = await ensureVideoSweepLayout(toSweep);
  for (const subjectId of ITERATION_SUBJECT_IDS) {
    const src = join(from.candidates, `${subjectId}.json`);
    const dest = join(to.candidates, `${subjectId}.json`);
    try {
      await copyFile(src, dest);
    } catch {
      // skip missing
    }
  }
}

async function runVideoPhase(
  config: AutonomousLoopConfig,
  state: LoopState,
  lessonSweepId: string,
  videoSweepId: string,
  variant: PromptVariant,
): Promise<{ thresholdMet: boolean; mean: number }> {
  const manifest: VideoSweepManifest = {
    sweepId: videoSweepId,
    promptVariantId: variant.id,
    architecture: state.architecture,
    frameMode: "timeline",
    frameTimestampsSec: [...DEFAULT_FRAME_TIMESTAMPS_SEC],
    createdAt: new Date().toISOString(),
  };
  await writeVideoManifest(videoSweepId, manifest);
  await copyCandidates(lessonSweepId, videoSweepId);

  process.stdout.write(`\n[${videoSweepId}] compose + capture\n`);
  await runNodeScript("video-eval", ["compose", videoSweepId]);
  await runNodeScript("video-eval", ["capture-frames", videoSweepId]);
  await runNodeScript("video-eval", ["render-critic", videoSweepId]);

  const layout = await ensureVideoSweepLayout(videoSweepId);

  process.stdout.write(`[${videoSweepId}] visual critique (${ITERATION_SUBJECT_IDS.length} Cursor agents)\n`);

  for (const subjectId of ITERATION_SUBJECT_IDS) {
    const candidatePath = join(layout.candidates, `${subjectId}.json`);
    let lesson;
    try {
      lesson = parseLectureLesson(JSON.parse(await readFile(candidatePath, "utf8")));
    } catch {
      process.stdout.write(`  skip visual ${subjectId}: no candidate\n`);
      continue;
    }
    const subject = getSubject(subjectId);
    const frameRefs = DEFAULT_FRAME_TIMESTAMPS_SEC.map((timestampSec) => {
      const label = `t${String(timestampSec).padStart(2, "0")}`;
      return {
        timestampSec,
        label,
        absolutePath: join(framesDir(videoSweepId, subjectId), `${label}.png`),
      };
    });
    const { systemPrompt, userPrompt } = buildVisualCriticPrompt(subject, lesson, frameRefs, {
      architecture: state.architecture,
      frameMode: "timeline",
      timestampsSec: DEFAULT_FRAME_TIMESTAMPS_SEC,
    });
    const framePaths = frameRefs.map((f) => f.absolutePath).join("\n");
    const prompt =
      `${systemPrompt}\n\n---\n\n${userPrompt}\n\n` +
      `Use your file tools to open and inspect these PNG screenshots before scoring:\n${framePaths}\n\n` +
      `Return ONLY the JSON object. No markdown fences.\n`;

    process.stdout.write(`  visual critique ${subjectId}...\n`);
    const { text } = await runCursorAgent(prompt, { model: config.cursorModel });
    const outcome = await ingestVisualCritiqueOutput(videoSweepId, subject, text);
    if (outcome.kind === "ok") {
      process.stdout.write(`  OK   ${subjectId} ${outcome.percent}%\n`);
    } else {
      process.stdout.write(`  FAIL ${subjectId}: ${outcome.reason}\n`);
    }
  }

  await runNodeScript("video-eval", ["aggregate", videoSweepId]);
  await runNodeScript("video-eval", ["decide", videoSweepId]);

  const reports = await loadVisualCritiquesForSweep(videoSweepId);
  const summary = summarizeVisualSweep(videoSweepId, reports);
  await writeVisualSummary(videoSweepId, summary);

  const overlap = summary.perCriterion.find((c) => c.id === "text-overlap");
  const overlapMean = overlap?.meanPercent ?? 0;
  const thresholdMet =
    summary.mean >= config.videoThreshold.meanGte && overlapMean >= config.videoThreshold.textOverlapMeanGte;

  process.stdout.write(`  video mean=${summary.mean}% text-overlap=${overlapMean}% thresholdMet=${thresholdMet}\n`);
  return { thresholdMet, mean: summary.mean };
}

export type IterationResult = {
  iteration: number;
  lessonSweepId: string;
  videoSweepId?: string;
  lessonThresholdMet: boolean;
  videoThresholdMet: boolean;
  stopLoop: boolean;
};

export async function runOneIteration(
  config: AutonomousLoopConfig,
  state: LoopState,
): Promise<IterationResult> {
  const n = state.iteration + 1;
  const lessonSweepId = `${config.runId}-iter${String(n).padStart(2, "0")}-lesson`;
  const videoSweepId = `${config.runId}-iter${String(n).padStart(2, "0")}-video`;

  const variant = await loadVariant(state.variantModule, state.variantExport);

  let lessonThresholdMet = false;
  let videoThresholdMet = false;

  if (config.mode === "lesson" || config.mode === "full") {
    const lesson = await runLessonPhase(config, state, lessonSweepId, variant);
    lessonThresholdMet = lesson.thresholdMet;
    state.lastLessonSweepId = lessonSweepId;
  } else {
    lessonThresholdMet = true;
  }

  if (config.mode === "video" || config.mode === "full") {
    const sourceLessonSweep = state.lastLessonSweepId ?? lessonSweepId;
    const video = await runVideoPhase(config, state, sourceLessonSweep, videoSweepId, variant);
    videoThresholdMet = video.thresholdMet;
    state.lastVideoSweepId = videoSweepId;
  } else {
    videoThresholdMet = true;
  }

  // Revise prompt for next iteration
  let lessonSummary;
  let videoSummary;
  if (state.lastLessonSweepId) {
    try {
      const reports = await loadCritiquesForSweep(state.lastLessonSweepId);
      lessonSummary = summarizeSweep(state.lastLessonSweepId, reports);
    } catch {
      /* no lesson critiques */
    }
  }
  if (state.lastVideoSweepId) {
    try {
      const reports = await loadVisualCritiquesForSweep(state.lastVideoSweepId);
      videoSummary = summarizeVisualSweep(state.lastVideoSweepId, reports);
    } catch {
      /* no video critiques */
    }
  }

  const revisePrompt = buildPromptRevisionRequest({
    runId: config.runId,
    iteration: n,
    variantId: variant.id,
    lessonSummary,
    videoSummary,
    currentRevision: state.promptRevision,
  });
  process.stdout.write(`\n[${config.runId}] revising prompt appendix (Cursor agent)\n`);
  const { text: revision } = await runCursorAgent(revisePrompt, { model: config.cursorModel });
  state.promptRevision = revision.trim();
  state.iteration = n;

  const stopLoop =
    (config.mode === "lesson" && lessonThresholdMet) ||
    (config.mode === "video" && videoThresholdMet) ||
    (config.mode === "full" && lessonThresholdMet && videoThresholdMet);

  if (stopLoop) {
    state.stoppedReason = "thresholds met";
  }

  await saveLoopState(state);

  return {
    iteration: n,
    lessonSweepId,
    videoSweepId: config.mode !== "lesson" ? videoSweepId : undefined,
    lessonThresholdMet,
    videoThresholdMet,
    stopLoop,
  };
}
