import { escapeHtml } from "../util.ts";

export type MatrixBlockParams = {
  title?: string;
  rows: string[][];
};

export function renderMatrixBlockHtml(params: MatrixBlockParams): string {
  const rows = params.rows.slice(0, 8).map((row) => row.slice(0, 6));
  const title = params.title
    ? `<div class="matrix-title">${escapeHtml(params.title)}</div>`
    : "";
  const body = rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`,
    )
    .join("");

  return `<div class="template-diagram matrix-block">${title}<table class="matrix-table"><tbody>${body}</tbody></table></div>`;
}
