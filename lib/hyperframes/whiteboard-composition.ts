import type { BoardAction, LectureLesson, NarrationBeat, WriteStyle } from "../education/loop/schema.ts";
import {
  DEFAULT_COMPOSITION_OPTIONS,
  type WhiteboardCompositionOptions,
} from "./composition-options.ts";
import { resolveBoardLayout, renderLayoutChrome } from "./layouts/index.ts";
import { renderKatexHtml, renderKatexStylesheetLink } from "./primitives/katex.ts";
import { regionToCssInline, type RegionContext } from "./regions.ts";
import { renderDrawInnerHtml } from "./templates/registry.ts";
import { renderWhiteboardTheme } from "./whiteboard-theme.ts";
import { renderWhiteboardTimeline } from "./whiteboard-timeline.ts";
import { escapeHtml, escapeHtmlAttr, roundTime } from "./util.ts";

const WIDTH = 1920;
const HEIGHT = 1080;
const COMPOSITION_ID = "aster-lesson";

export function generateWhiteboardHtml(
  lesson: LectureLesson,
  question: string,
  options: WhiteboardCompositionOptions = DEFAULT_COMPOSITION_OPTIONS,
): string {
  const architecture = options.architecture ?? "baseline";
  const galleryMode = options.galleryMode ?? false;
  const layout = resolveBoardLayout(lesson);
  const regionCtx: RegionContext = { layout };
  const layoutChrome = renderLayoutChrome(layout);
  const writeStyles = buildWriteStyleMap(lesson.board.actions);
  const boardItems = lesson.board.actions
    .map((action, index) => renderBoardItem(action, index, regionCtx, writeStyles))
    .join("\n        ");
  const beats = lesson.narration.beats.map(renderBeat).join("\n        ");
  const codeDeck = renderCodeDeck(lesson);
  const galleryCss = galleryMode
    ? `
      .board-item, .beat, .code-block { opacity: 1 !important; transform: none !important; }
      .board-item.kind-write { transform: translateY(0) !important; }
      .board-item.kind-draw { transform: scale(1) !important; }
    `
    : "";

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(lesson.lesson.title)}</title>
    ${renderKatexStylesheetLink()}
    <style>
      ${renderWhiteboardTheme()}
      .template-diagram { width: 100%; height: 100%; }
      .template-diagram svg { width: 100%; height: 100%; display: block; }
      .matrix-table, .dp-table { border-collapse: collapse; font-size: 18px; }
      .matrix-table td, .dp-table td { border: 1px solid #1a1a1a; padding: 8px 12px; min-width: 36px; text-align: center; }
      .dp-table td.dp-highlight { background: var(--highlight); }
      .matrix-title { font-weight: 600; margin-bottom: 8px; }
      .matrix-multiply-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
      .katex-block { font-size: 22px; }
      ${galleryCss}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="${COMPOSITION_ID}" data-start="0" data-width="${WIDTH}" data-height="${HEIGHT}" data-architecture="${escapeHtmlAttr(architecture)}"${galleryMode ? ' data-gallery-mode="true"' : ""}>
      <header class="lesson-header">
        <p class="question">Question: ${escapeHtml(question)}</p>
        <h1 class="lesson-title">${escapeHtml(lesson.lesson.title)}</h1>
      </header>
      <section class="board" id="board" data-layout="${escapeHtmlAttr(layout.id)}">
        ${layoutChrome}
        ${boardItems}
      </section>
      ${codeDeck}
      <section class="narration-strip" id="narration-strip">
        ${beats}
      </section>
    </div>
    ${galleryMode ? "" : renderWhiteboardTimeline(lesson, options)}
  </body>
</html>`;
}

function buildWriteStyleMap(actions: BoardAction[]): Map<string, WriteStyle> {
  const map = new Map<string, WriteStyle>();
  for (const action of actions) {
    if (action.kind === "write") {
      map.set(action.targetId, action.writeStyle ?? "body");
    }
  }
  return map;
}

function renderBoardItem(
  action: BoardAction,
  index: number,
  regionCtx: RegionContext,
  writeStyles: Map<string, WriteStyle>,
): string {
  const at = roundTime(action.at);
  const region = regionToCssInline(action.region, regionCtx);
  const regionKey = escapeHtmlAttr(action.region ?? "center");
  const common = `class="board-item kind-${action.kind}" data-action-id="${escapeHtmlAttr(action.targetId)}" data-action-index="${index}" data-at="${at}" data-region="${regionKey}" style="${region}"`;

  switch (action.kind) {
    case "write":
      return `<div ${common}>${renderWriteInnerHtml(action)}</div>`;
    case "draw":
      return `<div ${common}><div class="draw-content">${renderDrawInnerHtml(action)}</div></div>`;
    case "highlight":
      return `<div ${common}><div class="highlight-overlay"></div></div>`;
    case "transform": {
      const targetStyle = writeStyles.get(action.targetId);
      if (targetStyle === "equation") {
        const html = renderKatexHtml(action.content, "block");
        return `<div ${common} data-transform-html="${escapeHtmlAttr(html)}"></div>`;
      }
      return `<div ${common} data-transform-to="${escapeHtmlAttr(action.content)}"></div>`;
    }
    case "erase":
      return `<div ${common} data-erase-target="${escapeHtmlAttr(action.targetId)}"></div>`;
  }
}

function renderWriteInnerHtml(action: BoardAction): string {
  const style = action.writeStyle ?? "body";
  if (style === "header") {
    return `<div class="write-content write-header">${escapeHtml(action.content)}</div>`;
  }
  if (style === "equation") {
    return `<div class="write-content write-equation">${renderKatexHtml(action.content, "block")}</div>`;
  }
  return `<div class="write-content">${escapeHtml(action.content)}</div>`;
}

function renderBeat(beat: NarrationBeat, index: number): string {
  const at = roundTime(beat.atSec);
  return `<p class="beat" data-beat-index="${index}" data-at="${at}">${escapeHtml(beat.text)}</p>`;
}

function renderCodeDeck(lesson: LectureLesson): string {
  const blocks = lesson.codeBlocks ?? [];
  if (blocks.length === 0) {
    return "";
  }
  const items = blocks
    .map((block, index) => {
      const at = roundTime(block.atSec);
      return `<pre class="code-block" data-block-index="${index}" data-at="${at}" data-lang="${escapeHtmlAttr(block.language)}">${escapeHtml(block.code)}</pre>`;
    })
    .join("\n        ");
  return `<section class="code-deck" id="code-deck">\n        ${items}\n      </section>`;
}
