import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { ingestAgentOutput } from "../lib/education/loop/generate.ts";
import { sweepDir } from "../lib/education/loop/io.ts";
import { getSubject } from "../lib/education/loop/subjects.ts";

const sweepId = process.argv[2];

if (!sweepId) {
  process.stderr.write("usage: ingest-sweep <sweep-id>\n");
  process.exit(1);
}

const rawDir = join(sweepDir(sweepId), "raw");
const entries = await readdir(rawDir, { withFileTypes: true });
const rawFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".txt"));

if (rawFiles.length === 0) {
  process.stderr.write(`No raw .txt files found in ${rawDir}\n`);
  process.exit(1);
}

let okCount = 0;
let failCount = 0;

for (const file of rawFiles) {
  const subjectId = file.name.replace(/\.txt$/, "");
  let subject;
  try {
    subject = getSubject(subjectId);
  } catch (error) {
    process.stderr.write(
      `skip ${subjectId}: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    failCount += 1;
    continue;
  }

  const raw = await readFile(join(rawDir, file.name), "utf8");
  const outcome = await ingestAgentOutput(sweepId, subject, raw);

  if (outcome.kind === "ok") {
    okCount += 1;
    const warnings = outcome.warnings.length === 0 ? "" : ` (warnings: ${outcome.warnings.length})`;
    process.stdout.write(`OK   ${subjectId}${warnings}\n`);
    for (const warning of outcome.warnings) {
      process.stdout.write(`     ! ${warning}\n`);
    }
  } else {
    failCount += 1;
    process.stdout.write(`FAIL ${subjectId}: ${outcome.reason}\n`);
  }
}

process.stdout.write(`\nIngested ${okCount} ok, ${failCount} failed (sweep: ${sweepId})\n`);
process.exit(failCount === 0 ? 0 : 1);
