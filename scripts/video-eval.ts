import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import {
  loadVisualCritiquesForSweep,
  summarizeVisualSweep,
  writeVisualSummary,
} from "../lib/education/video-eval/aggregate.ts";
import { captureMp4Frames, captureTimelineFrames } from "../lib/education/video-eval/capture.ts";
import { DEFAULT_FRAME_TIMESTAMPS_SEC } from "../lib/education/video-eval/constants.ts";
import { ingestVideoCandidateOutput, ingestVisualCritiqueOutput } from "../lib/education/video-eval/ingest.ts";
import {
  ensureVideoSweepLayout,
  framesDir,
  jobDir,
  videoChampionPath,
  videoSweepDir,
  writeVideoManifest,
} from "../lib/education/video-eval/io.ts";
import {
  parseVideoSweepManifest,
  type ArchitectureMode,
  type FrameMode,
  type VideoSweepManifest,
} from "../lib/education/video-eval/manifest.ts";
import { buildVisualCriticPrompt } from "../lib/education/video-eval/visual-critique.ts";
import { buildGeneratorPrompt } from "../lib/education/loop/generate.ts";
import { ITERATION_SUBJECT_IDS } from "../lib/education/loop/iteration-subjects.ts";
import { parseLectureLesson } from "../lib/education/loop/schema.ts";
import { getSubject } from "../lib/education/loop/subjects.ts";
import type { PromptVariant } from "../lib/education/loop/schema.ts";
import type { WhiteboardCompositionOptions } from "../lib/hyperframes/composition-options.ts";
import { generateWhiteboardHtml } from "../lib/hyperframes/whiteboard-composition.ts";
import { renderLesson } from "../lib/hyperframes/render.ts";

const execFileAsync = promisify(execFile);

const phase = process.argv[2];
const sweepId = process.argv[3];
const extraArg = process.argv[4];
const extraArg2 = process.argv[5];

function usage(): void {
  process.stderr.write(
    "usage:\n" +
      "  video-eval prepare <sweep-id> <variant-module> <variant-export> [--architecture baseline|region-exclusive|templates]\n" +
      "  video-eval ingest-candidates <sweep-id>\n" +
      "  video-eval compose <sweep-id>\n" +
      "  video-eval capture-frames <sweep-id>\n" +
      "  video-eval render-critic <sweep-id>\n" +
      "  video-eval ingest-critiques <sweep-id>\n" +
      "  video-eval aggregate <sweep-id>\n" +
      "  video-eval decide <sweep-id>\n" +
      "  video-eval render-mp4 <sweep-id>\n" +
      "  video-eval capture-mp4-frames <sweep-id>\n",
  );
}

function parseArchitectureFlag(argv: string[]): ArchitectureMode {
  const idx = argv.indexOf("--architecture");
  if (idx === -1 || !argv[idx + 1]) {
    return "baseline";
  }
  const value = argv[idx + 1] as ArchitectureMode;
  if (!["baseline", "region-exclusive", "templates"].includes(value)) {
    throw new Error(`invalid --architecture: ${value}`);
  }
  return value;
}

async function loadManifest(sweepId: string): Promise<VideoSweepManifest> {
  const path = join(videoSweepDir(sweepId), "manifest.json");
  if (!existsSync(path)) {
    throw new Error(`manifest not found: ${path} (run prepare first)`);
  }
  return parseVideoSweepManifest(JSON.parse(await readFile(path, "utf8")));
}

function compositionOptions(manifest: VideoSweepManifest): WhiteboardCompositionOptions {
  return { architecture: manifest.architecture };
}

async function phasePrepare(): Promise<void> {
  if (!sweepId || !extraArg || !extraArg2) {
    usage();
    process.exit(1);
  }
  const architecture = parseArchitectureFlag(process.argv.slice(4));
  const absolute = resolve(process.cwd(), extraArg);
  const imported = (await import(absolute)) as Record<string, unknown>;
  const variant = imported[extraArg2] as PromptVariant | undefined;
  if (!variant?.systemPrompt) {
    process.stderr.write(`invalid variant export ${extraArg2} in ${extraArg}\n`);
    process.exit(1);
  }

  const manifest: VideoSweepManifest = {
    sweepId,
    promptVariantId: variant.id,
    architecture,
    frameMode: "timeline",
    frameTimestampsSec: [...DEFAULT_FRAME_TIMESTAMPS_SEC],
    createdAt: new Date().toISOString(),
  };
  await writeVideoManifest(sweepId, manifest);
  const layout = await ensureVideoSweepLayout(sweepId);

  for (const subjectId of ITERATION_SUBJECT_IDS) {
    const subject = getSubject(subjectId);
    const prompt = buildGeneratorPrompt(subject, variant);
    const body = `${prompt.systemPrompt}\n\n---\n\n${prompt.userPrompt}\n\nReturn ONLY the JSON object.\n`;
    const path = join(layout.prompts, `${subjectId}.prompt.txt`);
    await writeFile(path, body, "utf8");
    process.stdout.write(`wrote ${path}\n`);
  }
}

