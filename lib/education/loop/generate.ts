import { renderUserPrompt } from "./prompts/v0.ts";
import { parseCritiqueResponse, parseLessonResponse, type ParseResult } from "./parse.ts";
import {
  writeCandidateLesson,
  writeCritiqueFailure,
  writeCritiqueReport,
  writeFailure,
  writeRawAgentOutput,
  writeRawCritique,
} from "./io.ts";
import type { PromptVariant, Subject } from "./schema.ts";

export type GeneratorPrompt = {
  subject: Subject;
  variant: PromptVariant;
  systemPrompt: string;
  userPrompt: string;
};

export function buildGeneratorPrompt(subject: Subject, variant: PromptVariant): GeneratorPrompt {
  return {
    subject,
    variant,
    systemPrompt: variant.systemPrompt,
    userPrompt: renderUserPrompt(variant.userPromptTemplate, subject),
  };
}

export type IngestOutcome =
  | {
      kind: "ok";
      subjectId: string;
      candidatePath: string;
      rawPath: string;
      warnings: string[];
    }
  | {
      kind: "failed";
      subjectId: string;
      reason: string;
      failurePath: string;
      rawPath: string;
    };

export async function ingestAgentOutput(
  sweepId: string,
  subject: Subject,
  raw: string,
): Promise<IngestOutcome> {
  const rawPath = await writeRawAgentOutput(sweepId, subject, raw);
  const parsed: ParseResult = parseLessonResponse(raw);

  if (!parsed.ok) {
    const failurePath = await writeFailure(sweepId, subject, parsed);
    return {
      kind: "failed",
      subjectId: subject.id,
      reason: `${parsed.reason}: ${parsed.detail}`,
      failurePath,
      rawPath,
    };
  }

  const candidatePath = await writeCandidateLesson(sweepId, parsed.lesson);
  return {
    kind: "ok",
    subjectId: subject.id,
    candidatePath,
    rawPath,
    warnings: parsed.warnings,
  };
}

export type CritiqueIngestOutcome =
  | {
      kind: "ok";
      subjectId: string;
      reportPath: string;
      rawPath: string;
      percent: number;
    }
  | {
      kind: "failed";
      subjectId: string;
      reason: string;
      failurePath: string;
      rawPath: string;
    };

export async function ingestCritiqueOutput(
  sweepId: string,
  subject: Subject,
  raw: string,
): Promise<CritiqueIngestOutcome> {
  const rawPath = await writeRawCritique(sweepId, subject, raw);
  const parsed = parseCritiqueResponse(raw);

  if (!parsed.ok) {
    const failurePath = await writeCritiqueFailure(sweepId, subject, parsed);
    return {
      kind: "failed",
      subjectId: subject.id,
      reason: `${parsed.reason}: ${parsed.detail}`,
      failurePath,
      rawPath,
    };
  }

  const reportPath = await writeCritiqueReport(sweepId, parsed.report);
  return {
    kind: "ok",
    subjectId: subject.id,
    reportPath,
    rawPath,
    percent: parsed.report.percent,
  };
}
