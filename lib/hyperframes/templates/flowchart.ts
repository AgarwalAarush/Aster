import { renderBoxGraphSvgFromParams, type BoxGraphParams } from "./box-graph.ts";

export type FlowchartParams = BoxGraphParams;

export function renderFlowchartSvg(params: FlowchartParams): string {
  return renderBoxGraphSvgFromParams({
    ...params,
    layout: params.layout ?? "layered",
  });
}