async function phaseIngestCandidates(): Promise<void> {
  if (!sweepId) {
    usage();
    process.exit(1);
  }
  const layout = await ensureVideoSweepLayout(sweepId);
  const entries = await readdir(layout.raw, { withFileTypes: true });
  const rawFiles = entries.filter((e) => e.isFile() && e.name.endsWith(".txt"));
  let ok = 0;
  let fail = 0;
  for (const file of rawFiles) {
    const subjectId = file.name.replace(/\.txt$/, "");
    const subject = getSubject(subjectId);
    const raw = await readFile(join(layout.raw, `${subjectId}.txt`), "utf8");
    const outcome = await ingestVideoCandidateOutput(sweepId, subject, raw);
    if (outcome.kind === "ok") {
      ok += 1;
      process.stdout.write(`OK   ${subjectId}\n`);
    } else {
      fail += 1;
      process.stdout.write(`FAIL ${subjectId}: ${outcome.reason}\n`);
    }
  }
  process.stdout.write(`ingested ${ok} ok, ${fail} failed\n`);
  process.exit(fail === 0 ? 0 : 1);
}

async function phaseCompose(): Promise<void> {
  if (!sweepId) {
    usage();
    process.exit(1);
  }
  const manifest = await loadManifest(sweepId);
  const layout = await ensureVideoSweepLayout(sweepId);
  const entries = await readdir(layout.candidates, { withFileTypes: true });
  const opts = compositionOptions(manifest);

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) {
      continue;
    }
    const subjectId = entry.name.replace(/\.json$/, "");
    const lesson = parseLectureLesson(
      JSON.parse(await readFile(join(layout.candidates, entry.name), "utf8")),
    );
    const subject = getSubject(subjectId);
    const dir = jobDir(sweepId, subjectId);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "lesson.json"), `${JSON.stringify(lesson, null, 2)}\n`, "utf8");
    await writeFile(
      join(dir, "index.html"),
      generateWhiteboardHtml(lesson, subject.question, opts),
      "utf8",
    );
    process.stdout.write(`composed ${dir}/index.html\n`);
  }
}

async function phaseCaptureFrames(): Promise<void> {
  if (!sweepId) {
    usage();
    process.exit(1);
  }
  const manifest = await loadManifest(sweepId);
  const layout = await ensureVideoSweepLayout(sweepId);
  const jobEntries = await readdir(layout.jobs, { withFileTypes: true });

  for (const entry of jobEntries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const subjectId = entry.name;
    const htmlPath = join(layout.jobs, subjectId, "index.html");
    if (!existsSync(htmlPath)) {
      process.stderr.write(`skip ${subjectId}: no index.html\n`);
      continue;
    }
    const out = framesDir(sweepId, subjectId);
    await captureTimelineFrames({
      htmlPath,
      timestampsSec: manifest.frameTimestampsSec,
      outDir: out,
    });
    process.stdout.write(`captured ${manifest.frameTimestampsSec.length} frames -> ${out}\n`);
  }
}

async function phaseRenderCritic(): Promise<void> {
  if (!sweepId) {
    usage();
    process.exit(1);
  }
  const manifest = await loadManifest(sweepId);
  const layout = await ensureVideoSweepLayout(sweepId);
  const entries = await readdir(layout.candidates, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) {
      continue;
    }
    const subjectId = entry.name.replace(/\.json$/, "");
    const subject = getSubject(subjectId);
    const lesson = parseLectureLesson(
      JSON.parse(await readFile(join(layout.candidates, entry.name), "utf8")),
    );
    const frameRefs = manifest.frameTimestampsSec.map((timestampSec) => {
      const label = `t${String(timestampSec).padStart(2, "0")}`;
      return {
        timestampSec,
        label,
        absolutePath: join(framesDir(sweepId, subjectId), `${label}.png`),
      };
    });
    const { systemPrompt, userPrompt } = buildVisualCriticPrompt(subject, lesson, frameRefs, {
      architecture: manifest.architecture,
      frameMode: manifest.frameMode,
      timestampsSec: manifest.frameTimestampsSec,
    });
    const body =
      `${systemPrompt}\n\n---\n\n${userPrompt}\n\n` +
      `Attach the PNG files listed above when running this review in Cursor.\n` +
      `Return ONLY the JSON object. No markdown fences.\n`;
    const path = join(layout.visualCriticPrompts, `${subjectId}.critic.txt`);
    await writeFile(path, body, "utf8");
    process.stdout.write(`wrote ${path}\n`);
  }
}

