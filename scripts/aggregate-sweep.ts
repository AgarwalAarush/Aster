import { loadCritiquesForSweep, summarizeSweep, writeSummary } from "../lib/education/loop/aggregate.ts";

const sweepId = process.argv[2];

if (!sweepId) {
  process.stderr.write("usage: aggregate-sweep <sweep-id>\n");
  process.exit(1);
}

const reports = await loadCritiquesForSweep(sweepId);

if (reports.length === 0) {
  process.stderr.write(`No critiques found for sweep ${sweepId}\n`);
  process.exit(1);
}

const summary = summarizeSweep(sweepId, reports);
const paths = await writeSummary(sweepId, summary);

process.stdout.write(`\nSummary written:\n  ${paths.json}\n  ${paths.text}\n\n`);

const text = await (await import("node:fs/promises")).readFile(paths.text, "utf8");
process.stdout.write(text);
