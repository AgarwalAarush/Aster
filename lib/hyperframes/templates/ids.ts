export const TEMPLATE_IDS = [
  "box-graph",
  "flowchart",
  "bayes-net",
  "matrix-block",
  "matrix-math",
  "matrix-multiply",
  "attention-mask",
  "cartesian-plot",
  "probability-tree",
  "venn-2",
  "venn-3",
  "dp-grid",
  "layer-graph",
  "bar-chart",
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

export function isTemplateId(value: string): value is TemplateId {
  return (TEMPLATE_IDS as readonly string[]).includes(value);
}
