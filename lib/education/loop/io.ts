import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { LectureLesson, Subject } from "./schema.ts";
import type { CritiqueParseResult, ParseResult } from "./parse.ts";
import type { CritiqueReport } from "./critique.ts";

const QA_RUNS_ROOT = join(process.cwd(), "qa-runs");

export function sweepDir(sweepId: string): string {
  return join(QA_RUNS_ROOT, sweepId);
}

export async function ensureSweepLayout(sweepId: string): Promise<{
  root: string;
  candidates: string;
  raw: string;
  failures: string;
  critiques: string;
}> {
  const root = sweepDir(sweepId);
  const candidates = join(root, "candidates");
  const raw = join(root, "raw");
  const failures = join(root, "failures");
  const critiques = join(root, "critiques");

  await mkdir(candidates, { recursive: true });
  await mkdir(raw, { recursive: true });
  await mkdir(failures, { recursive: true });
  await mkdir(critiques, { recursive: true });

  return { root, candidates, raw, failures, critiques };
}

export async function writeRawAgentOutput(
  sweepId: string,
  subject: Subject,
  raw: string,
): Promise<string> {
  const layout = await ensureSweepLayout(sweepId);
  const path = join(layout.raw, `${subject.id}.txt`);
  await writeFile(path, raw, "utf8");
  return path;
}

export async function writeCandidateLesson(
  sweepId: string,
  lesson: LectureLesson,
): Promise<string> {
  const layout = await ensureSweepLayout(sweepId);
  const path = join(layout.candidates, `${lesson.topic.id}.json`);
  await writeFile(path, `${JSON.stringify(lesson, null, 2)}\n`, "utf8");
  return path;
}

export async function writeFailure(
  sweepId: string,
  subject: Subject,
  result: ParseResult & { ok: false },
): Promise<string> {
  const layout = await ensureSweepLayout(sweepId);
  const path = join(layout.failures, `${subject.id}.json`);
  const body = {
    subjectId: subject.id,
    reason: result.reason,
    detail: result.detail,
    raw: result.raw,
  };
  await writeFile(path, `${JSON.stringify(body, null, 2)}\n`, "utf8");
  return path;
}

export async function writeRawCritique(
  sweepId: string,
  subject: Subject,
  raw: string,
): Promise<string> {
  const layout = await ensureSweepLayout(sweepId);
  const path = join(layout.critiques, `${subject.id}.raw.txt`);
  await writeFile(path, raw, "utf8");
  return path;
}

export async function writeCritiqueReport(
  sweepId: string,
  report: CritiqueReport,
): Promise<string> {
  const layout = await ensureSweepLayout(sweepId);
  const path = join(layout.critiques, `${report.subjectId}.json`);
  await writeFile(path, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return path;
}

export async function writeCritiqueFailure(
  sweepId: string,
  subject: Subject,
  result: CritiqueParseResult & { ok: false },
): Promise<string> {
  const layout = await ensureSweepLayout(sweepId);
  const path = join(layout.failures, `${subject.id}.critique.json`);
  const body = {
    subjectId: subject.id,
    stage: "critique",
    reason: result.reason,
    detail: result.detail,
    raw: result.raw,
  };
  await writeFile(path, `${JSON.stringify(body, null, 2)}\n`, "utf8");
  return path;
}

export async function writeSweepManifest(
  sweepId: string,
  manifest: Record<string, unknown>,
): Promise<string> {
  const layout = await ensureSweepLayout(sweepId);
  const path = join(layout.root, "manifest.json");
  await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return path;
}
