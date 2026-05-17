import { escapeHtml } from "../util.ts";

export type Venn2Params = {
  leftLabel: string;
  rightLabel: string;
  intersection?: string;
};

export function renderVenn2Svg(params: Venn2Params): string {
  return `<svg class="template-diagram venn-2" viewBox="0 0 520 280" xmlns="http://www.w3.org/2000/svg">
    <circle cx="200" cy="140" r="90" fill="rgba(37,99,235,0.12)" stroke="#1a1a1a" stroke-width="2"/>
    <circle cx="320" cy="140" r="90" fill="rgba(220,38,38,0.12)" stroke="#1a1a1a" stroke-width="2"/>
    <text x="150" y="140" text-anchor="middle" font-size="16">${escapeHtml(params.leftLabel)}</text>
    <text x="370" y="140" text-anchor="middle" font-size="16">${escapeHtml(params.rightLabel)}</text>
    ${params.intersection ? `<text x="260" y="145" text-anchor="middle" font-size="14">${escapeHtml(params.intersection)}</text>` : ""}
  </svg>`;
}
