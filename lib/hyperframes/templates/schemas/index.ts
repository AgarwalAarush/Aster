import { z } from "zod";
import type { TemplateId } from "../ids.ts";
import type { BarChartParams } from "../bar-chart.ts";
import type { BayesNetParams } from "../bayes-net.ts";
import type { BoxGraphParams } from "../box-graph.ts";
import type { CartesianPlotParams } from "../cartesian-plot.ts";
import type { DpGridParams } from "../dp-grid.ts";
import type { FlowchartParams } from "../flowchart.ts";
import type { LayerGraphParams } from "../layer-graph.ts";
import type { MatrixBlockParams } from "../matrix-block.ts";
import type { MatrixMathParams } from "../matrix-math.ts";
import type { MatrixMultiplyParams } from "../matrix-multiply.ts";
import type { AttentionMaskParams } from "../attention-mask.ts";
import type { ProbabilityTreeParams } from "../probability-tree.ts";
import type { Venn2Params } from "../venn-2.ts";
import type { Venn3Params } from "../venn-3.ts";

export type TemplateParamsMap = {
  "box-graph": BoxGraphParams;
  flowchart: FlowchartParams;
  "bayes-net": BayesNetParams;
  "matrix-block": MatrixBlockParams;
  "matrix-math": MatrixMathParams;
  "matrix-multiply": MatrixMultiplyParams;
  "attention-mask": AttentionMaskParams;
  "cartesian-plot": CartesianPlotParams;
  "probability-tree": ProbabilityTreeParams;
  "venn-2": Venn2Params;
  "venn-3": Venn3Params;
  "dp-grid": DpGridParams;
  "layer-graph": LayerGraphParams;
  "bar-chart": BarChartParams;
};

const graphNodeSchema = z.object({
  id: z.string().min(1).max(40),
  label: z.string().min(1).max(80),
});

const graphEdgeSchema = z.object({
  from: z.string().min(1).max(40),
  to: z.string().min(1).max(40),
  label: z.string().max(40).optional(),
});

export const boxGraphParamsSchema = z.object({
  nodes: z.array(graphNodeSchema).min(1).max(12),
  edges: z.array(graphEdgeSchema).max(16),
  layout: z.enum(["layered", "tree", "horizontal"]).optional(),
});

export const flowchartParamsSchema = boxGraphParamsSchema;
export const bayesNetParamsSchema = z.object({
  nodes: z.array(graphNodeSchema).min(1).max(8),
  edges: z.array(z.object({ from: z.string(), to: z.string() })).max(12),
});

const matrixHighlightSchema = {
  highlightRows: z.array(z.number().int().min(0).max(32)).max(16).optional(),
  highlightCols: z.array(z.number().int().min(0).max(32)).max(16).optional(),
  highlightColor: z.enum(["green", "blue"]).optional(),
  scale: z.enum(["md", "lg", "xl"]).optional(),
  caption: z.string().max(120).optional(),
};

export const matrixBlockParamsSchema = z.object({
  title: z.string().max(80).optional(),
  rows: z.array(z.array(z.string().max(40)).max(16)).min(1).max(16),
  ...matrixHighlightSchema,
});

export const matrixMathParamsSchema = z.object({
  matrix: z.array(z.array(z.string().max(40)).max(16)).min(1).max(16),
  brackets: z.enum(["()", "[]"]).optional(),
  title: z.string().max(80).optional(),
  ...matrixHighlightSchema,
});

export const attentionMaskParamsSchema = z.object({
  size: z.number().int().min(4).max(48),
  windowRadius: z.number().int().min(1).max(24).optional(),
  title: z.string().max(80).optional(),
  caption: z.string().max(120).optional(),
  highlightColor: z.enum(["green", "blue"]).optional(),
});

export const matrixMultiplyParamsSchema = z.object({
  left: z.array(z.array(z.string().max(20)).max(6)).min(1).max(6),
  right: z.array(z.array(z.string().max(20)).max(6)).min(1).max(6),
  showResult: z.boolean().optional(),
  result: z.array(z.array(z.string().max(40)).max(6)).optional(),
});

export const cartesianPlotParamsSchema = z.object({
  xLabel: z.string().max(40).optional(),
  yLabel: z.string().max(40).optional(),
  xMin: z.number().optional(),
  xMax: z.number().optional(),
  yMin: z.number().optional(),
  yMax: z.number().optional(),
  series: z
    .array(
      z.object({
        label: z.string().max(40).optional(),
        points: z.array(z.object({ x: z.number(), y: z.number() })).min(1).max(64),
        style: z.enum(["line", "scatter"]).optional(),
      }),
    )
    .min(1)
    .max(4),
  annotations: z
    .array(z.object({ x: z.number(), y: z.number(), text: z.string().max(60) }))
    .max(8)
    .optional(),
});

export const probabilityTreeParamsSchema = z.object({
  levels: z
    .array(
      z.object({
        branches: z.array(z.object({ label: z.string().max(40), prob: z.string().max(20).optional() })).min(1).max(6),
      }),
    )
    .min(1)
    .max(5),
});

export const venn2ParamsSchema = z.object({
  leftLabel: z.string().min(1).max(40),
  rightLabel: z.string().min(1).max(40),
  intersection: z.string().max(40).optional(),
});

export const venn3ParamsSchema = z.object({
  labels: z.tuple([z.string().max(40), z.string().max(40), z.string().max(40)]),
  center: z.string().max(40).optional(),
});

export const dpGridParamsSchema = z.object({
  rows: z.number().int().min(1).max(10),
  cols: z.number().int().min(1).max(12),
  cells: z
    .array(
      z.object({
        r: z.number().int().min(0),
        c: z.number().int().min(0),
        text: z.string().max(40),
        highlight: z.boolean().optional(),
      }),
    )
    .max(120)
    .optional(),
});

export const layerGraphParamsSchema = z.object({
  layers: z
    .array(z.object({ size: z.number().int().min(1).max(12), label: z.string().max(40).optional() }))
    .min(2)
    .max(8),
});

export const barChartParamsSchema = z.object({
  bars: z.array(z.object({ label: z.string().max(40), value: z.number() })).min(1).max(12),
  yLabel: z.string().max(40).optional(),
});

const SCHEMA_BY_ID: Record<TemplateId, z.ZodType> = {
  "box-graph": boxGraphParamsSchema,
  flowchart: flowchartParamsSchema,
  "bayes-net": bayesNetParamsSchema,
  "matrix-block": matrixBlockParamsSchema,
  "matrix-math": matrixMathParamsSchema,
  "matrix-multiply": matrixMultiplyParamsSchema,
  "attention-mask": attentionMaskParamsSchema,
  "cartesian-plot": cartesianPlotParamsSchema,
  "probability-tree": probabilityTreeParamsSchema,
  "venn-2": venn2ParamsSchema,
  "venn-3": venn3ParamsSchema,
  "dp-grid": dpGridParamsSchema,
  "layer-graph": layerGraphParamsSchema,
  "bar-chart": barChartParamsSchema,
};

export function parseTemplateParams<T extends TemplateId>(
  templateId: T,
  params: unknown,
): TemplateParamsMap[T] {
  return SCHEMA_BY_ID[templateId].parse(params) as TemplateParamsMap[T];
}

export function parseTemplateParamsSafe(templateId: TemplateId, params: unknown) {
  return SCHEMA_BY_ID[templateId].safeParse(params);
}
