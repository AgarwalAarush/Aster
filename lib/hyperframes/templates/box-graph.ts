import { layoutGraph } from "../layout-engine/layout.ts";
import { renderBoxGraphSvg } from "../layout-engine/render-svg.ts";
import type { LayoutHint } from "../layout-engine/types.ts";

export type BoxGraphParams = {
  nodes: Array<{ id: string; label: string }>;
  edges: Array<{ from: string; to: string; label?: string }>;
  layout?: LayoutHint;
};

export function renderBoxGraphSvgFromParams(params: BoxGraphParams): string {
  const layout = layoutGraph({
    nodes: params.nodes,
    edges: params.edges,
    layout: params.layout,
  });
  return renderBoxGraphSvg(layout, { markerId: "box-graph-arrow" });
}
