import { escapeHtml } from "../util.ts";

export type FlowchartParams = {
  nodes: Array<{ id: string; label: string }>;
  edges: Array<{ from: string; to: string; label?: string }>;
};

export function renderFlowchartSvg(params: FlowchartParams): string {
  const nodes = params.nodes.slice(0, 8);
  const edges = params.edges.slice(0, 12);
  const nodeEls = nodes
    .map((node, i) => {
      const x = 40 + (i % 4) * 180;
      const y = 40 + Math.floor(i / 4) * 120;
      return `<g class="flow-node" data-node-id="${escapeHtml(node.id)}">
        <rect x="${x}" y="${y}" width="140" height="48" rx="8" fill="#fff" stroke="#1a1a1a" stroke-width="2"/>
        <text x="${x + 70}" y="${y + 30}" text-anchor="middle" font-size="16" fill="#1a1a1a">${escapeHtml(node.label)}</text>
      </g>`;
    })
    .join("\n");

  const nodePos = new Map(nodes.map((n, i) => [n.id, { x: 110 + (i % 4) * 180, y: 64 + Math.floor(i / 4) * 120 }]));
  const edgeEls = edges
    .map((edge) => {
      const from = nodePos.get(edge.from);
      const to = nodePos.get(edge.to);
      if (!from || !to) {
        return "";
      }
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      const label = edge.label
        ? `<text x="${midX}" y="${midY - 6}" text-anchor="middle" font-size="13" fill="#444">${escapeHtml(edge.label)}</text>`
        : "";
      return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="#1a1a1a" stroke-width="2" marker-end="url(#arrow)"/>${label}`;
    })
    .join("\n");

  return `<svg class="template-diagram flowchart" viewBox="0 0 800 320" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#1a1a1a"/></marker></defs>
    ${nodeEls}
    ${edgeEls}
  </svg>`;
}
