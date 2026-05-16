import { parseLectureLessonSafe, validateBoardCoherence, type LectureLesson } from "./schema.ts";
import { parseCritiqueReportSafe, type CritiqueReport } from "./critique.ts";

export type ParseSuccess = {
  ok: true;
  lesson: LectureLesson;
  warnings: string[];
};

export type ParseFailure = {
  ok: false;
  reason: "no-json-found" | "invalid-json" | "schema-mismatch";
  detail: string;
  raw: string;
};

export type ParseResult = ParseSuccess | ParseFailure;

export function extractJsonObject(raw: string): string | null {
  const trimmed = raw.trim();

  if (trimmed.startsWith("{")) {
    const balanced = sliceBalancedObject(trimmed);
    if (balanced) {
      return balanced;
    }
  }

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    const inner = fenceMatch[1].trim();
    if (inner.startsWith("{")) {
      return sliceBalancedObject(inner) ?? inner;
    }
  }

  const firstBrace = trimmed.indexOf("{");
  if (firstBrace === -1) {
    return null;
  }

  return sliceBalancedObject(trimmed.slice(firstBrace));
}

function sliceBalancedObject(input: string): string | null {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\" && inString) {
      escaped = true;
      continue;
    }

    if (char === "\"") {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return input.slice(0, index + 1);
      }
    }
  }

  return null;
}

export function parseLessonResponse(raw: string): ParseResult {
  const jsonText = extractJsonObject(raw);

  if (!jsonText) {
    return { ok: false, reason: "no-json-found", detail: "No JSON object found in response", raw };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    return {
      ok: false,
      reason: "invalid-json",
      detail: error instanceof Error ? error.message : String(error),
      raw,
    };
  }

  const result = parseLectureLessonSafe(parsed);
  if (!result.success) {
    return {
      ok: false,
      reason: "schema-mismatch",
      detail: result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "),
      raw,
    };
  }

  return {
    ok: true,
    lesson: result.data,
    warnings: validateBoardCoherence(result.data),
  };
}

export type CritiqueParseSuccess = {
  ok: true;
  report: CritiqueReport;
};

export type CritiqueParseFailure = {
  ok: false;
  reason: "no-json-found" | "invalid-json" | "schema-mismatch";
  detail: string;
  raw: string;
};

export type CritiqueParseResult = CritiqueParseSuccess | CritiqueParseFailure;

export function parseCritiqueResponse(raw: string): CritiqueParseResult {
  const jsonText = extractJsonObject(raw);

  if (!jsonText) {
    return { ok: false, reason: "no-json-found", detail: "No JSON object found in critique response", raw };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    return {
      ok: false,
      reason: "invalid-json",
      detail: error instanceof Error ? error.message : String(error),
      raw,
    };
  }

  const result = parseCritiqueReportSafe(parsed);
  if (!result.success) {
    return {
      ok: false,
      reason: "schema-mismatch",
      detail: result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "),
      raw,
    };
  }

  return { ok: true, report: result.data };
}
