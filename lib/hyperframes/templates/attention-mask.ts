import {
  buildSlidingWindowMask,
  renderMatrixGridHtml,
  slidingWindowCellIntensities,
} from "./matrix-grid.ts";

export type AttentionMaskParams = {
  /** Grid side length (4–48). */
  size: number;
  /** Half-width of sliding window along diagonal (|i−j| ≤ windowRadius). */
  windowRadius?: number;
  title?: string;
  caption?: string;
  highlightColor?: "green" | "blue";
};

export function renderAttentionMaskHtml(params: AttentionMaskParams): string {
  const size = Math.min(Math.max(Math.round(params.size), 4), 48);
  const windowRadius = params.windowRadius ?? Math.max(2, Math.floor(size / 10));
  const rows = buildSlidingWindowMask(size, windowRadius);
  const cellIntensity = slidingWindowCellIntensities(size, windowRadius);

  return renderMatrixGridHtml({
    rows,
    title: params.title ?? "Sliding window attention",
    caption: params.caption ?? `(b) Sliding window attention — window radius ${windowRadius}`,
    scale: size > 24 ? "xl" : size > 14 ? "lg" : "md",
    cellIntensity,
    highlightColor: params.highlightColor ?? "green",
    showEmptyCells: true,
    className: "attention-mask",
  });
}
