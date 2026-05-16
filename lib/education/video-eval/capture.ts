import { mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { COMPOSITION_ID } from "./constants.ts";

export type CaptureFrameResult = {
  timestampSec: number;
  absolutePath: string;
  label: string;
};

export type CaptureTimelineFramesOptions = {
  htmlPath: string;
  timestampsSec: readonly number[];
  outDir: string;
  /** Screenshot selector; default full #root composition */
  selector?: string;
  viewport?: { width: number; height: number };
};

function frameLabel(timestampSec: number): string {
  const padded = String(timestampSec).padStart(2, "0");
  return `t${padded}`;
}

/**
 * Seeks the GSAP timeline in index.html and writes one PNG per timestamp.
 * Requires playwright (devDependency) and `npx playwright install chromium`.
 */
export async function captureTimelineFrames(
  options: CaptureTimelineFramesOptions,
): Promise<CaptureFrameResult[]> {
  const { chromium } = await import("playwright");
  const htmlPath = resolve(options.htmlPath);
  const outDir = resolve(options.outDir);
  await mkdir(outDir, { recursive: true });

  const selector = options.selector ?? "#root";
  const viewport = options.viewport ?? { width: 1920, height: 1080 };
  const fileUrl = pathToFileURL(htmlPath).href;

  const browser = await chromium.launch({ headless: true });
  const results: CaptureFrameResult[] = [];

  try {
    const page = await browser.newPage({ viewport });
    await page.goto(fileUrl, { waitUntil: "networkidle" });

    await page.waitForFunction(
      () => {
        const timelines = (window as unknown as { __timelines?: Record<string, { time: (t: number) => void }> })
          .__timelines;
        return timelines && timelines["aster-lesson"];
      },
      { timeout: 15000 },
    );

    for (const timestampSec of options.timestampsSec) {
      await page.evaluate(
        ({ compositionId, t }) => {
          const timelines = (window as unknown as {
            __timelines?: Record<string, { time: (n: number) => void }>;
          }).__timelines;
          const tl = timelines?.[compositionId];
          if (!tl) {
            throw new Error(`Timeline not found: ${compositionId}`);
          }
          tl.time(t);
        },
        { compositionId: COMPOSITION_ID, t: timestampSec },
      );

      await page.waitForTimeout(150);

      const label = frameLabel(timestampSec);
      const absolutePath = join(outDir, `${label}.png`);
      const element = await page.$(selector);
      if (element) {
        await element.screenshot({ path: absolutePath });
      } else {
        await page.screenshot({ path: absolutePath, fullPage: false });
      }

      results.push({ timestampSec, absolutePath, label });
    }
  } finally {
    await browser.close();
  }

  return results;
}

export type CaptureMp4FramesOptions = {
  mp4Path: string;
  timestampsSec: readonly number[];
  outDir: string;
  ffmpegCommand?: string;
};

/**
 * Extracts frames from an MP4 using ffmpeg (-ss seek, single frame).
 */
export async function captureMp4Frames(
  options: CaptureMp4FramesOptions,
): Promise<CaptureFrameResult[]> {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const execFileAsync = promisify(execFile);

  const mp4Path = resolve(options.mp4Path);
  const outDir = resolve(options.outDir);
  await mkdir(outDir, { recursive: true });
  const ffmpeg = options.ffmpegCommand ?? "ffmpeg";

  const results: CaptureFrameResult[] = [];

  for (const timestampSec of options.timestampsSec) {
    const label = frameLabel(timestampSec);
    const absolutePath = join(outDir, `${label}.png`);
    await execFileAsync(
      ffmpeg,
      ["-y", "-ss", String(timestampSec), "-i", mp4Path, "-frames:v", "1", absolutePath],
      { maxBuffer: 16 * 1024 * 1024 },
    );
    results.push({ timestampSec, absolutePath, label });
  }

  return results;
}

export async function ensureParentDir(filePath: string): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
}
