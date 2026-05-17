import { layoutGraph } from "../layout-engine/layout.ts";
import { renderBoxGraphSvg } from "../layout-engine/render-svg.ts";

export type BayesNetParams = {
  nodes: Array<{ id: string; label: string }>;
  edges: Array<{ from: string; to: string }>;
};

export function renderBayesNetSvg(params: BayesNetParams): string {
  const layout = layoutGraph({
    nodes: params.nodes.slice(0, 8),
    edges: params.edges.slice(0, 12),
    layout: "layered",
  });
  return renderBoxGraphSvg(layout, { nodeStyle: "ellipse", markerId: "bayes-net-arrow" });
}
