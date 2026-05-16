import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { CRITERION_MAX, TOTAL_MAX, parseCritiqueReportSafe, type CriterionId, type CritiqueReport } from "./critique.ts";
import { ensureSweepLayout, sweepDir } from "./io.ts";
import { getSubject } from "./subjects.ts";

export type PerSubject = {
  subjectId: string;
  domain: string;
  difficulty: string;
  percent: number;
  totalScore: number;
  maxScore: number;
  wouldRecommendForPipeline: boolean;
  topThreeIssues: string[];
};

export type PerCriterion = {
  id: CriterionId;
  meanScore: number;
  maxScore: number;
  meanPercent: number;
  lowestSubjectId: string;
  lowestScore: number;
};

export type SweepSummary = {
  sweepId: string;
  promptVariantIds: string[];
  subjectCount: number;
  recommendedCount: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  perSubject: PerSubject[];
  perCriterion: PerCriterion[];
  commonIssues: { issue: string; count: number }[];
};

export async function loadCritiquesForSweep(sweepId: string): Promise<CritiqueReport[]> {
  const layout = await ensureSweepLayout(sweepId);
  const entries = await readdir(layout.critiques, { withFileTypes: true });
  const reports: CritiqueReport[] = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) {
      continue;
    }
    const raw = await readFile(join(layout.critiques, entry.name), "utf8");
    const parsed = parseCritiqueReportSafe(JSON.parse(raw));
    if (parsed.success) {
      reports.push(parsed.data);
    }
  }

  return reports;
}

export function summarizeSweep(sweepId: string, reports: CritiqueReport[]): SweepSummary {
  if (reports.length === 0) {
    throw new Error(`No critiques to summarize for sweep ${sweepId}`);
  }

  const percents = reports.map((r) => r.percent).sort((a, b) => a - b);
  const mean = round1(percents.reduce((a, b) => a + b, 0) / percents.length);
  const median = round1(
    percents.length % 2
      ? percents[(percents.length - 1) / 2]
      : (percents[percents.length / 2 - 1] + percents[percents.length / 2]) / 2,
  );

  const perSubject: PerSubject[] = reports
    .map((report) => {
      const subject = getSubject(report.subjectId);
      return {
        subjectId: report.subjectId,
        domain: subject.domain,
        difficulty: subject.difficulty,
        percent: report.percent,
        totalScore: report.totalScore,
        maxScore: report.maxScore,
        wouldRecommendForPipeline: report.wouldRecommendForPipeline,
        topThreeIssues: report.topThreeIssues,
      };
    })
    .sort((a, b) => b.percent - a.percent);

  const criterionIds = Object.keys(CRITERION_MAX) as CriterionId[];
  const perCriterion: PerCriterion[] = criterionIds.map((id) => {
    const max = CRITERION_MAX[id];
    const scores = reports.map((report) => {
      const found = report.criteria.find((c) => c.id === id);
      return { subjectId: report.subjectId, score: found ? found.score : 0 };
    });
    const meanScore = round1(scores.reduce((sum, s) => sum + s.score, 0) / scores.length);
    const lowest = scores.reduce((acc, s) => (s.score < acc.score ? s : acc), scores[0]);

    return {
      id,
      meanScore,
      maxScore: max,
      meanPercent: round1((meanScore / max) * 100),
      lowestSubjectId: lowest.subjectId,
      lowestScore: lowest.score,
    };
  });

  const issueCounts = new Map<string, number>();
  for (const report of reports) {
    for (const issue of report.topThreeIssues) {
      const normalized = issue.trim().toLowerCase();
      issueCounts.set(normalized, (issueCounts.get(normalized) ?? 0) + 1);
    }
  }
  const commonIssues = [...issueCounts.entries()]
    .map(([issue, count]) => ({ issue, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    sweepId,
    promptVariantIds: [...new Set(reports.map((r) => r.promptVariantId))],
    subjectCount: reports.length,
    recommendedCount: reports.filter((r) => r.wouldRecommendForPipeline).length,
    mean,
    median,
    min: percents[0],
    max: percents[percents.length - 1],
    perSubject,
    perCriterion: perCriterion.sort((a, b) => a.meanPercent - b.meanPercent),
    commonIssues,
  };
}

export async function writeSummary(sweepId: string, summary: SweepSummary): Promise<{ json: string; text: string }> {
  const root = sweepDir(sweepId);
  const jsonPath = join(root, "summary.json");
  const textPath = join(root, "summary.txt");
  await writeFile(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  await writeFile(textPath, renderSummaryText(summary), "utf8");
  return { json: jsonPath, text: textPath };
}

function renderSummaryText(summary: SweepSummary): string {
  const lines: string[] = [];
  lines.push(`Sweep: ${summary.sweepId}`);
  lines.push(`Prompt variant(s): ${summary.promptVariantIds.join(", ")}`);
  lines.push(`Subjects critiqued: ${summary.subjectCount}`);
  lines.push(`Mean: ${summary.mean}%   Median: ${summary.median}%   Min: ${summary.min}%   Max: ${summary.max}%`);
  lines.push(`Recommended for pipeline: ${summary.recommendedCount} / ${summary.subjectCount}`);
  lines.push("");
  lines.push("Per subject (sorted by percent, descending):");
  for (const subject of summary.perSubject) {
    const rec = subject.wouldRecommendForPipeline ? " [REC]" : "";
    lines.push(
      `  ${pad(subject.percent.toString(), 3)}%  ${pad(subject.domain, 18)}  ${pad(subject.difficulty, 12)}  ${subject.subjectId}${rec}`,
    );
  }
  lines.push("");
  lines.push("Per criterion (sorted by mean percent, ascending — worst first):");
  lines.push("  pct%  mean/max  criterion-id                       lowest-subject");
  for (const c of summary.perCriterion) {
    lines.push(
      `  ${pad(c.meanPercent.toString(), 4)}  ${pad(`${c.meanScore}/${c.maxScore}`, 8)}  ${pad(c.id, 32)}  ${c.lowestSubjectId} (${c.lowestScore})`,
    );
  }
  lines.push("");
  lines.push("Most common issues raised across subjects:");
  for (const { issue, count } of summary.commonIssues) {
    lines.push(`  x${count}  ${truncate(issue, 140)}`);
  }
  lines.push("");
  return lines.join("\n");
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function pad(value: string, width: number): string {
  return value.length >= width ? value : value + " ".repeat(width - value.length);
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

export { TOTAL_MAX };
