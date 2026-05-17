import { escapeHtml } from "../util.ts";

export type ProbabilityTreeParams = {
  levels: Array<{
    branches: Array<{ label: string; prob?: string }>;
  }>;
};

const NODE_W = 100;
const V_GAP = 80;
const H_GAP = 24;

export function renderProbabilityTreeSvg(params: ProbabilityTreeParams): string {
  const levels = params.levels.slice(0, 5);
  const width = Math.max(480, levels.reduce((max, l) => Math.max(max, l.branches.length), 1) * (NODE_W + H_GAP));
  const height = levels.length * V_GAP + 80;

  const nodes: string[] = [];
  const edges: string[] = [];

  levels.forEach((level, depth) => {
    const count = level.branches.length;
    const startX = (width - count * (NODE_W + H_GAP)) / 2;
    level.branches.slice(0, 6).forEach((branch, i) => {
      const x = startX + i * (NODE_W + H_GAP) + NODE_W / 2;
      const y = 40 + depth * V_GAP;
      const label = branch.prob ? `${branch.label} (${branch.prob})` : branch.label;
      nodes.push(
        `<g><rect x="${x - NODE_W / 2}" y="${y - 18}" width="${NODE_W}" height="36" rx="6" fill="#fff" stroke="#1a1a1a" stroke-width="2"/>
        <text x="${x}" y="${y + 5}" text-anchor="middle" font-size="13">${escapeHtml(label)}</text></g>`,
      );
      if (depth > 0) {
        const parentCount = levels[depth - 1]!.branches.length;
        const parentStart = (width - parentCount * (NODE_W + H_GAP)) / 2;
        const parentIndex = Math.min(i, parentCount - 1);
        const px = parentStart + parentIndex * (NODE_W + H_GAP) + NODE_W / 2;
        const py = 40 + (depth - 1) * V_GAP;
        edges.push(`<line x1="${px}" y1="${py + 18}" x2="${x}" y2="${y - 18}" stroke="#1a1a1a" stroke-width="2"/>`);
      }
    });
  });

  return `<svg class="template-diagram probability-tree" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    ${edges.join("\n")}
    ${nodes.join("\n")}
  </svg>`;
}
