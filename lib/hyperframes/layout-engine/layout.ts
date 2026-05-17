import { hasCycle, validateGraph } from "./validate.ts";
import type { GraphInput, LayoutResult, PlacedEdge, PlacedNode } from "./types.ts";

const NODE_HEIGHT = 48;
const CHAR_WIDTH = 9;
const H_PAD = 24;
const H_GAP = 56;
const V_GAP = 72;
const MARGIN = 32;

function measureNode(label: string): { width: number; height: number } {
  const width = Math.max(80, label.length * CHAR_WIDTH + H_PAD * 2);
  return { width, height: NODE_HEIGHT };
}

function pickRoot(nodes: { id: string }[], edges: { from: string; to: string }[]): string {
  const inDegree = new Map<string, number>();
  for (const n of nodes) {
    inDegree.set(n.id, 0);
  }
  for (const e of edges) {
    inDegree.set(e.to, (inDegree.get(e.to) ?? 0) + 1);
  }
  const roots = nodes.filter((n) => (inDegree.get(n.id) ?? 0) === 0);
  return roots[0]?.id ?? nodes[0]?.id ?? "";
}

function layoutHorizontal(
  nodes: { id: string; label: string }[],
  edges: { from: string; to: string; label?: string }[],
): LayoutResult {
  const order: string[] = [];
  const seen = new Set<string>();
  const start = pickRoot(nodes, edges);
  if (start) {
    order.push(start);
    seen.add(start);
  }
  for (const e of edges) {
    if (!seen.has(e.to)) {
      order.push(e.to);
      seen.add(e.to);
    }
    if (!seen.has(e.from)) {
      order.push(e.from);
      seen.add(e.from);
    }
  }
  for (const n of nodes) {
    if (!seen.has(n.id)) {
      order.push(n.id);
    }
  }

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const placed: PlacedNode[] = [];
  let x = MARGIN;
  const y = MARGIN + 40;
  let maxW = 0;

  for (const id of order) {
    const node = byId.get(id);
    if (!node) {
      continue;
    }
    const size = measureNode(node.label);
    placed.push({ id, label: node.label, x, y, width: size.width, height: size.height });
    x += size.width + H_GAP;
    maxW = x;
  }

  return placeEdges(placed, edges, maxW + MARGIN, y + NODE_HEIGHT + MARGIN);
}

function layoutTree(
  nodes: { id: string; label: string }[],
  edges: { from: string; to: string; label?: string }[],
): LayoutResult {
  const root = pickRoot(nodes, edges);
  const children = new Map<string, string[]>();
  for (const n of nodes) {
    children.set(n.id, []);
  }
  for (const e of edges) {
    children.get(e.from)?.push(e.to);
  }

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const placed: PlacedNode[] = [];
  const positions = new Map<string, { x: number; y: number }>();

  function assign(id: string, depth: number, index: number): number {
    const node = byId.get(id);
    if (!node) {
      return index;
    }
    const size = measureNode(node.label);
    const x = MARGIN + index * (size.width + H_GAP);
    const y = MARGIN + depth * (NODE_HEIGHT + V_GAP);
    positions.set(id, { x, y });
    placed.push({ id, label: node.label, x, y, width: size.width, height: size.height });
    let next = index + 1;
    for (const child of children.get(id) ?? []) {
      next = assign(child, depth + 1, next);
    }
    return next;
  }

  if (root) {
    assign(root, 0, 0);
  }
  for (const n of nodes) {
    if (!positions.has(n.id)) {
      assign(n.id, 0, placed.length);
    }
  }

  const maxX = Math.max(...placed.map((p) => p.x + p.width), MARGIN);
  const maxY = Math.max(...placed.map((p) => p.y + p.height), MARGIN);
  return placeEdges(placed, edges, maxX + MARGIN, maxY + MARGIN);
}

function layoutLayered(
  nodes: { id: string; label: string }[],
  edges: { from: string; to: string; label?: string }[],
): LayoutResult {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const n of nodes) {
    inDegree.set(n.id, 0);
    adj.set(n.id, []);
  }
  for (const e of edges) {
    adj.get(e.from)?.push(e.to);
    inDegree.set(e.to, (inDegree.get(e.to) ?? 0) + 1);
  }

  const layers: string[][] = [];
  let queue = nodes.filter((n) => (inDegree.get(n.id) ?? 0) === 0).map((n) => n.id);
  const visited = new Set<string>();

  if (queue.length === 0 && nodes.length > 0) {
    queue = [nodes[0]!.id];
  }

  while (queue.length > 0) {
    layers.push([...queue]);
    const next: string[] = [];
    for (const id of queue) {
      visited.add(id);
      for (const to of adj.get(id) ?? []) {
        inDegree.set(to, (inDegree.get(to) ?? 0) - 1);
        if ((inDegree.get(to) ?? 0) <= 0 && !visited.has(to)) {
          next.push(to);
          visited.add(to);
        }
      }
    }
    queue = next;
  }

  for (const n of nodes) {
    if (!visited.has(n.id)) {
      layers.push([n.id]);
    }
  }

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const placed: PlacedNode[] = [];

  layers.forEach((layer, layerIndex) => {
    const y = MARGIN + layerIndex * (NODE_HEIGHT + V_GAP);
    const totalWidth = layer.reduce((sum, id) => {
      const label = byId.get(id)?.label ?? id;
      return sum + measureNode(label).width + H_GAP;
    }, -H_GAP);
    let x = MARGIN + Math.max(0, (800 - totalWidth) / 2);

    for (const id of layer) {
      const node = byId.get(id);
      if (!node) {
        continue;
      }
      const size = measureNode(node.label);
      placed.push({ id, label: node.label, x, y, width: size.width, height: size.height });
      x += size.width + H_GAP;
    }
  });

  const maxX = Math.max(...placed.map((p) => p.x + p.width), MARGIN);
  const maxY = Math.max(...placed.map((p) => p.y + p.height), MARGIN);
  return placeEdges(placed, edges, maxX + MARGIN, maxY + MARGIN);
}

function placeEdges(
  placed: PlacedNode[],
  edges: { from: string; to: string; label?: string }[],
  width: number,
  height: number,
): LayoutResult {
  const byId = new Map(placed.map((p) => [p.id, p]));
  const placedEdges: PlacedEdge[] = edges
    .map((edge) => {
      const from = byId.get(edge.from);
      const to = byId.get(edge.to);
      if (!from || !to) {
        return null;
      }
      const x1 = from.x + from.width / 2;
      const y1 = from.y + from.height;
      const x2 = to.x + to.width / 2;
      const y2 = to.y;
      return { ...edge, x1, y1, x2, y2 };
    })
    .filter((e): e is PlacedEdge => e !== null);

  return {
    nodes: placed,
    edges: placedEdges,
    width: Math.max(width, 320),
    height: Math.max(height, 200),
  };
}

export function layoutGraph(input: GraphInput): LayoutResult {
  const { nodes, edges } = validateGraph(input);
  if (nodes.length === 0) {
    return { nodes: [], edges: [], width: 320, height: 120 };
  }

  const hint = input.layout;
  if (hint === "horizontal") {
    return layoutHorizontal(nodes, edges);
  }
  if (hint === "tree") {
    return layoutTree(nodes, edges);
  }
  if (hint === "layered" || !hasCycle(nodes, edges)) {
    return layoutLayered(nodes, edges);
  }
  return layoutHorizontal(nodes, edges);
}
