export type GraphNode = { id: string; label: string };
export type GraphEdge = { from: string; to: string; label?: string };
export type LayoutHint = "layered" | "tree" | "horizontal";

export type GraphInput = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  layout?: LayoutHint;
};

export type PlacedNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PlacedEdge = {
  from: string;
  to: string;
  label?: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type LayoutResult = {
  nodes: PlacedNode[];
  edges: PlacedEdge[];
  width: number;
  height: number;
};
