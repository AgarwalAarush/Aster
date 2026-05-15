import type { Storyboard } from "../education/schema";
import { renderLiquidGlassTheme } from "./theme";
import { renderTimelineScript } from "./timeline";
import { escapeHtml, renderDiagramSvg } from "./svg-primitives";

const WIDTH = 1920;
const HEIGHT = 1080;
const COMPOSITION_ID = "aster-lesson";

export function generateCompositionHtml(storyboard: Storyboard, question: string): string {
  const sceneDuration = storyboard.lesson.durationSeconds / storyboard.scenes.length;
  const sceneClips = storyboard.scenes
    .map((scene, index) => {
      const start = roundTime(index * sceneDuration);
      const duration = roundTime(sceneDuration);
      const sceneNumber = index + 1;

      return `
        <section class="clip scene scene-${sceneNumber}" data-start="${start}" data-duration="${duration}" data-track-index="${index}">
          <article class="liquid-glass">
            <p class="scene-index">Scene ${sceneNumber}</p>
            <h2>${escapeHtml(scene.title)}</h2>
            <p class="scene-copy">${escapeHtml(scene.narration)}</p>
            <div class="key-line">${escapeHtml(scene.onScreenText)}</div>
          </article>
          <div class="diagram-stage">
            ${renderDiagramSvg(scene, sceneNumber)}
          </div>
        </section>`;
    })
    .join("\n");

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(storyboard.lesson.title)}</title>
    <style>
      ${renderLiquidGlassTheme()}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="${COMPOSITION_ID}" data-start="0" data-width="${WIDTH}" data-height="${HEIGHT}">
      <div class="ambient-blob blob-one"></div>
      <div class="ambient-blob blob-two"></div>
      <div class="grain"></div>
      <p class="question">Question: ${escapeHtml(question)}</p>
      <h1 class="lesson-title">${escapeHtml(storyboard.lesson.title)}</h1>
      ${sceneClips}
    </div>
    ${renderTimelineScript(storyboard)}
  </body>
</html>`;
}

function roundTime(value: number): number {
  return Math.round(value * 100) / 100;
}
