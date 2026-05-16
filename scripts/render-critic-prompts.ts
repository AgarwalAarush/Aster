import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { buildCriticPrompt } from "../lib/education/loop/critique.ts";
import { ensureSweepLayout, sweepDir } from "../lib/education/loop/io.ts";
import { parseLectureLesson } from "../lib/education/loop/schema.ts";
import { getSubject } from "../lib/education/loop/subjects.ts";

const sweepId = process.argv[2];

if (!sweepId) {
  process.stderr.write("usage: render-critic-prompts <sweep-id>\n");
  process.exit(1);
}

const layout = await ensureSweepLayout(sweepId);
const promptsDir = join(sweepDir(sweepId), "critic-prompts");
await mkdir(promptsDir, { recursive: true });

const entries = await readdir(layout.candidates, { withFileTypes: true });
const candidateFiles = entries.filter((e) => e.isFile() && e.name.endsWith(".json"));

for (const file of candidateFiles) {
  const subjectId = file.name.replace(/\.json$/, "");
  const subject = getSubject(subjectId);
  const lesson = parseLectureLesson(JSON.parse(await readFile(join(layout.candidates, file.name), "utf8")));
  const { systemPrompt, userPrompt } = buildCriticPrompt(subject, lesson);
  const body = `${systemPrompt}\n\n---\n\n${userPrompt}\n\nReturn ONLY the JSON object as your response. No commentary, no markdown fences.\n`;
  const path = join(promptsDir, `${subjectId}.critic.txt`);
  await writeFile(path, body, "utf8");
  process.stdout.write(`wrote ${path}\n`);
}
