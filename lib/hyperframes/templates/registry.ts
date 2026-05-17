import type { BoardAction } from "../../education/loop/schema.ts";
import { escapeHtml } from "../util.ts";
import { renderBayesNetSvg } from "./bayes-net.ts";
import { renderBarChartSvg } from "./bar-chart.ts";
import { renderBoxGraphSvgFromParams } from "./box-graph.ts";
import { renderCartesianPlotSvg } from "./cartesian-plot.ts";
import { renderDpGridHtml } from "./dp-grid.ts";
import { renderFlowchartSvg } from "./flowchart.ts";
import { renderLayerGraphSvg } from "./layer-graph.ts";
import { renderMatrixBlockHtml } from "./matrix-block.ts";
import { renderMatrixMathHtml } from "./matrix-math.ts";
import { renderMatrixMultiplyHtml } from "./matrix-multiply.ts";
import { renderAttentionMaskHtml } from "./attention-mask.ts";
import { renderProbabilityTreeSvg } from "./probability-tree.ts";
import { TEMPLATE_IDS, isTemplateId, type TemplateId } from "./ids.ts";
import { parseTemplateParams, parseTemplateParamsSafe } from "./schemas/index.ts";
import { renderVenn2Svg } from "./venn-2.ts";
import { renderVenn3Svg } from "./venn-3.ts";

export { TEMPLATE_IDS, isTemplateId, type TemplateId };
export { parseTemplateParams, parseTemplateParamsSafe };

export function renderDiagramFromTemplate(action: BoardAction): string | null {
  if (!action.templateId || !isTemplateId(action.templateId)) {
    return null;
  }
  const params = action.templateParams ?? {};

  try {
    switch (action.templateId) {
      case "box-graph":
        return renderBoxGraphSvgFromParams(parseTemplateParams("box-graph", params));
      case "flowchart":
        return renderFlowchartSvg(parseTemplateParams("flowchart", params));
      case "bayes-net":
        return renderBayesNetSvg(parseTemplateParams("bayes-net", params));
      case "matrix-block":
        return renderMatrixBlockHtml(parseTemplateParams("matrix-block", params));
      case "matrix-math":
        return renderMatrixMathHtml(parseTemplateParams("matrix-math", params));
      case "matrix-multiply":
        return renderMatrixMultiplyHtml(parseTemplateParams("matrix-multiply", params));
      case "attention-mask":
        return renderAttentionMaskHtml(parseTemplateParams("attention-mask", params));
      case "cartesian-plot":
        return renderCartesianPlotSvg(parseTemplateParams("cartesian-plot", params));
      case "probability-tree":
        return renderProbabilityTreeSvg(parseTemplateParams("probability-tree", params));
      case "venn-2":
        return renderVenn2Svg(parseTemplateParams("venn-2", params));
      case "venn-3":
        return renderVenn3Svg(parseTemplateParams("venn-3", params));
      case "dp-grid":
        return renderDpGridHtml(parseTemplateParams("dp-grid", params));
      case "layer-graph":
        return renderLayerGraphSvg(parseTemplateParams("layer-graph", params));
      case "bar-chart":
        return renderBarChartSvg(parseTemplateParams("bar-chart", params));
      default:
        return null;
    }
  } catch {
    return null;
  }
}

export function renderDrawInnerHtml(action: BoardAction): string {
  const templateHtml = renderDiagramFromTemplate(action);
  if (templateHtml) {
    return `<div class="draw-template">${templateHtml}</div>`;
  }
  return `<span class="draw-tag">DIAGRAM</span><div class="draw-description">${escapeHtml(action.content)}</div>`;
}
