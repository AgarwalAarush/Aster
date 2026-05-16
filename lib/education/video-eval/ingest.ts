import { parseLessonResponse } from "../loop/parse.ts";
import type { Subject } from "../loop/schema.ts";
import { parseVisualCritiqueResponse } from "./visual-critique.ts";
import {
  writeRawCandidateOutput,
  writeVideoCandidateFailure,
  writeVideoCandidateLesson,
  writeRawVisualCritique,
  writeVisualCritiqueFailure,
  writeVisualCritiqueReport,
} from "./io.ts";

export type CandidateIngestOutcome =
  | { kind: "ok"; subjectId: string; candidatePath: string; warnings: string[] }
  | { kind: "failed"; subjectId: string; reason: string };

export async function ingestVideoCandidateOutput(
  sweepId: string,
  subject: Subject,
  raw: string,
): Promise<CandidateIngestOutcome> {
  await writeRawCandidateOutput(sweepId, subject, raw);
  const parsed = parseLessonResponse(raw);

  if (!parsed.ok) {
    await writeVideoCandidateFailure(sweepId, subject, {
      reason: parsed.reason,
      detail: parsed.detail,
      raw: parsed.raw,
    });
    return {
      kind: "failed",
      subjectId: subject.id,
      reason: `${parsed.reason}: ${parsed.detail}`,
    };
  }

  const candidatePath = await writeVideoCandidateLesson(sweepId, parsed.lesson);
  return {
    kind: "ok",
    subjectId: subject.id,
    candidatePath,
    warnings: parsed.warnings,
  };
}

export type VisualCritiqueIngestOutcome =
  | { kind: "ok"; subjectId: string; reportPath: string; percent: number }
  | { kind: "failed"; subjectId: string; reason: string };

export async function ingestVisualCritiqueOutput(
  sweepId: string,
  subject: Subject,
  raw: string,
): Promise<VisualCritiqueIngestOutcome> {
  await writeRawVisualCritique(sweepId, subject, raw);
  const parsed = parseVisualCritiqueResponse(raw);

  if (!parsed.ok) {
    await writeVisualCritiqueFailure(sweepId, subject, {
      reason: parsed.reason,
      detail: parsed.detail,
      raw: parsed.raw,
    });
    return {
      kind: "failed",
      subjectId: subject.id,
      reason: `${parsed.reason}: ${parsed.detail}`,
    };
  }

  const reportPath = await writeVisualCritiqueReport(sweepId, parsed.report);
  return {
    kind: "ok",
    subjectId: subject.id,
    reportPath,
    percent: parsed.report.percent,
  };
}
