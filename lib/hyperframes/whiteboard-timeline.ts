import type { BoardAction, LectureLesson } from "../education/loop/schema.ts";
import {
  DEFAULT_COMPOSITION_OPTIONS,
  type WhiteboardCompositionOptions,
} from "./composition-options.ts";
import { roundTime } from "./util.ts";

export function renderWhiteboardTimeline(
  lesson: LectureLesson,
  options: WhiteboardCompositionOptions = DEFAULT_COMPOSITION_OPTIONS,
): string {
  const duration = lesson.lesson.durationSeconds;
  const regionExclusive = options.architecture === "region-exclusive";
  const actionOps = lesson.board.actions
    .map((action, index) => renderActionOp(action, index, regionExclusive))
    .join("\n        ");
  const beatOps = lesson.narration.beats
    .map((beat, index) => renderBeatOp(beat.atSec, index))
    .join("\n        ");
  const codeOps = (lesson.codeBlocks ?? [])
    .map((block, index) => renderCodeOp(block.atSec, index))
    .join("\n        ");

  return `
    <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
    <script>
      function positionHighlight(overlaySel, targetSel) {
        var overlay = document.querySelector(overlaySel);
        var target = document.querySelector(targetSel + ':not(.kind-highlight):not(.kind-transform):not(.kind-erase)');
        if (!overlay || !target) return;
        var board = document.querySelector('.board');
        if (!board) return;
        var boardRect = board.getBoundingClientRect();
        var rect = target.getBoundingClientRect();
        overlay.style.top = (rect.top - boardRect.top - 6) + 'px';
        overlay.style.left = (rect.left - boardRect.left - 6) + 'px';
        overlay.style.width = (rect.width + 12) + 'px';
        overlay.style.height = (rect.height + 12) + 'px';
      }

      function transformTarget(targetSel, newContent) {
        var elements = document.querySelectorAll(targetSel + ':not(.kind-highlight):not(.kind-transform):not(.kind-erase)');
        var target = elements.length > 0 ? elements[elements.length - 1] : null;
        if (!target) return;
        var inner = target.querySelector('.write-content, .draw-description');
        if (inner) {
          inner.textContent = newContent;
        } else {
          target.textContent = newContent;
        }
      }

      const tl = gsap.timeline({ paused: true });
      tl.from('.lesson-header', { opacity: 0, y: -16, duration: 0.5, ease: 'power2.out' }, 0);
        ${actionOps}
        ${beatOps}
        ${codeOps}
      tl.set({}, {}, ${duration});
      window.__timelines = window.__timelines || {};
      window.__timelines["aster-lesson"] = tl;
    </script>
  `;
}

function regionExclusiveHideOp(region: string | undefined, at: number): string {
  const regionKey = (region ?? "center").replace(/"/g, '\\"');
  return `tl.to('.board-item[data-region="${regionKey}"]:not(.kind-highlight):not(.kind-transform):not(.kind-erase)', { opacity: 0, duration: 0.15 }, ${at});`;
}

function renderActionOp(
  action: BoardAction,
  index: number,
  regionExclusive: boolean,
): string {
  const at = roundTime(action.at);
  const actionSel = `[data-action-index="${index}"]`;
  const hideSameRegion =
    regionExclusive && (action.kind === "write" || action.kind === "draw")
      ? `${regionExclusiveHideOp(action.region, at)}\n        `
      : "";

  switch (action.kind) {
    case "write":
      return `${hideSameRegion}tl.to('${actionSel}', { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, ${at});`;
    case "draw":
      return `${hideSameRegion}tl.to('${actionSel}', { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.4)' }, ${at});`;
    case "highlight": {
      const targetSel = `[data-action-id="${action.targetId}"]`;
      const off = roundTime(at + 2.5);
      return [
        `tl.call(function () { positionHighlight('${actionSel}', '${targetSel}'); }, [], ${at});`,
        `tl.to('${actionSel}', { opacity: 1, duration: 0.25 }, ${at});`,
        `tl.to('${actionSel}', { opacity: 0, duration: 0.4 }, ${off});`,
      ].join("\n        ");
    }
    case "transform": {
      const targetSel = `[data-action-id="${action.targetId}"]`;
      const literal = JSON.stringify(action.content);
      return [
        `tl.call(function () { transformTarget('${targetSel}', ${literal}); }, [], ${at});`,
        `tl.fromTo('${targetSel} > *', { backgroundColor: 'rgba(255,224,102,0.6)' }, { backgroundColor: 'transparent', duration: 0.6 }, ${at});`,
      ].join("\n        ");
    }
    case "erase": {
      if (action.targetId === "all") {
        return `tl.to('.board-item:not(.kind-highlight):not(.kind-transform):not(.kind-erase)', { opacity: 0, duration: 0.5 }, ${at});`;
      }
      return `tl.to('[data-action-id="${action.targetId}"]:not(.kind-transform):not(.kind-erase)', { opacity: 0, duration: 0.5 }, ${at});`;
    }
  }
}

function renderBeatOp(atSec: number, index: number): string {
  const at = roundTime(atSec);
  const reveal = `tl.to('[data-beat-index="${index}"]', { opacity: 1, duration: 0.3 }, ${at});`;
  if (index === 0) {
    return reveal;
  }
  const fadePrev = `tl.to('[data-beat-index="${index - 1}"]', { opacity: 0, duration: 0.3 }, ${at});`;
  return `${reveal}\n        ${fadePrev}`;
}

function renderCodeOp(atSec: number, index: number): string {
  const at = roundTime(atSec);
  return `tl.to('[data-block-index="${index}"]', { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' }, ${at});`;
}
