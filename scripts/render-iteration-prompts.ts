import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { buildGeneratorPrompt } from "../lib/education/loop/generate.ts";
import { sweepDir } from "../lib/education/loop/io.ts";
import { ITERATION_SUBJECT_IDS } from "../lib/education/loop/iteration-subjects.ts";
import { getSubject } from "../lib/education/loop/subjects.ts";
import type { PromptVariant } from "../lib/education/loop/schema.ts";

const sweepId = process.argv[2];
const variantModule = process.argv[3];
const variantExportName = process.argv[4];

if (!sweepId || !variantModule || !variantExportName) {
  process.stderr.write(
    "usage: render-iteration-prompts <sweep-id> <variant-module-path> <variant-export-name>\n" +
      "example: render-iteration-prompts 2026-05-15-v1 lib/education/loop/prompts/v1.ts WHITEBOARD_V1\n",
  );
  process.exit(1);
}

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

for (const subjectId of ITERATION_SUBJECT_IDS) {
  const subject = getSubject(subjectId);
  const prompt = buildGeneratorPrompt(subject, variant);
  const body = `${prompt.systemPrompt}\n\n---\n\n${prompt.userPrompt}\n\nYour final response must be exactly the JSON object. No commentary, no markdown fences, no preamble, no closing remarks. Just the JSON.\n`;
  const path = join(promptsDir, `${subjectId}.prompt.txt`);
  await writeFile(path, body, "utf8");
  process.stdout.write(`wrote ${path}\n`);
}
