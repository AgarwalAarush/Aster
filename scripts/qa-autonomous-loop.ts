import { initialLoopState, loadLoopState, saveLoopState } from "../lib/education/autonomous-loop/state.ts";
import { DEFAULT_LOOP_CONFIG, type LoopMode } from "../lib/education/autonomous-loop/config.ts";
import { runInIdeStep } from "../lib/education/autonomous-loop/steps.ts";

function usage(): void {
  process.stderr.write(
    "Autonomous QA loop (default: in-IDE Cursor agent — no CURSOR_API_KEY)\n\n" +
      "usage:\n" +
      "  qa:loop <run-id> init [--resume]\n" +
      "  qa:loop <run-id> step <step-name>\n" +
      "  qa:loop <run-id> status\n" +
      "  qa:loop <run-id> run --sdk [--max-iterations N] [--lesson-only|--video-only|--full]\n\n" +
      "In-IDE steps (run in order each iteration):\n" +
      "  lesson-prompts → (agent: raw/*.txt) → lesson-ingest → (agent: critiques/*.raw.txt)\n" +
      "  → lesson-critic-ingest → video-pipeline → (agent: visual critiques) → video-critic-ingest\n" +
      "  → revise-prompt → (agent: revision.txt) → apply-revision\n\n" +
      "Options:\n" +
      "  --architecture baseline|region-exclusive|templates\n" +
      "  --variant-module <path> --variant-export <NAME>\n",
  );
}

function parseArgs(argv: string[]): {
  runId: string;
  command: string;
  step?: string;
  maxIterations: number;
  mode: LoopMode;
  resume: boolean;
  useSdk: boolean;
  architecture: typeof DEFAULT_LOOP_CONFIG.architecture;
  variantModule: string;
  variantExport: string;
} {
  let runId = `autonomous-${new Date().toISOString().slice(0, 10)}`;
  let command = "help";
  let step: string | undefined;
  let maxIterations = DEFAULT_LOOP_CONFIG.maxIterations;
  let mode: LoopMode = DEFAULT_LOOP_CONFIG.mode;
  let resume = false;
  let useSdk = false;
  let architecture = DEFAULT_LOOP_CONFIG.architecture;
  let variantModule = DEFAULT_LOOP_CONFIG.variantModule;
  let variantExport = DEFAULT_LOOP_CONFIG.variantExport;

  const positional: string[] = [];
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--resume") {
      resume = true;
      continue;
    }
    if (arg === "--sdk") {
      useSdk = true;
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
    if (arg === "--architecture" && argv[i + 1]) {
      architecture = argv[++i] as typeof architecture;
      continue;
    }
    if (arg === "--variant-module" && argv[i + 1]) {
      variantModule = argv[++i];
      continue;
    }
    if (arg === "--variant-export" && argv[i + 1]) {
      variantExport = argv[++i];
      continue;
    }
    if (!arg.startsWith("--")) {
      positional.push(arg);
    }
  }

  if (positional.length >= 1) {
    runId = positional[0];
  }
  if (positional.length >= 2) {
    command = positional[1];
  }
  if (positional.length >= 3 && command === "step") {
    step = positional[2];
  }

  return {
    runId,
    command,
    step,
    maxIterations,
    mode,
    resume,
    useSdk,
    architecture,
    variantModule,
    variantExport,
  };
}

const parsed = parseArgs(process.argv);

if (parsed.command === "help" || parsed.command === "--help") {
  usage();
  process.exit(parsed.command === "help" ? 1 : 0);
}

const config = {
  ...DEFAULT_LOOP_CONFIG,
  runId: parsed.runId,
  maxIterations: parsed.maxIterations,
  mode: parsed.mode,
};

async function ensureState(): Promise<import("../lib/education/autonomous-loop/state.ts").LoopState> {
  let state = parsed.resume ? await loadLoopState(parsed.runId) : null;
  if (!state) {
    state = initialLoopState(parsed.runId, {
      variantModule: parsed.variantModule,
      variantExport: parsed.variantExport,
      architecture: parsed.architecture,
    });
    await saveLoopState(state);
    process.stdout.write(`Initialized loop state: qa-runs/autonomous-loop/${parsed.runId}.json\n`);
  }
  if (parsed.architecture !== state.architecture) {
    state.architecture = parsed.architecture;
    await saveLoopState(state);
  }
  return state;
}

switch (parsed.command) {
  case "init": {
    await ensureState();
    process.stdout.write(
      `Ready. Start iteration ${(await loadLoopState(parsed.runId))!.iteration + 1}:\n` +
        `  npm run qa:loop -- ${parsed.runId} step lesson-prompts\n`,
    );
    break;
  }

  case "status": {
    const state = await loadLoopState(parsed.runId);
    if (!state) {
      process.stderr.write(`No state for ${parsed.runId}. Run: npm run qa:loop -- ${parsed.runId} init\n`);
      process.exit(1);
    }
    const result = await runInIdeStep("status", config, state);
    process.stdout.write(`${result.message}\n`);
    break;
  }

  case "step": {
    if (!parsed.step) {
      usage();
      process.exit(1);
    }
    const state = await loadLoopState(parsed.runId);
    if (!state) {
      process.stderr.write(`No state for ${parsed.runId}. Run init first.\n`);
      process.exit(1);
    }
    const result = await runInIdeStep(parsed.step, config, state);
    process.stdout.write(`${result.message}\n`);
    break;
  }

  case "run": {
    if (!parsed.useSdk) {
      process.stderr.write(
        "In-IDE mode: use step-by-step commands (no CURSOR_API_KEY). Pass --sdk for programmatic agents.\n",
      );
      usage();
      process.exit(1);
    }
    const { requireCursorApiKey } = await import("../lib/education/autonomous-loop/cursor.ts");
    const { runSdkIteration } = await import("../lib/education/autonomous-loop/steps.ts");
    try {
      requireCursorApiKey();
    } catch (error) {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
      process.exit(1);
    }

    let state = await ensureState();
    process.stdout.write(
      `SDK loop: runId=${parsed.runId} mode=${parsed.mode} maxIterations=${parsed.maxIterations}\n`,
    );

    for (let i = state.iteration; i < parsed.maxIterations; i += 1) {
      process.stdout.write(`\n========== SDK iteration ${i + 1} / ${parsed.maxIterations} ==========\n`);
      const { stopLoop } = await runSdkIteration(config, state);
      state = (await loadLoopState(parsed.runId))!;
      if (stopLoop) {
        process.stdout.write("Stopping: thresholds met.\n");
        break;
      }
    }
    break;
  }

  default:
    usage();
    process.exit(1);
}
