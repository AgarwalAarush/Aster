import { escapeHtml } from "../util.ts";

export type LayerGraphParams = {
  layers: Array<{ size: number; label?: string }>;
};

const NODE_R = 14;
const LAYER_GAP = 120;
const NODE_GAP = 36;

export function renderLayerGraphSvg(params: LayerGraphParams): string {
  const layers = params.layers.slice(0, 8);
  const maxSize = Math.max(...layers.map((l) => l.size), 1);
  const height = maxSize * NODE_GAP + 80;
  const width = layers.length * LAYER_GAP + 80;

  const layerEls: string[] = [];
  const edgeEls: string[] = [];
  const nodePositions: Array<Array<{ x: number; y: number }>> = [];

  layers.forEach((layer, li) => {
    const x = 60 + li * LAYER_GAP;
    const count = Math.min(layer.size, 12);
    const startY = (height - (count - 1) * NODE_GAP) / 2;
    const positions: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < count; i += 1) {
      const y = startY + i * NODE_GAP;
      positions.push({ x, y });
      layerEls.push(`<circle cx="${x}" cy="${y}" r="${NODE_R}" fill="#fff" stroke="#1a1a1a" stroke-width="2"/>`);
    }
    if (layer.label) {
      layerEls.push(`<text x="${x}" y="28" text-anchor="middle" font-size="14">${escapeHtml(layer.label)}</text>`);
    }
    nodePositions.push(positions);
  });

  for (let li = 0; li < nodePositions.length - 1; li += 1) {
    const left = nodePositions[li]!;
    const right = nodePositions[li + 1]!;
    for (const a of left) {
      for (const b of right) {
        edgeEls.push(`<line x1="${a.x + NODE_R}" y1="${a.y}" x2="${b.x - NODE_R}" y2="${b.y}" stroke="#1a1a1a" stroke-width="1.5" opacity="0.5"/>`);
      }
    }
  }

  return `<svg class="template-diagram layer-graph" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    ${edgeEls.join("\n")}
    ${layerEls.join("\n")}
  </svg>`;
}
