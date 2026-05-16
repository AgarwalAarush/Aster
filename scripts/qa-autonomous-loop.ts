import { existsSync } from "node:fs";
import { initialLoopState, loadLoopState, saveLoopState } from "../lib/education/autonomous-loop/state.ts";
import { runOneIteration } from "../lib/education/autonomous-loop/iteration.ts";
import { DEFAULT_LOOP_CONFIG, type LoopMode } from "../lib/education/autonomous-loop/config.ts";
import { requireCursorApiKey } from "../lib/education/autonomous-loop/cursor.ts";

function parseArgs(argv: string[]): {
  runId: string;
  maxIterations: number;
  mode: LoopMode;
  resume: boolean;
} {
  let runId = `autonomous-${new Date().toISOString().slice(0, 10)}`;
  let maxIterations = DEFAULT_LOOP_CONFIG.maxIterations;
  let mode: LoopMode = DEFAULT_LOOP_CONFIG.mode;
  let resume = false;

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--resume") {
      resume = true;
      continue;
    }
    if (arg === "--lesson-only") {
      mode = "lesson";
      continue;
    }
    if (arg === "--video-only") {
      mode = "video";
      continue;
    }
    if (arg === "--full") {
      mode = "full";
      continue;
    }
    if (arg === "--max-iterations" && argv[i + 1]) {
      maxIterations = Number.parseInt(argv[++i], 10);
      continue;
    }
    if (arg.startsWith("--max-iterations=")) {
      maxIterations = Number.parseInt(arg.split("=")[1] ?? "3", 10);
      continue;
    }
    if (!arg.startsWith("--")) {
      runId = arg;
    }
  }

  return { runId, maxIterations, mode, resume };
}

const argv = process.argv;
const { runId, maxIterations, mode, resume } = parseArgs(argv);

try {
  requireCursorApiKey();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}

let state = resume ? await loadLoopState(runId) : null;
if (!state) {
  state = initialLoopState(runId, {
    variantModule: DEFAULT_LOOP_CONFIG.variantModule,
    variantExport: DEFAULT_LOOP_CONFIG.variantExport,
    architecture: DEFAULT_LOOP_CONFIG.architecture,
  });
  await saveLoopState(state);
}

const config = {
  ...DEFAULT_LOOP_CONFIG,
  runId,
  maxIterations,
  mode,
};

process.stdout.write(
  `Autonomous loop: runId=${runId} mode=${mode} maxIterations=${maxIterations} ` +
    `variant=${state.variantExport} architecture=${state.architecture} ` +
    `startingIteration=${state.iteration}\n`,
);

for (let i = state.iteration; i < maxIterations; i += 1) {
  process.stdout.write(`\n========== Iteration ${i + 1} / ${maxIterations} ==========\n`);
  const result = await runOneIteration(config, state);
  state = (await loadLoopState(runId))!;

  process.stdout.write(
    `Iteration ${result.iteration} done: lesson=${result.lessonThresholdMet} video=${result.videoThresholdMet} stop=${result.stopLoop}\n`,
  );

  if (result.stopLoop) {
    process.stdout.write(`\nStopping: thresholds met after iteration ${result.iteration}.\n`);
    break;
  }
}

const finalState = await loadLoopState(runId);
process.stdout.write(`\nLoop finished. State: qa-runs/autonomous-loop/${runId}.json\n`);
if (finalState?.stoppedReason) {
  process.stdout.write(`Reason: ${finalState.stoppedReason}\n`);
}
