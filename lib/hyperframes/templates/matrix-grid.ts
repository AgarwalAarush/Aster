import { escapeHtml } from "../util.ts";

export type MatrixHighlightColor = "green" | "blue";

export type MatrixGridOptions = {
  rows: string[][];
  title?: string;
  caption?: string;
  scale?: "md" | "lg" | "xl";
  highlightRows?: number[];
  highlightCols?: number[];
  highlightColor?: MatrixHighlightColor;
  /** Per-cell intensity 0–1 (overrides row/col when set for that cell). */
  cellIntensity?: Array<{ r: number; c: number; intensity: number }>;
  /** When true, empty string cells still render as visible boxes (for masks). */
  showEmptyCells?: boolean;
  className?: string;
};

const COLOR_STOPS: Record<MatrixHighlightColor, { core: string; edge: string }> = {
  green: { core: "rgba(45, 106, 79, 0.92)", edge: "rgba(216, 243, 220, 0.55)" },
  blue: { core: "rgba(37, 99, 235, 0.88)", edge: "rgba(219, 234, 254, 0.5)" },
};

function intensityAt(
  r: number,
  c: number,
  opts: MatrixGridOptions,
): number {
  const cell = opts.cellIntensity?.find((x) => x.r === r && x.c === c);
  if (cell !== undefined) {
    return Math.max(0, Math.min(1, cell.intensity));
  }
  let intensity = 0;
  if (opts.highlightRows?.includes(r)) {
    intensity = Math.max(intensity, 0.75);
  }
  if (opts.highlightCols?.includes(c)) {
    intensity = Math.max(intensity, 0.75);
  }
  return intensity;
}

function mixHighlightColor(intensity: number, color: MatrixHighlightColor): string {
  if (intensity <= 0) {
    return "#ffffff";
  }
  const stops = COLOR_STOPS[color];
  const t = intensity;
  return `color-mix(in srgb, ${stops.edge} ${(1 - t) * 100}%, ${stops.core} ${t * 100}%)`;
}

export function renderMatrixGridHtml(opts: MatrixGridOptions): string {
  const rows = opts.rows;
  const rowCount = rows.length;
  const colCount = Math.max(...rows.map((row) => row.length), 1);
  const scale = opts.scale ?? "md";
  const color = opts.highlightColor ?? "green";
  const showEmpty = opts.showEmptyCells ?? false;

  const title = opts.title ? `<div class="matrix-title">${escapeHtml(opts.title)}</div>` : "";
  const caption = opts.caption
    ? `<p class="matrix-caption">${escapeHtml(opts.caption)}</p>`
    : "";

  const body = rows
    .map((row, r) => {
      const cells = Array.from({ length: colCount }, (_, c) => {
        const text = row[c] ?? "";
        const intensity = intensityAt(r, c, opts);
        const bg = mixHighlightColor(intensity, color);
        const display = text || (showEmpty ? "" : "\u00a0");
        if (!showEmpty && !text && intensity <= 0) {
          return `<td class="matrix-cell" style="background:${bg}"></td>`;
        }
        return `<td class="matrix-cell" style="background:${bg}">${escapeHtml(display)}</td>`;
      }).join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  const extraClass = opts.className ? ` ${opts.className}` : "";
  return `<div class="template-diagram matrix-grid${extraClass} matrix-scale-${scale}">
    ${title}
    <div class="matrix-grid-wrap">
      <table class="matrix-table matrix-grid-table"><tbody>${body}</tbody></table>
    </div>
    ${caption}
  </div>`;
}

/** Build a square mask grid for sliding-window attention (|i-j| <= radius). */
export function buildSlidingWindowMask(size: number, _windowRadius: number): string[][] {
  const n = Math.min(Math.max(size, 4), 48);
  return Array.from({ length: n }, () => Array.from({ length: n }, () => ""));
}

export function slidingWindowCellIntensities(
  size: number,
  windowRadius: number,
): Array<{ r: number; c: number; intensity: number }> {
  const cells: Array<{ r: number; c: number; intensity: number }> = [];
  const radius = Math.max(1, windowRadius);
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      const dist = Math.abs(r - c);
      if (dist <= radius) {
        const intensity = 1 - (dist / radius) * 0.85;
        cells.push({ r, c, intensity });
      }
    }
  }
  return cells;
}
