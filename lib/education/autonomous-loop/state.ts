import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ArchitectureMode } from "../video-eval/manifest.ts";

export type LoopState = {
  runId: string;
  iteration: number;
  promptRevision: string;
  architecture: ArchitectureMode;
  variantModule: string;
  variantExport: string;
  lastLessonSweepId?: string;
  lastVideoSweepId?: string;
  stoppedReason?: string;
};

const STATE_DIR = join(process.cwd(), "qa-runs", "autonomous-loop");

export function statePath(runId: string): string {
  return join(STATE_DIR, `${runId}.json`);
}

export async function loadLoopState(runId: string): Promise<LoopState | null> {
  try {
    const raw = await readFile(statePath(runId), "utf8");
    return JSON.parse(raw) as LoopState;
  } catch {
    return null;
  }
}

export async function saveLoopState(state: LoopState): Promise<void> {
  await writeFile(statePath(state.runId), `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

export function initialLoopState(
  runId: string,
  options: {
    variantModule: string;
    variantExport: string;
    architecture: ArchitectureMode;
  },
): LoopState {
  return {
    runId,
    iteration: 0,
    promptRevision: "",
    architecture: options.architecture,
    variantModule: options.variantModule,
    variantExport: options.variantExport,
  };
}
