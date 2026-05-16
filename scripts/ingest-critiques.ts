import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { ingestCritiqueOutput } from "../lib/education/loop/generate.ts";
import { ensureSweepLayout } from "../lib/education/loop/io.ts";
import { getSubject } from "../lib/education/loop/subjects.ts";

const sweepId = process.argv[2];

if (!sweepId) {
  process.stderr.write("usage: ingest-critiques <sweep-id>\n");
  process.exit(1);
}

const layout = await ensureSweepLayout(sweepId);
const entries = await readdir(layout.critiques, { withFileTypes: true });
const rawFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".raw.txt"));

if (rawFiles.length === 0) {
  process.stderr.write(`No raw critique files (.raw.txt) found in ${layout.critiques}\n`);
  process.exit(1);
}

let okCount = 0;
let failCount = 0;

for (const file of rawFiles) {
  const subjectId = file.name.replace(/\.raw\.txt$/, "");
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

  const raw = await readFile(join(layout.critiques, file.name), "utf8");
  const outcome = await ingestCritiqueOutput(sweepId, subject, raw);

  if (outcome.kind === "ok") {
    okCount += 1;
    process.stdout.write(`OK   ${subjectId}  ${outcome.percent}%\n`);
  } else {
    failCount += 1;
    process.stdout.write(`FAIL ${subjectId}: ${outcome.reason}\n`);
  }
}

process.stdout.write(`\nIngested ${okCount} ok, ${failCount} failed (sweep: ${sweepId})\n`);
process.exit(failCount === 0 ? 0 : 1);
