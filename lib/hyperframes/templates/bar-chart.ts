import { escapeHtml } from "../util.ts";

export type BarChartParams = {
  bars: Array<{ label: string; value: number }>;
  yLabel?: string;
};

const W = 560;
const H = 320;
const PAD = 48;

export function renderBarChartSvg(params: BarChartParams): string {
  const bars = params.bars.slice(0, 12);
  const maxVal = Math.max(...bars.map((b) => b.value), 1);
  const plotW = W - PAD * 2;
  const plotH = H - PAD * 2;
  const barW = Math.min(48, plotW / Math.max(bars.length, 1) - 8);
  const gap = (plotW - barW * bars.length) / Math.max(bars.length + 1, 1);

  const barEls = bars
    .map((bar, i) => {
      const h = (bar.value / maxVal) * plotH;
      const x = PAD + gap + i * (barW + gap);
      const y = H - PAD - h;
      return `<g>
        <rect x="${x}" y="${y}" width="${barW}" height="${h}" fill="#2563eb" rx="4"/>
        <text x="${x + barW / 2}" y="${H - PAD + 18}" text-anchor="middle" font-size="12">${escapeHtml(bar.label)}</text>
        <text x="${x + barW / 2}" y="${y - 6}" text-anchor="middle" font-size="11">${bar.value}</text>
      </g>`;
    })
    .join("\n");

  const yLabel = params.yLabel
    ? `<text x="14" y="${H / 2}" text-anchor="middle" font-size="13" transform="rotate(-90 14 ${H / 2})">${escapeHtml(params.yLabel)}</text>`
    : "";

  return `<svg class="template-diagram bar-chart" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <line x1="${PAD}" y1="${H - PAD}" x2="${W - PAD}" y2="${H - PAD}" stroke="#1a1a1a" stroke-width="2"/>
    <line x1="${PAD}" y1="${PAD}" x2="${PAD}" y2="${H - PAD}" stroke="#1a1a1a" stroke-width="2"/>
    ${yLabel}
    ${barEls}
  </svg>`;
}