async function phaseIngestCritiques(): Promise<void> {
  if (!sweepId) {
    usage();
    process.exit(1);
  }
  const layout = await ensureVideoSweepLayout(sweepId);
  const entries = await readdir(layout.critiques, { withFileTypes: true });
  const rawFiles = entries.filter((e) => e.isFile() && e.name.endsWith(".raw.txt"));
  let ok = 0;
  let fail = 0;
  for (const file of rawFiles) {
    const subjectId = file.name.replace(/\.raw\.txt$/, "");
    const subject = getSubject(subjectId);
    const raw = await readFile(join(layout.critiques, file.name), "utf8");
    const outcome = await ingestVisualCritiqueOutput(sweepId, subject, raw);
    if (outcome.kind === "ok") {
      ok += 1;
      process.stdout.write(`OK   ${subjectId}  ${outcome.percent}%\n`);
    } else {
      fail += 1;
      process.stdout.write(`FAIL ${subjectId}: ${outcome.reason}\n`);
    }
  }
  process.stdout.write(`ingested ${ok} ok, ${fail} failed\n`);
  process.exit(fail === 0 ? 0 : 1);
}

async function phaseAggregate(): Promise<void> {
  if (!sweepId) {
    usage();
    process.exit(1);
  }
  const reports = await loadVisualCritiquesForSweep(sweepId);
  if (reports.length === 0) {
    process.stderr.write(`no critiques for ${sweepId}\n`);
    process.exit(1);
  }
  const summary = summarizeVisualSweep(sweepId, reports);
  const paths = await writeVisualSummary(sweepId, summary);
  process.stdout.write(`wrote ${paths.json}\n${paths.text}\n`);
  process.stdout.write(await readFile(paths.text, "utf8"));
}

