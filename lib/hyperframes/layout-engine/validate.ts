import type { GraphEdge, GraphInput, GraphNode } from "./types.ts";

export type GraphValidation = {
  ok: boolean;
  nodes: GraphNode[];
  edges: GraphEdge[];
  warnings: string[];
};

export function validateGraph(input: GraphInput): GraphValidation {
  const warnings: string[] = [];
  const nodes = input.nodes.slice(0, 12);
  const edges = input.edges.slice(0, 16);
  const ids = new Set<string>();

  for (const node of nodes) {
    if (ids.has(node.id)) {
      warnings.push(`duplicate node id: ${node.id}`);
    }
    ids.add(node.id);
  }

  for (const edge of edges) {
    if (!ids.has(edge.from)) {
      warnings.push(`edge from unknown node: ${edge.from}`);
    }
    if (!ids.has(edge.to)) {
      warnings.push(`edge to unknown node: ${edge.to}`);
    }
  }

  return {
    ok: nodes.length > 0 && warnings.length === 0,
    nodes,
    edges,
    warnings,
  };
}

export function hasCycle(nodes: GraphNode[], edges: GraphEdge[]): boolean {
  const adj = new Map<string, string[]>();
  for (const n of nodes) {
    adj.set(n.id, []);
  }
  for (const e of edges) {
    adj.get(e.from)?.push(e.to);
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();

  function dfs(id: string): boolean {
    if (visiting.has(id)) {
      return true;
    }
    if (visited.has(id)) {
      return false;
    }
    visiting.add(id);
    for (const next of adj.get(id) ?? []) {
      if (dfs(next)) {
        return true;
      }
    }
    visiting.delete(id);
    visited.add(id);
    return false;
  }

  for (const n of nodes) {
    if (dfs(n.id)) {
      return true;
    }
  }
  return false;
}
