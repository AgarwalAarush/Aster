import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { buildGeneratorPrompt } from "../lib/education/loop/generate.ts";
import { sweepDir } from "../lib/education/loop/io.ts";
import { WHITEBOARD_V0 } from "../lib/education/loop/prompts/v0.ts";
import { getSubject } from "../lib/education/loop/subjects.ts";

const BASELINE_SUBJECT_IDS = [
  "dropout-regularization",
  "grouped-query-attention",
  "bias-variance-tradeoff",
  "em-algorithm",
  "bayes-rule",
  "kl-divergence",
  "eigenvectors-pca",
  "fourier-transform",
  "dynamic-programming",
  "rlhf",
];

const sweepId = process.argv[2];

if (!sweepId) {
  process.stderr.write("usage: render-baseline-prompts <sweep-id>\n");
  process.exit(1);
}

const promptsDir = join(sweepDir(sweepId), "prompts");
await mkdir(promptsDir, { recursive: true });

for (const subjectId of BASELINE_SUBJECT_IDS) {
  const subject = getSubject(subjectId);
  const prompt = buildGeneratorPrompt(subject, WHITEBOARD_V0);
  const body = `${prompt.systemPrompt}\n\n---\n\n${prompt.userPrompt}\n\nYour final response must be exactly the JSON object. No commentary, no markdown fences, no preamble, no closing remarks. Just the JSON.\n`;
  const path = join(promptsDir, `${subjectId}.prompt.txt`);
  await writeFile(path, body, "utf8");
  process.stdout.write(`wrote ${path}\n`);
}
