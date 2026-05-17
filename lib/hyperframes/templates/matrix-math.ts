import { matrixToLatex, renderKatexHtml } from "../primitives/katex.ts";
import { escapeHtml } from "../util.ts";
import { renderMatrixGridHtml } from "./matrix-grid.ts";

export type MatrixMathParams = {
  matrix: string[][];
  brackets?: "()" | "[]";
  title?: string;
  caption?: string;
  scale?: "md" | "lg" | "xl";
  highlightRows?: number[];
  highlightCols?: number[];
  highlightColor?: "green" | "blue";
};

function usesHtmlGrid(params: MatrixMathParams): boolean {
  return (
    (params.highlightRows?.length ?? 0) > 0 ||
    (params.highlightCols?.length ?? 0) > 0 ||
    params.scale === "lg" ||
    params.scale === "xl" ||
    params.matrix.length > 6 ||
    (params.matrix[0]?.length ?? 0) > 6
  );
}

export function renderMatrixMathHtml(params: MatrixMathParams): string {
  const rows = params.matrix.slice(0, 16).map((row) => row.slice(0, 16));
  const title = params.title ? `<div class="matrix-title">${escapeHtml(params.title)}</div>` : "";
  const caption = params.caption
    ? `<p class="matrix-caption">${escapeHtml(params.caption)}</p>`
    : "";

  if (usesHtmlGrid(params)) {
    return renderMatrixGridHtml({
      rows,
      title: params.title,
      caption: params.caption,
      scale: params.scale ?? "lg",
      highlightRows: params.highlightRows,
      highlightCols: params.highlightCols,
      highlightColor: params.highlightColor,
      className: "matrix-math matrix-math-grid",
    });
  }

  const latex = matrixToLatex(rows, params.brackets ?? "()");
  const math = renderKatexHtml(latex, "block");
  const scale = params.scale ?? "md";
  return `<div class="template-diagram matrix-math matrix-scale-${scale}">${title}<div class="katex-block">${math}</div>${caption}</div>`;
}
