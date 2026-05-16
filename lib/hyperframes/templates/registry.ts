import type { BoardAction } from "../../education/loop/schema.ts";
import { escapeHtml } from "../util.ts";
import { renderBayesNetSvg, type BayesNetParams } from "./bayes-net.ts";
import { renderFlowchartSvg, type FlowchartParams } from "./flowchart.ts";
import { renderMatrixBlockHtml, type MatrixBlockParams } from "./matrix-block.ts";

export const TEMPLATE_IDS = ["flowchart", "bayes-net", "matrix-block"] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export function isTemplateId(value: string): value is TemplateId {
  return (TEMPLATE_IDS as readonly string[]).includes(value);
}

export function renderDiagramFromTemplate(action: BoardAction): string | null {
  if (!action.templateId || !isTemplateId(action.templateId)) {
    return null;
  }
  const params = action.templateParams ?? {};

  switch (action.templateId) {
    case "flowchart":
      return renderFlowchartSvg(params as FlowchartParams);
    case "bayes-net":
      return renderBayesNetSvg(params as BayesNetParams);
    case "matrix-block":
      return renderMatrixBlockHtml(params as MatrixBlockParams);
    default:
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
