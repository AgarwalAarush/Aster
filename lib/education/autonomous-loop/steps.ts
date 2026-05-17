import { copyFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { loadCritiquesForSweep, summarizeSweep, writeSummary } from "../loop/aggregate.ts";
import { ensureSweepLayout } from "../loop/io.ts";
import { ITERATION_SUBJECT_IDS } from "../loop/iteration-subjects.ts";
import type { PromptVariant } from "../loop/schema.ts";
import { loadVisualCritiquesForSweep, summarizeVisualSweep, writeVisualSummary } from "../video-eval/aggregate.ts";
import { ensureVideoSweepLayout, writeVideoManifest } from "../video-eval/io.ts";
import { DEFAULT_FRAME_TIMESTAMPS_SEC } from "../video-eval/constants.ts";
import type { VideoSweepManifest } from "../video-eval/manifest.ts";
import type { AutonomousLoopConfig } from "./config.ts";
import {
  buildLessonCriticTaskDetails,
  buildLessonGenerateTaskDetails,
  buildReviseTaskDetails,
  buildVideoCriticTaskDetails,
  lessonSweepId,
  setPendingStep,
  videoSweepId,
  writeAgentTasksFile,
  writeLessonGeneratorPrompts,
  writeRevisionRequest,
} from "./delegated.ts";
import { buildPromptRevisionRequest } from "./revise.ts";
import { runCursorAgent } from "./cursor.ts";
import { runNodeScript } from "./exec.ts";
import type { LoopState } from "./state.ts";
import { saveLoopState } from "./state.ts";

async function loadVariant(modulePath: string, exportName: string): Promise<PromptVariant> {
  const imported = (await import(resolve(process.cwd(), modulePath))) as Record<string, unknown>;
  const variant = imported[exportName] as PromptVariant | undefined;
  if (!variant?.systemPrompt) {
    throw new Error(`Invalid variant export ${exportName} in ${modulePath}`);
  }
  return variant;
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

function revisionOutputPath(runId: string): string {
  return join(process.cwd(), "qa-runs", "autonomous-loop", `${runId}-revision.txt`);
}

export type StepResult = {
  message: string;
  pendingStep?: string;
};

export async function runInIdeStep(
  step: string,
  config: AutonomousLoopConfig,
  state: LoopState,
): Promise<StepResult> {
  const nextIteration = state.iteration + 1;
  const lessonId = state.currentLessonSweepId ?? lessonSweepId(config.runId, nextIteration);
  const videoId = state.currentVideoSweepId ?? videoSweepId(config.runId, nextIteration);
  const variant = await loadVariant(state.variantModule, state.variantExport);

  switch (step) {
    case "lesson-prompts": {
      const paths = await writeLessonGeneratorPrompts(lessonId, variant, state.promptRevision);
      state.currentLessonSweepId = lessonId;
      await setPendingStep(state, "lesson-generate", { lessonSweepId: lessonId });
      const tasksPath = await writeAgentTasksFile(
        config.runId,
        lessonId,
        "lesson-generate",
        buildLessonGenerateTaskDetails(lessonId, paths),
      );
      return {
        message: `Wrote ${paths.length} generator prompts → ${lessonId}/prompts/\nAgent tasks: ${tasksPath}\nPending: fill raw/*.txt then run: npm run qa:loop -- ${config.runId} step lesson-ingest`,
        pendingStep: "lesson-generate",
      };
    }

    case "lesson-ingest": {
      await runNodeScript("ingest-sweep", [lessonId]);
      await runNodeScript("render-critic-prompts", [lessonId]);
      await setPendingStep(state, "lesson-critic-generate", { lessonSweepId: lessonId });
      const tasksPath = await writeAgentTasksFile(
        config.runId,
        lessonId,
        "lesson-critic-generate",
        buildLessonCriticTaskDetails(lessonId),
      );
      return {
        message: `Ingested lesson candidates. Critic prompts ready.\nAgent tasks: ${tasksPath}\nThen: npm run qa:loop -- ${config.runId} step lesson-critic-ingest`,
        pendingStep: "lesson-critic-generate",
      };
    }

    case "lesson-critic-ingest": {
      await runNodeScript("ingest-critiques", [lessonId]);
      await runNodeScript("aggregate-sweep", [lessonId]);
      await runNodeScript("decide", [lessonId]);
      state.lastLessonSweepId = lessonId;
      state.currentLessonSweepId = lessonId;
      await saveLoopState(state);

      if (config.mode === "lesson") {
        await setPendingStep(state, "revise-generate", { lessonSweepId: lessonId });
        return { message: `Lesson phase done for ${lessonId}. Run step revise-prompt next.` };
      }

      return {
        message: `Lesson critiques aggregated for ${lessonId}. Run: npm run qa:loop -- ${config.runId} step video-pipeline`,
      };
    }

    case "video-pipeline": {
      const sourceLesson = state.currentLessonSweepId ?? lessonId;
      const manifest: VideoSweepManifest = {
        sweepId: videoId,
        promptVariantId: variant.id,
        architecture: state.architecture,
        frameMode: "timeline",
        frameTimestampsSec: [...DEFAULT_FRAME_TIMESTAMPS_SEC],
        createdAt: new Date().toISOString(),
      };
      await writeVideoManifest(videoId, manifest);
      await copyCandidates(sourceLesson, videoId);
      await runNodeScript("video-eval", ["compose", videoId]);
      await runNodeScript("video-eval", ["capture-frames", videoId]);
      await runNodeScript("video-eval", ["render-critic", videoId]);
      state.currentVideoSweepId = videoId;
      state.lastVideoSweepId = videoId;
      await setPendingStep(state, "video-critic-generate", { videoSweepId: videoId });
      const tasksPath = await writeAgentTasksFile(
        config.runId,
        videoId,
        "video-critic-generate",
        buildVideoCriticTaskDetails(videoId),
      );
      return {
        message: `Video pipeline done (compose + frames + critic prompts).\nAgent tasks: ${tasksPath}\nThen: npm run qa:loop -- ${config.runId} step video-critic-ingest`,
        pendingStep: "video-critic-generate",
      };
    }

    case "video-critic-ingest": {
      await runNodeScript("video-eval", ["ingest-critiques", videoId]);
      await runNodeScript("video-eval", ["aggregate", videoId]);
      await runNodeScript("video-eval", ["decide", videoId]);
      state.lastVideoSweepId = videoId;
      await saveLoopState(state);
      return {
        message: `Visual critiques ingested for ${videoId}. Run: npm run qa:loop -- ${config.runId} step revise-prompt`,
      };
    }

    case "revise-prompt": {
      let lessonSummary;
      let videoSummary;
      if (state.lastLessonSweepId) {
        try {
          const reports = await loadCritiquesForSweep(state.lastLessonSweepId);
          lessonSummary = summarizeSweep(state.lastLessonSweepId, reports);
        } catch {
          /* no critiques */
        }
      }
      if (state.lastVideoSweepId) {
        try {
          const reports = await loadVisualCritiquesForSweep(state.lastVideoSweepId);
          videoSummary = summarizeVisualSweep(state.lastVideoSweepId, reports);
        } catch {
          /* no critiques */
        }
      }

      const prompt = buildPromptRevisionRequest({
        runId: config.runId,
        iteration: nextIteration,
        variantId: variant.id,
        lessonSummary,
        videoSummary,
        currentRevision: state.promptRevision,
      });
      const requestPath = await writeRevisionRequest(config.runId, nextIteration, variant.id, prompt);
      const outPath = revisionOutputPath(config.runId);
      await setPendingStep(state, "revise-generate", {});
      const tasksPath = await writeAgentTasksFile(
        config.runId,
        state.lastLessonSweepId ?? lessonId,
        "revise-generate",
        buildReviseTaskDetails(requestPath, outPath),
      );
      return {
        message: `Revision request: ${requestPath}\nWrite appendix to: ${outPath}\nAgent tasks: ${tasksPath}\nThen: npm run qa:loop -- ${config.runId} step apply-revision`,
        pendingStep: "revise-generate",
      };
    }

    case "apply-revision": {
      const { readFile } = await import("node:fs/promises");
      const path = revisionOutputPath(config.runId);
      let revision: string;
      try {
        revision = (await readFile(path, "utf8")).trim();
      } catch {
        throw new Error(`Missing revision file: ${path} (run the in-IDE agent on revise-prompt first)`);
      }
      state.promptRevision = revision;
      state.iteration = nextIteration;
      state.pendingStep = "done";
      state.currentLessonSweepId = undefined;
      state.currentVideoSweepId = undefined;
      await saveLoopState(state);
      return {
        message: `Iteration ${state.iteration} complete. Revision saved (${revision.length} chars).\nStart next iteration: npm run qa:loop -- ${config.runId} step lesson-prompts`,
      };
    }

    case "status": {
      const lines = [
        `runId=${config.runId}`,
        `iteration=${state.iteration}`,
        `pendingStep=${state.pendingStep ?? "(none)"}`,
        `variant=${state.variantExport}`,
        `architecture=${state.architecture}`,
        `lastLesson=${state.lastLessonSweepId ?? "-"}`,
        `lastVideo=${state.lastVideoSweepId ?? "-"}`,
        `revisionChars=${state.promptRevision.length}`,
      ];
      return { message: lines.join("\n") };
    }

    default:
      throw new Error(
        `Unknown step: ${step}. Use: lesson-prompts | lesson-ingest | lesson-critic-ingest | video-pipeline | video-critic-ingest | revise-prompt | apply-revision | status`,
      );
  }
}

/** Full iteration via @cursor/sdk (requires CURSOR_API_KEY). */
export async function runSdkIteration(
  config: AutonomousLoopConfig,
  state: LoopState,
): Promise<{ stopLoop: boolean }> {
  const { runOneIteration } = await import("./iteration.ts");
  const result = await runOneIteration(config, state);
  return { stopLoop: result.stopLoop };
}
