import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { LectureLesson, Subject } from "../loop/schema.ts";
import type { VisualCritiqueReport } from "./visual-critique.ts";
import type { VideoSweepManifest } from "./manifest.ts";

const QA_RUNS_ROOT = join(process.cwd(), "qa-runs");

export function videoSweepDir(sweepId: string): string {
  return join(QA_RUNS_ROOT, sweepId);
}

export function videoChampionPath(): string {
  return join(QA_RUNS_ROOT, "video-champion.json");
}

export async function ensureVideoSweepLayout(sweepId: string): Promise<{
  root: string;
  candidates: string;
  raw: string;
  failures: string;
  jobs: string;
  frames: string;
  prompts: string;
  visualCriticPrompts: string;
  critiques: string;
}> {
  const root = videoSweepDir(sweepId);
  const candidates = join(root, "candidates");
  const raw = join(root, "raw");
  const failures = join(root, "failures");
  const jobs = join(root, "jobs");
  const frames = join(root, "frames");
  const prompts = join(root, "prompts");
  const visualCriticPrompts = join(root, "visual-critic-prompts");
  const critiques = join(root, "critiques");

  await mkdir(candidates, { recursive: true });
  await mkdir(raw, { recursive: true });
  await mkdir(failures, { recursive: true });
  await mkdir(jobs, { recursive: true });
  await mkdir(frames, { recursive: true });
  await mkdir(prompts, { recursive: true });
  await mkdir(visualCriticPrompts, { recursive: true });
  await mkdir(critiques, { recursive: true });

  return {
    root,
    candidates,
    raw,
    failures,
    jobs,
    frames,
    prompts,
    visualCriticPrompts,
    critiques,
  };
}

export async function writeVideoManifest(
  sweepId: string,
  manifest: VideoSweepManifest,
): Promise<string> {
  const layout = await ensureVideoSweepLayout(sweepId);
  const path = join(layout.root, "manifest.json");
  await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return path;
}

export async function writeRawCandidateOutput(
  sweepId: string,
  subject: Subject,
  raw: string,
): Promise<string> {
  const layout = await ensureVideoSweepLayout(sweepId);
  const path = join(layout.raw, `${subject.id}.txt`);
  await writeFile(path, raw, "utf8");
  return path;
}

export async function writeVideoCandidateLesson(
  sweepId: string,
  lesson: LectureLesson,
): Promise<string> {
  const layout = await ensureVideoSweepLayout(sweepId);
  const path = join(layout.candidates, `${lesson.topic.id}.json`);
  await writeFile(path, `${JSON.stringify(lesson, null, 2)}\n`, "utf8");
  return path;
}

export async function writeVideoCandidateFailure(
  sweepId: string,
  subject: Subject,
  body: { reason: string; detail: string; raw: string },
): Promise<string> {
  const layout = await ensureVideoSweepLayout(sweepId);
  const path = join(layout.failures, `${subject.id}.json`);
  await writeFile(
    path,
    `${JSON.stringify({ subjectId: subject.id, ...body }, null, 2)}\n`,
    "utf8",
  );
  return path;
}

export function jobDir(sweepId: string, subjectId: string): string {
  return join(videoSweepDir(sweepId), "jobs", subjectId);
}

export function framesDir(sweepId: string, subjectId: string): string {
  return join(videoSweepDir(sweepId), "frames", subjectId);
}

export async function writeRawVisualCritique(
  sweepId: string,
  subject: Subject,
  raw: string,
): Promise<string> {
  const layout = await ensureVideoSweepLayout(sweepId);
  const path = join(layout.critiques, `${subject.id}.raw.txt`);
  await writeFile(path, raw, "utf8");
  return path;
}

export async function writeVisualCritiqueReport(
  sweepId: string,
  report: VisualCritiqueReport,
): Promise<string> {
  const layout = await ensureVideoSweepLayout(sweepId);
  const path = join(layout.critiques, `${report.subjectId}.json`);
  await writeFile(path, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return path;
}

export async function writeVisualCritiqueFailure(
  sweepId: string,
  subject: Subject,
  body: { reason: string; detail: string; raw: string },
): Promise<string> {
  const layout = await ensureVideoSweepLayout(sweepId);
  const path = join(layout.critiques, `${subject.id}.failure.json`);
  await writeFile(
    path,
    `${JSON.stringify({ subjectId: subject.id, ...body }, null, 2)}\n`,
    "utf8",
  );
  return path;
}
