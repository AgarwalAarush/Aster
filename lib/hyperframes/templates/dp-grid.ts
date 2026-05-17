import { escapeHtml } from "../util.ts";

export type DpGridParams = {
  rows: number;
  cols: number;
  cells?: Array<{ r: number; c: number; text: string; highlight?: boolean }>;
};

export function renderDpGridHtml(params: DpGridParams): string {
  const rows = Math.min(Math.max(params.rows, 1), 10);
  const cols = Math.min(Math.max(params.cols, 1), 12);
  const cellMap = new Map<string, { text: string; highlight?: boolean }>();
  for (const cell of params.cells ?? []) {
    if (cell.r < rows && cell.c < cols) {
      cellMap.set(`${cell.r},${cell.c}`, { text: cell.text, highlight: cell.highlight });
    }
  }

  const body = Array.from({ length: rows }, (_, r) => {
    const tds = Array.from({ length: cols }, (_, c) => {
      const data = cellMap.get(`${r},${c}`);
      const cls = data?.highlight ? ' class="dp-highlight"' : "";
      return `<td${cls}>${escapeHtml(data?.text ?? "")}</td>`;
    }).join("");
    return `<tr>${tds}</tr>`;
  }).join("");

  return `<div class="template-diagram dp-grid"><table class="dp-table"><tbody>${body}</tbody></table></div>`;
}
