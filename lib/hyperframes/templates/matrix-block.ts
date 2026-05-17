import { renderMatrixGridHtml, type MatrixGridOptions } from "./matrix-grid.ts";

export type MatrixBlockParams = {
  title?: string;
  caption?: string;
  rows: string[][];
  scale?: "md" | "lg" | "xl";
  highlightRows?: number[];
  highlightCols?: number[];
  highlightColor?: "green" | "blue";
};

export function renderMatrixBlockHtml(params: MatrixBlockParams): string {
  const rows = params.rows.slice(0, 16).map((row) => row.slice(0, 16));
  const opts: MatrixGridOptions = {
    rows,
    title: params.title,
    caption: params.caption,
    scale: params.scale ?? "lg",
    highlightRows: params.highlightRows,
    highlightCols: params.highlightCols,
    highlightColor: params.highlightColor,
    className: "matrix-block",
  };
  return renderMatrixGridHtml(opts);
}
