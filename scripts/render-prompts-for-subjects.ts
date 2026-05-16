import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { buildGeneratorPrompt } from "../lib/education/loop/generate.ts";
import { sweepDir } from "../lib/education/loop/io.ts";
import { getSubject } from "../lib/education/loop/subjects.ts";
import type { PromptVariant } from "../lib/education/loop/schema.ts";

const sweepId = process.argv[2];
const variantModule = process.argv[3];
const variantExportName = process.argv[4];
const subjectIdsCsv = process.argv[5];

if (!sweepId || !variantModule || !variantExportName || !subjectIdsCsv) {
  process.stderr.write(
    "usage: render-prompts-for-subjects <sweep-id> <variant-module-path> <variant-export-name> <subject-ids-csv>\n",
  );
  process.exit(1);
}

const subjectIds = subjectIdsCsv.split(",").map((id) => id.trim()).filter(Boolean);
const absolute = resolve(process.cwd(), variantModule);
const imported = (await import(absolute)) as Record<string, unknown>;
const variant = imported[variantExportName] as PromptVariant | undefined;

if (!variant || typeof variant.systemPrompt !== "string") {
  process.stderr.write(
    `Module ${variantModule} does not export a PromptVariant named ${variantExportName}\n`,
  );
  process.exit(1);
}

const promptsDir = join(sweepDir(sweepId), "prompts");
await mkdir(promptsDir, { recursive: true });

for (const subjectId of subjectIds) {
  const subject = getSubject(subjectId);
  const prompt = buildGeneratorPrompt(subject, variant);
  const body = `${prompt.systemPrompt}\n\n---\n\n${prompt.userPrompt}\n\nYour final response must be exactly the JSON object. No commentary, no markdown fences, no preamble, no closing remarks. Just the JSON.\n`;
  const path = join(promptsDir, `${subjectId}.prompt.txt`);
  await writeFile(path, body, "utf8");
  process.stdout.write(`wrote ${path}\n`);
}
