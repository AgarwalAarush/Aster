import { escapeHtml } from "../util.ts";
import type { LayoutResult } from "./types.ts";
import type { GraphNode } from "./types.ts";

export type BoxNodeStyle = "rect" | "ellipse";

export function renderBoxGraphSvg(
  layout: LayoutResult,
  options: { nodeStyle?: BoxNodeStyle; markerId?: string } = {},
): string {
  const nodeStyle = options.nodeStyle ?? "rect";
  const markerId = options.markerId ?? "box-graph-arrow";

  const nodeEls = layout.nodes
    .map((node) => {
      if (nodeStyle === "ellipse") {
        const cx = node.x + node.width / 2;
        const cy = node.y + node.height / 2;
        return `<g class="graph-node" data-node-id="${escapeHtml(node.id)}">
        <ellipse cx="${cx}" cy="${cy}" rx="${node.width / 2}" ry="${node.height / 2}" fill="#fff" stroke="#1a1a1a" stroke-width="2"/>
        <text x="${cx}" y="${cy + 6}" text-anchor="middle" font-size="15" fill="#1a1a1a">${escapeHtml(node.label)}</text>
      </g>`;
      }
      return `<g class="graph-node" data-node-id="${escapeHtml(node.id)}">
        <rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" rx="8" fill="#fff" stroke="#1a1a1a" stroke-width="2"/>
        <text x="${node.x + node.width / 2}" y="${node.y + node.height / 2 + 6}" text-anchor="middle" font-size="15" fill="#1a1a1a">${escapeHtml(node.label)}</text>
      </g>`;
    })
    .join("\n");

  const edgeEls = layout.edges
    .map((edge) => {
      const midX = (edge.x1 + edge.x2) / 2;
      const midY = (edge.y1 + edge.y2) / 2;
      const label = edge.label
        ? `<text x="${midX}" y="${midY - 6}" text-anchor="middle" font-size="13" fill="#444">${escapeHtml(edge.label)}</text>`
        : "";
      return `<line x1="${edge.x1}" y1="${edge.y1}" x2="${edge.x2}" y2="${edge.y2}" stroke="#1a1a1a" stroke-width="2" marker-end="url(#${markerId})"/>${label}`;
    })
    .join("\n");

  return `<svg class="template-diagram box-graph" viewBox="0 0 ${layout.width} ${layout.height}" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="${markerId}" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#1a1a1a"/></marker></defs>
    ${edgeEls}
    ${nodeEls}
  </svg>`;
}

import { layoutGraph } from "./layout.ts";

export function renderGraphFromInput(
  nodes: GraphNode[],
  edges: Array<{ from: string; to: string; label?: string }>,
  layoutHint?: "layered" | "tree" | "horizontal",
  nodeStyle?: BoxNodeStyle,
): string {
  const layout = layoutGraph({ nodes, edges, layout: layoutHint });
  return renderBoxGraphSvg(layout, { nodeStyle, markerId: `arrow-${layoutHint ?? "default"}` });
}
