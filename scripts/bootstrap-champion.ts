import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { loadCritiquesForSweep, summarizeSweep } from "../lib/education/loop/aggregate.ts";
import { ITERATION_SUBJECT_IDS } from "../lib/education/loop/iteration-subjects.ts";

const sourceSweepId = process.argv[2];
const filterToIterationSet = process.argv[3] === "--filter-iteration";

if (!sourceSweepId) {
  process.stderr.write("usage: bootstrap-champion <source-sweep-id> [--filter-iteration]\n");
  process.exit(1);
}

let reports = await loadCritiquesForSweep(sourceSweepId);

if (filterToIterationSet) {
  const iterationSet = new Set<string>(ITERATION_SUBJECT_IDS);
  reports = reports.filter((report) => iterationSet.has(report.subjectId));
  process.stdout.write(`filtered to ${reports.length} iteration subjects\n`);
}

const summary = summarizeSweep(`${sourceSweepId}-iter5`, reports);

const champion = {
  sweepId: summary.sweepId,
  variantId: summary.promptVariantIds[0] ?? "unknown",
  mean: summary.mean,
  min: summary.min,
  perSubject: summary.perSubject.map((s) => ({ subjectId: s.subjectId, percent: s.percent })),
  perCriterion: summary.perCriterion.map((c) => ({ id: c.id, meanPercent: c.meanPercent })),
};

const championPath = join(process.cwd(), "qa-runs", "champion.json");
await writeFile(championPath, `${JSON.stringify(champion, null, 2)}\n`, "utf8");

process.stdout.write(`Wrote champion -> ${championPath}\n`);
process.stdout.write(`mean=${champion.mean}%  min=${champion.min}%  variant=${champion.variantId}\n`);
process.stdout.write("Per subject:\n");
for (const s of champion.perSubject) {
  process.stdout.write(`  ${s.percent}%  ${s.subjectId}\n`);
}
process.stdout.write("Worst criteria:\n");
for (const c of champion.perCriterion.slice(0, 5)) {
  process.stdout.write(`  ${c.meanPercent}%  ${c.id}\n`);
}
