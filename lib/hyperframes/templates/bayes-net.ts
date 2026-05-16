import { escapeHtml } from "../util.ts";

export type BayesNetParams = {
  nodes: Array<{ id: string; label: string; x?: number; y?: number }>;
  edges: Array<{ from: string; to: string }>;
};

export function renderBayesNetSvg(params: BayesNetParams): string {
  const nodes = params.nodes.slice(0, 6);
  const edges = params.edges.slice(0, 10);
  const positions = new Map<string, { x: number; y: number }>();

  const nodeEls = nodes
    .map((node, i) => {
      const x = node.x ?? 80 + (i % 3) * 220;
      const y = node.y ?? 60 + Math.floor(i / 3) * 140;
      positions.set(node.id, { x, y });
      return `<g class="bn-node">
        <ellipse cx="${x}" cy="${y}" rx="56" ry="32" fill="#fff" stroke="#1a1a1a" stroke-width="2"/>
        <text x="${x}" y="${y + 6}" text-anchor="middle" font-size="15" fill="#1a1a1a">${escapeHtml(node.label)}</text>
      </g>`;
    })
    .join("\n");

  const edgeEls = edges
    .map((edge) => {
      const from = positions.get(edge.from);
      const to = positions.get(edge.to);
      if (!from || !to) {
        return "";
      }
      return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="#1a1a1a" stroke-width="2" marker-end="url(#bn-arrow)"/>`;
    })
    .join("\n");

  return `<svg class="template-diagram bayes-net" viewBox="0 0 720 280" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="bn-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#1a1a1a"/></marker></defs>
    ${edgeEls}
    ${nodeEls}
  </svg>`;
}
