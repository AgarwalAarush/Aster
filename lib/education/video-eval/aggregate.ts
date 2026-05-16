import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  VISUAL_CRITERION_MAX,
  VISUAL_TOTAL_MAX,
  parseVisualCritiqueReportSafe,
  type VisualCriterionId,
  type VisualCritiqueReport,
} from "./visual-critique.ts";
import { ensureVideoSweepLayout, videoSweepDir } from "./io.ts";
import { getSubject } from "../loop/subjects.ts";

export type VisualPerSubject = {
  subjectId: string;
  domain: string;
  difficulty: string;
  percent: number;
  totalScore: number;
  maxScore: number;
  wouldRecommendForPipeline: boolean;
  topThreeIssues: string[];
};

export type VisualPerCriterion = {
  id: VisualCriterionId;
  meanScore: number;
  maxScore: number;
  meanPercent: number;
  lowestSubjectId: string;
  lowestScore: number;
};

export type VisualSweepSummary = {
  sweepId: string;
  promptVariantIds: string[];
  architectures: string[];
  frameModes: string[];
  subjectCount: number;
  recommendedCount: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  perSubject: VisualPerSubject[];
  perCriterion: VisualPerCriterion[];
  commonIssues: { issue: string; count: number }[];
};

export async function loadVisualCritiquesForSweep(sweepId: string): Promise<VisualCritiqueReport[]> {
  const layout = await ensureVideoSweepLayout(sweepId);
  const entries = await readdir(layout.critiques, { withFileTypes: true });
  const reports: VisualCritiqueReport[] = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json") || entry.name.endsWith(".failure.json")) {
      continue;
    }
    const raw = await readFile(join(layout.critiques, entry.name), "utf8");
    const parsed = parseVisualCritiqueReportSafe(JSON.parse(raw));
    if (parsed.success) {
      reports.push(parsed.data);
    }
  }

  return reports;
}

export function summarizeVisualSweep(
  sweepId: string,
  reports: VisualCritiqueReport[],
): VisualSweepSummary {
  if (reports.length === 0) {
    throw new Error(`No visual critiques to summarize for sweep ${sweepId}`);
  }

  const percents = reports.map((r) => r.percent).sort((a, b) => a - b);
  const mean = round1(percents.reduce((a, b) => a + b, 0) / percents.length);
  const median = round1(
    percents.length % 2
      ? percents[(percents.length - 1) / 2]
      : (percents[percents.length / 2 - 1] + percents[percents.length / 2]) / 2,
  );

  const perSubject: VisualPerSubject[] = reports
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

  const criterionIds = Object.keys(VISUAL_CRITERION_MAX) as VisualCriterionId[];
  const perCriterion: VisualPerCriterion[] = criterionIds.map((id) => {
    const max = VISUAL_CRITERION_MAX[id];
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
    architectures: [...new Set(reports.map((r) => r.architecture))],
    frameModes: [...new Set(reports.map((r) => r.frameMode))],
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

export async function writeVisualSummary(
  sweepId: string,
  summary: VisualSweepSummary,
): Promise<{ json: string; text: string }> {
  const root = videoSweepDir(sweepId);
  const jsonPath = join(root, "summary.json");
  const textPath = join(root, "summary.txt");
  await writeFile(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  await writeFile(textPath, renderVisualSummaryText(summary), "utf8");
  return { json: jsonPath, text: textPath };
}

function renderVisualSummaryText(summary: VisualSweepSummary): string {
  const lines: string[] = [];
  lines.push(`Video sweep: ${summary.sweepId}`);
  lines.push(`Prompt variant(s): ${summary.promptVariantIds.join(", ")}`);
  lines.push(`Architecture(s): ${summary.architectures.join(", ")}`);
  lines.push(`Frame mode(s): ${summary.frameModes.join(", ")}`);
  lines.push(`Subjects: ${summary.subjectCount}`);
  lines.push(`Mean: ${summary.mean}%   Median: ${summary.median}%   Min: ${summary.min}%   Max: ${summary.max}%`);
  lines.push(`Recommended: ${summary.recommendedCount} / ${summary.subjectCount}`);
  lines.push("");
  lines.push("Per subject:");
  for (const s of summary.perSubject) {
    const rec = s.wouldRecommendForPipeline ? " [REC]" : "";
    lines.push(`  ${s.percent}%  ${s.subjectId}${rec}`);
  }
  lines.push("");
  lines.push("Per criterion (worst first):");
  for (const c of summary.perCriterion) {
    lines.push(
      `  ${c.meanPercent}%  ${c.id}  (${c.meanScore}/${c.maxScore}, lowest: ${c.lowestSubjectId} ${c.lowestScore})`,
    );
  }
  lines.push("");
  lines.push("Common issues:");
  for (const { issue, count } of summary.commonIssues) {
    lines.push(`  x${count}  ${issue.slice(0, 140)}`);
  }
  lines.push("");
  return lines.join("\n");
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export { VISUAL_TOTAL_MAX };
