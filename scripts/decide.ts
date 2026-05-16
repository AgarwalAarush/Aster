import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { sweepDir } from "../lib/education/loop/io.ts";

const newSweepId = process.argv[2];

if (!newSweepId) {
  process.stderr.write("usage: decide <new-sweep-id>\n");
  process.exit(1);
}

const championPath = join(process.cwd(), "qa-runs", "champion.json");
const newSummaryPath = join(sweepDir(newSweepId), "summary.json");

const newSummary = JSON.parse(await readFile(newSummaryPath, "utf8")) as {
  sweepId: string;
  promptVariantIds: string[];
  mean: number;
  median: number;
  min: number;
  max: number;
  perSubject: Array<{ subjectId: string; percent: number }>;
  perCriterion: Array<{ id: string; meanPercent: number }>;
};

type Champion = {
  sweepId: string;
  variantId: string;
  mean: number;
  min: number;
  perSubject: Array<{ subjectId: string; percent: number }>;
  perCriterion: Array<{ id: string; meanPercent: number }>;
};

const THRESHOLD = {
  meanGte: 90,
  perCriterionMeanGte: 85,
  perSubjectGte: 82,
};

let champion: Champion | null = null;
if (existsSync(championPath)) {
  champion = JSON.parse(await readFile(championPath, "utf8")) as Champion;
}

const decisionLines: string[] = [];
decisionLines.push(`New sweep:     ${newSweepId} (${newSummary.promptVariantIds.join(",")})`);
decisionLines.push(`  mean=${newSummary.mean}%  min=${newSummary.min}%  max=${newSummary.max}%`);

let accept = false;
let reason = "";

if (!champion) {
  accept = true;
  reason = "no prior champion; this becomes the baseline champion";
} else {
  decisionLines.push(`Champion:      ${champion.sweepId} (${champion.variantId})`);
  decisionLines.push(`  mean=${champion.mean}%  min=${champion.min}%`);

  const meanDelta = newSummary.mean - champion.mean;
  const minDelta = newSummary.min - champion.min;
  const subjectRegressions = newSummary.perSubject.filter((subject) => {
    const old = champion!.perSubject.find((s) => s.subjectId === subject.subjectId);
    if (!old) return false;
    return subject.percent < old.percent - 3;
  });

  decisionLines.push(`Mean delta:    ${meanDelta >= 0 ? "+" : ""}${meanDelta.toFixed(1)}pp`);
  decisionLines.push(`Min delta:     ${minDelta >= 0 ? "+" : ""}${minDelta.toFixed(1)}pp`);
  decisionLines.push(
    `Per-subject regressions (>3pp drop vs champion on a shared subject): ${subjectRegressions.length}`,
  );
  for (const reg of subjectRegressions) {
    const oldPct = champion.perSubject.find((s) => s.subjectId === reg.subjectId)?.percent ?? 0;
    decisionLines.push(`  - ${reg.subjectId}: ${oldPct}% -> ${reg.percent}%`);
  }

  if (meanDelta >= 0.5 && subjectRegressions.length === 0) {
    accept = true;
    reason = "mean improved by >=0.5pp and no subject regressed by >3pp";
  } else if (Math.abs(meanDelta) < 0.5 && minDelta > 0 && subjectRegressions.length === 0) {
    accept = true;
    reason = "mean held and min improved with no per-subject regressions";
  } else {
    accept = false;
    if (subjectRegressions.length > 0) {
      reason = `${subjectRegressions.length} subject(s) regressed by >3pp`;
    } else if (meanDelta < 0.5) {
      reason = `mean delta ${meanDelta.toFixed(1)}pp is below the +0.5pp acceptance bar`;
    } else {
      reason = "did not satisfy acceptance criteria";
    }
  }
}

decisionLines.push("");
decisionLines.push(`Decision: ${accept ? "ACCEPT" : "REJECT"}`);
decisionLines.push(`Reason:   ${reason}`);

const thresholdHits = {
  meanGte: newSummary.mean >= THRESHOLD.meanGte,
  perCriterionMeanGte: newSummary.perCriterion.every((c) => c.meanPercent >= THRESHOLD.perCriterionMeanGte),
  perSubjectGte: newSummary.perSubject.every((s) => s.percent >= THRESHOLD.perSubjectGte),
};
const thresholdMet = Object.values(thresholdHits).every(Boolean);

decisionLines.push("");
decisionLines.push("Threshold check (mean>=90 & all-criteria-mean>=85 & all-subjects>=82):");
decisionLines.push(`  mean>=90:           ${thresholdHits.meanGte ? "PASS" : "FAIL"}  (${newSummary.mean}%)`);
const worstCriterion = newSummary.perCriterion[0];
decisionLines.push(
  `  per-criterion>=85:  ${thresholdHits.perCriterionMeanGte ? "PASS" : "FAIL"}  (worst: ${worstCriterion.id} ${worstCriterion.meanPercent}%)`,
);
const worstSubject = newSummary.perSubject[newSummary.perSubject.length - 1];
decisionLines.push(
  `  per-subject>=82:    ${thresholdHits.perSubjectGte ? "PASS" : "FAIL"}  (worst: ${worstSubject.subjectId} ${worstSubject.percent}%)`,
);
decisionLines.push("");
decisionLines.push(thresholdMet ? "THRESHOLD MET — stop iterating." : "THRESHOLD NOT MET — continue iterating.");

const out = decisionLines.join("\n") + "\n";
process.stdout.write(out);

await writeFile(join(sweepDir(newSweepId), "decision.txt"), out, "utf8");

if (accept) {
  const newChampion: Champion = {
    sweepId: newSummary.sweepId,
    variantId: newSummary.promptVariantIds[0] ?? "unknown",
    mean: newSummary.mean,
    min: newSummary.min,
    perSubject: newSummary.perSubject.map((s) => ({ subjectId: s.subjectId, percent: s.percent })),
    perCriterion: newSummary.perCriterion.map((c) => ({ id: c.id, meanPercent: c.meanPercent })),
  };
  await writeFile(championPath, `${JSON.stringify(newChampion, null, 2)}\n`, "utf8");
  process.stdout.write(`\nUpdated champion -> ${championPath}\n`);
}

process.exit(thresholdMet ? 0 : accept ? 0 : 0);
