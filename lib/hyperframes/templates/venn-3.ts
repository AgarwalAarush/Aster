import { escapeHtml } from "../util.ts";

export type Venn3Params = {
  labels: [string, string, string];
  center?: string;
};

export function renderVenn3Svg(params: Venn3Params): string {
  const [a, b, c] = params.labels;
  return `<svg class="template-diagram venn-3" viewBox="0 0 560 320" xmlns="http://www.w3.org/2000/svg">
    <circle cx="220" cy="130" r="80" fill="rgba(37,99,235,0.1)" stroke="#1a1a1a" stroke-width="2"/>
    <circle cx="340" cy="130" r="80" fill="rgba(220,38,38,0.1)" stroke="#1a1a1a" stroke-width="2"/>
    <circle cx="280" cy="210" r="80" fill="rgba(22,163,74,0.1)" stroke="#1a1a1a" stroke-width="2"/>
    <text x="170" y="120" font-size="14">${escapeHtml(a)}</text>
    <text x="370" y="120" font-size="14">${escapeHtml(b)}</text>
    <text x="280" y="250" text-anchor="middle" font-size="14">${escapeHtml(c)}</text>
    ${params.center ? `<text x="280" y="165" text-anchor="middle" font-size="13">${escapeHtml(params.center)}</text>` : ""}
  </svg>`;
}
