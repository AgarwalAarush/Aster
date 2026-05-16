import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseScriptCandidate, type ScriptCandidate } from "./candidate.ts";
import { gradeScriptCandidate } from "./rubric.ts";

type CliResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

export async function runEducationQaCli(argv: string[]): Promise<CliResult> {
  const [command, ...args] = argv;

  try {
    if (command === "archive") {
      return await archiveCandidate(args);
    }

    if (command === "grade") {
      return await gradeCandidates(args);
    }

    return {
      exitCode: 1,
      stdout: "",
      stderr: "Usage: education-qa archive --input <file> --out-dir <dir> | grade --dir <dir>\n",
    };
  } catch (error) {
    return {
      exitCode: 1,
      stdout: "",
      stderr: `${error instanceof Error ? error.message : String(error)}\n`,
    };
  }
}

async function archiveCandidate(args: string[]): Promise<CliResult> {
  const outDir = requiredArg(args, "--out-dir");
  const input = getArg(args, "--input");
  const inputJson = getArg(args, "--input-json");

  if (!input && !inputJson) {
    throw new Error("archive requires --input or --input-json");
  }

  const raw = inputJson ?? (await readFile(input as string, "utf8"));
  const candidate = parseScriptCandidate(JSON.parse(raw));
  const archivePath = join(outDir, `${candidate.id}.json`);

  await mkdir(outDir, { recursive: true });
  await writeFile(archivePath, `${JSON.stringify(candidate, null, 2)}\n`, "utf8");

  return {
    exitCode: 0,
    stdout: `Archived candidate: ${candidate.id}\n${archivePath}\n`,
    stderr: "",
  };
}

async function gradeCandidates(args: string[]): Promise<CliResult> {
  const dir = requiredArg(args, "--dir");
  const candidates = await readArchivedCandidates(dir);
  const grades = candidates
    .map((candidate) => gradeScriptCandidate(candidate))
    .sort((a, b) => b.percent - a.percent);
  const best = grades[0];

  if (!best) {
    throw new Error(`No candidate JSON files found in ${dir}`);
  }

  const lines = [
    `Best candidate: ${best.candidateId}`,
    `Score: ${best.percent}% (${best.score}/${best.maxScore})`,
    "",
    ...grades.map((grade) => `${grade.candidateId}: ${grade.percent}%`),
  ];

  return {
    exitCode: 0,
    stdout: `${lines.join("\n")}\n`,
    stderr: "",
  };
}

async function readArchivedCandidates(dir: string): Promise<ScriptCandidate[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const jsonFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".json"));

  return Promise.all(
    jsonFiles.map(async (entry) => {
      const raw = await readFile(join(dir, entry.name), "utf8");
      return parseScriptCandidate(JSON.parse(raw));
    }),
  );
}

function getArg(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);

  if (index === -1) {
    return undefined;
  }

  return args[index + 1];
}

function requiredArg(args: string[], name: string): string {
  const value = getArg(args, name);

  if (!value) {
    throw new Error(`Missing required argument: ${name}`);
  }

  return value;
}
