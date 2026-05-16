import type { BoardAction, LectureLesson, NarrationBeat } from "../education/loop/schema.ts";
import { regionToCssInline } from "./regions.ts";
import { renderWhiteboardTheme } from "./whiteboard-theme.ts";
import { renderWhiteboardTimeline } from "./whiteboard-timeline.ts";
import { escapeHtml, escapeHtmlAttr, roundTime } from "./util.ts";

const WIDTH = 1920;
const HEIGHT = 1080;
const COMPOSITION_ID = "aster-lesson";

export function generateWhiteboardHtml(lesson: LectureLesson, question: string): string {
  const boardItems = lesson.board.actions.map(renderBoardItem).join("\n        ");
  const beats = lesson.narration.beats.map(renderBeat).join("\n        ");
  const codeDeck = renderCodeDeck(lesson);

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(lesson.lesson.title)}</title>
    <style>
      ${renderWhiteboardTheme()}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="${COMPOSITION_ID}" data-start="0" data-width="${WIDTH}" data-height="${HEIGHT}">
      <header class="lesson-header">
        <p class="question">Question: ${escapeHtml(question)}</p>
        <h1 class="lesson-title">${escapeHtml(lesson.lesson.title)}</h1>
      </header>
      <section class="board" id="board">
        ${boardItems}
      </section>
      ${codeDeck}
      <section class="narration-strip" id="narration-strip">
        ${beats}
      </section>
    </div>
    ${renderWhiteboardTimeline(lesson)}
  </body>
</html>`;
}

function renderBoardItem(action: BoardAction, index: number): string {
  const at = roundTime(action.at);
  const region = regionToCssInline(action.region);
  const common = `class="board-item kind-${action.kind}" data-action-id="${escapeHtmlAttr(action.targetId)}" data-action-index="${index}" data-at="${at}" data-region="${escapeHtmlAttr(action.region ?? "center")}" style="${region}"`;

  switch (action.kind) {
    case "write":
      return `<div ${common}><div class="write-content">${escapeHtml(action.content)}</div></div>`;
    case "draw":
      return `<div ${common}><div class="draw-content"><span class="draw-tag">DIAGRAM</span><div class="draw-description">${escapeHtml(action.content)}</div></div></div>`;
    case "highlight":
      return `<div ${common}><div class="highlight-overlay"></div></div>`;
    case "transform":
      return `<div ${common} data-transform-to="${escapeHtmlAttr(action.content)}"></div>`;
    case "erase":
      return `<div ${common} data-erase-target="${escapeHtmlAttr(action.targetId)}"></div>`;
  }
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
