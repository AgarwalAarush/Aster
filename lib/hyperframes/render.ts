import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import type { ScenePlan } from "../education/schema";
import { generateCompositionHtml } from "./composition";

const execFileAsync = promisify(execFile);

type RunCommandOptions = {
  cwd?: string;
};

export type RunCommand = (
  command: string,
  args: string[],
  options: RunCommandOptions,
) => Promise<void>;

type RenderScenePlanOptions = {
  generatedRoot?: string;
  rendersRoot?: string;
  jobId?: string;
  quality?: string;
  runCommand?: RunCommand;
};

export type RenderResult = {
  jobId: string;
  jobDir: string;
  outputPath: string;
  publicUrl: string;
};

export async function renderScenePlan(
  plan: ScenePlan,
  question: string,
  options: RenderScenePlanOptions = {},
): Promise<RenderResult> {
  const jobId = options.jobId ?? randomUUID();
  const quality = options.quality ?? process.env.HYPERFRAMES_RENDER_QUALITY ?? "standard";
  const jobDir = options.generatedRoot
    ? join(options.generatedRoot, jobId)
    : join(process.cwd(), "generated", jobId);
  const rendersRoot = options.rendersRoot ?? join(process.cwd(), "public", "renders");
  const outputPath = options.rendersRoot
    ? join(options.rendersRoot, `${jobId}.mp4`)
    : join(process.cwd(), "public", "renders", `${jobId}.mp4`);
  const runCommand = options.runCommand ?? runCommandWithExecFile;

  await mkdir(jobDir, { recursive: true });
  await mkdir(rendersRoot, { recursive: true });
  await writeFile(join(jobDir, "index.html"), generateCompositionHtml(plan, question), "utf8");
  await writeFile(join(jobDir, "question.txt"), question, "utf8");
  await writeFile(join(jobDir, "scene-plan.json"), `${JSON.stringify(plan, null, 2)}\n`, "utf8");

  await runCommand("npx", ["hyperframes", "lint", jobDir], {});
  await runCommand(
    "npx",
    ["hyperframes", "render", "--output", outputPath, "--quality", quality],
    { cwd: jobDir },
  );

  return {
    jobId,
    jobDir,
    outputPath,
    publicUrl: `/renders/${jobId}.mp4`,
  };
}

async function runCommandWithExecFile(
  command: string,
  args: string[],
  options: RunCommandOptions,
): Promise<void> {
  try {
    await execFileAsync(command, args, {
      cwd: options.cwd,
      env: process.env,
      maxBuffer: 1024 * 1024 * 16,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Command failed: ${command} ${args.join(" ")}\n${message}`);
  }
}
