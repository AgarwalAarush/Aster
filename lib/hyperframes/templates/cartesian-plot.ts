import { escapeHtml } from "../util.ts";

export type CartesianPlotParams = {
  xLabel?: string;
  yLabel?: string;
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
  series: Array<{
    label?: string;
    points: Array<{ x: number; y: number }>;
    style?: "line" | "scatter";
  }>;
  annotations?: Array<{ x: number; y: number; text: string }>;
};

const W = 640;
const H = 400;
const PAD = 48;

function toX(x: number, xMin: number, xMax: number, plotW: number): number {
  if (xMax === xMin) {
    return PAD + plotW / 2;
  }
  return PAD + ((x - xMin) / (xMax - xMin)) * plotW;
}

function toY(y: number, yMin: number, yMax: number, plotH: number): number {
  if (yMax === yMin) {
    return PAD + plotH / 2;
  }
  return H - PAD - ((y - yMin) / (yMax - yMin)) * plotH;
}

export function renderCartesianPlotSvg(params: CartesianPlotParams): string {
  const allPoints = params.series.flatMap((s) => s.points);
  const xMin = params.xMin ?? Math.min(...allPoints.map((p) => p.x), 0);
  const xMax = params.xMax ?? Math.max(...allPoints.map((p) => p.x), 1);
  const yMin = params.yMin ?? Math.min(...allPoints.map((p) => p.y), 0);
  const yMax = params.yMax ?? Math.max(...allPoints.map((p) => p.y), 1);
  const plotW = W - PAD * 2;
  const plotH = H - PAD * 2;

  const axes = `
    <line x1="${PAD}" y1="${H - PAD}" x2="${W - PAD}" y2="${H - PAD}" stroke="#1a1a1a" stroke-width="2"/>
    <line x1="${PAD}" y1="${PAD}" x2="${PAD}" y2="${H - PAD}" stroke="#1a1a1a" stroke-width="2"/>
    ${params.xLabel ? `<text x="${W / 2}" y="${H - 12}" text-anchor="middle" font-size="14">${escapeHtml(params.xLabel)}</text>` : ""}
    ${params.yLabel ? `<text x="14" y="${H / 2}" text-anchor="middle" font-size="14" transform="rotate(-90 14 ${H / 2})">${escapeHtml(params.yLabel)}</text>` : ""}
  `;

  const seriesEls = params.series.slice(0, 4).map((series, i) => {
    const pts = series.points.slice(0, 64);
    if (pts.length === 0) {
      return "";
    }
    const color = ["#1a1a1a", "#2563eb", "#dc2626", "#16a34a"][i % 4];
    if (series.style === "scatter") {
      return pts
        .map((p) => `<circle cx="${toX(p.x, xMin, xMax, plotW)}" cy="${toY(p.y, yMin, yMax, plotH)}" r="5" fill="${color}" />`)
        .join("");
    }
    const path = pts
      .map((p, idx) => `${idx === 0 ? "M" : "L"} ${toX(p.x, xMin, xMax, plotW)} ${toY(p.y, yMin, yMax, plotH)}`)
      .join(" ");
    return `<path d="${path}" fill="none" stroke="${color}" stroke-width="2.5"/>`;
  });

  const annEls = (params.annotations ?? [])
    .slice(0, 8)
    .map(
      (a) =>
        `<text x="${toX(a.x, xMin, xMax, plotW)}" y="${toY(a.y, yMin, yMax, plotH) - 8}" font-size="13" fill="#444">${escapeHtml(a.text)}</text>`,
    )
    .join("");

  return `<svg class="template-diagram cartesian-plot" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    ${axes}
    ${seriesEls.join("\n")}
    ${annEls}
  </svg>`;
}
