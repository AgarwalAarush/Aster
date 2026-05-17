import { escapeHtmlAttr } from "../util.ts";
import type { BoardLayout } from "./types.ts";

const PANE_INSET = "3%";

export function renderLayoutChrome(layout: BoardLayout): string {
  if (layout.id === "full") {
    return `<div class="board-layout-chrome layout-full" aria-hidden="true">
      <div class="layout-pane pane-full" style="top: ${PANE_INSET}; left: ${PANE_INSET}; width: calc(100% - 2 * ${PANE_INSET}); height: calc(100% - 2 * ${PANE_INSET});"></div>
    </div>`;
  }

  const ratio = layout.ratio ?? "50-50";
  const leftWidth = ratio === "33-67" ? "33.333%" : "50%";
  const rightLeft = ratio === "33-67" ? "33.333%" : "50%";
  const rightWidth = ratio === "33-67" ? "66.667%" : "50%";
  const divider =
    layout.divider === true
      ? `<div class="layout-divider" style="left: ${leftWidth}; top: ${PANE_INSET}; height: calc(100% - 2 * ${PANE_INSET});"></div>`
      : "";

  return `<div class="board-layout-chrome layout-split-vertical" data-ratio="${escapeHtmlAttr(ratio)}" aria-hidden="true">
      <div class="layout-pane pane-left" style="top: ${PANE_INSET}; left: ${PANE_INSET}; width: calc(${leftWidth} - ${PANE_INSET}); height: calc(100% - 2 * ${PANE_INSET});"></div>
      <div class="layout-pane pane-right" style="top: ${PANE_INSET}; left: ${rightLeft}; width: calc(${rightWidth} - ${PANE_INSET}); height: calc(100% - 2 * ${PANE_INSET});"></div>
      ${divider}
    </div>`;
}