async function phaseDecide(): Promise<void> {
  if (!sweepId) {
    usage();
    process.exit(1);
  }
  const summaryPath = join(videoSweepDir(sweepId), "summary.json");
  const newSummary = JSON.parse(await readFile(summaryPath, "utf8")) as {
    sweepId: string;
    promptVariantIds: string[];
    architectures: string[];
    mean: number;
    min: number;
    perSubject: Array<{ subjectId: string; percent: number }>;
    perCriterion: Array<{ id: string; meanPercent: number }>;
  };

  type VideoChampion = {
    sweepId: string;
    variantId: string;
    architecture: string;
    mean: number;
    min: number;
    perSubject: Array<{ subjectId: string; percent: number }>;
    perCriterion: Array<{ id: string; meanPercent: number }>;
  };

  const championPath = videoChampionPath();
  let champion: VideoChampion | null = null;
  if (existsSync(championPath)) {
    champion = JSON.parse(await readFile(championPath, "utf8")) as VideoChampion;
  }

  const lines: string[] = [];
  lines.push(`Video sweep: ${newSummary.sweepId}`);
  lines.push(`Variant: ${newSummary.promptVariantIds.join(", ")}`);
  lines.push(`Architecture: ${newSummary.architectures.join(", ")}`);
  lines.push(`Mean: ${newSummary.mean}%  Min: ${newSummary.min}%`);

  let accept = false;
  let reason = "";
  if (!champion) {
    accept = true;
    reason = "no prior video champion";
  } else {
    lines.push(`Champion: ${champion.sweepId} (${champion.variantId}, ${champion.architecture})`);
    lines.push(`  mean=${champion.mean}% min=${champion.min}%`);
    const meanDelta = newSummary.mean - champion.mean;
    const regressions = newSummary.perSubject.filter((s) => {
      const old = champion!.perSubject.find((x) => x.subjectId === s.subjectId);
      return old && s.percent < old.percent - 3;
    });
    if (meanDelta >= 0.5 && regressions.length === 0) {
      accept = true;
      reason = "mean +0.5pp and no subject regression >3pp";
    } else {
      reason = regressions.length > 0 ? "subject regressions" : "mean delta below bar";
    }
  }

  const overlapCriterion = newSummary.perCriterion.find((c) => c.id === "text-overlap");
  lines.push(`text-overlap mean: ${overlapCriterion?.meanPercent ?? "n/a"}%`);
  lines.push(`Decision: ${accept ? "ACCEPT" : "REJECT"} — ${reason}`);

  const out = lines.join("\n") + "\n";
  process.stdout.write(out);
  await writeFile(join(videoSweepDir(sweepId), "decision.txt"), out, "utf8");

  if (accept) {
    const next: VideoChampion = {
      sweepId: newSummary.sweepId,
      variantId: newSummary.promptVariantIds[0] ?? "unknown",
      architecture: newSummary.architectures[0] ?? "baseline",
      mean: newSummary.mean,
      min: newSummary.min,
      perSubject: newSummary.perSubject.map((s) => ({
        subjectId: s.subjectId,
        percent: s.percent,
      })),
      perCriterion: newSummary.perCriterion.map((c) => ({
        id: c.id,
        meanPercent: c.meanPercent,
      })),
    };
    await writeFile(championPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
    process.stdout.write(`updated ${championPath}\n`);
  }
}

async function phaseRenderMp4(): Promise<void> {
  if (!sweepId) {
    usage();
    process.exit(1);
  }
  const manifest = await loadManifest(sweepId);
  const layout = await ensureVideoSweepLayout(sweepId);
  const mp4Dir = join(layout.root, "renders");
  await mkdir(mp4Dir, { recursive: true });
  const entries = await readdir(layout.candidates, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) {
      continue;
    }
    const subjectId = entry.name.replace(/\.json$/, "");
    const lesson = parseLectureLesson(
      JSON.parse(await readFile(join(layout.candidates, entry.name), "utf8")),
    );
    const subject = getSubject(subjectId);
    const jobRoot = join(layout.jobs, subjectId);
    await mkdir(jobRoot, { recursive: true });
    const opts = compositionOptions(manifest);
    await writeFile(
      join(jobRoot, "index.html"),
      generateWhiteboardHtml(lesson, subject.question, opts),
      "utf8",
    );
    const result = await renderLesson(lesson, subject.question, {
      jobId: subjectId,
      generatedRoot: layout.jobs,
      rendersRoot: mp4Dir,
    });
    process.stdout.write(`rendered ${result.outputPath}\n`);
  }

  const updated: VideoSweepManifest = { ...manifest, frameMode: "mp4" as FrameMode };
  await writeVideoManifest(sweepId, updated);
}

async function phaseCaptureMp4Frames(): Promise<void> {
  if (!sweepId) {
    usage();
    process.exit(1);
  }
  const manifest = await loadManifest(sweepId);
  const layout = await ensureVideoSweepLayout(sweepId);
  const mp4Dir = join(layout.root, "renders");

  for (const subjectId of ITERATION_SUBJECT_IDS) {
    const mp4Path = join(mp4Dir, `${subjectId}.mp4`);
    if (!existsSync(mp4Path)) {
      process.stderr.write(`skip ${subjectId}: missing ${mp4Path}\n`);
      continue;
    }
    const out = framesDir(sweepId, subjectId);
    await captureMp4Frames({
      mp4Path,
      timestampsSec: manifest.frameTimestampsSec,
      outDir: out,
    });
    process.stdout.write(`ffmpeg frames -> ${out}\n`);
  }
}

if (!phase) {
  usage();
  process.exit(1);
}

switch (phase) {
  case "prepare":
    await phasePrepare();
    break;
  case "ingest-candidates":
    await phaseIngestCandidates();
    break;
  case "compose":
    await phaseCompose();
    break;
  case "capture-frames":
    await phaseCaptureFrames();
    break;
  case "render-critic":
    await phaseRenderCritic();
    break;
  case "ingest-critiques":
    await phaseIngestCritiques();
    break;
  case "aggregate":
    await phaseAggregate();
    break;
  case "decide":
    await phaseDecide();
    break;
  case "render-mp4":
    await phaseRenderMp4();
    break;
  case "capture-mp4-frames":
    await phaseCaptureMp4Frames();
    break;
  default:
    process.stderr.write(`unknown phase: ${phase}\n`);
    usage();
    process.exit(1);
}
