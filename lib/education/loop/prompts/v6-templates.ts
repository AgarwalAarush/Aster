import type { PromptVariant, Subject } from "../schema.ts";
import { TEMPLATE_IDS } from "../../../hyperframes/templates/ids.ts";

const LAYOUT_RULES = `
Board layout (optional board.layout):
- { "id": "full" } — single pane; use region "pane:full" or "full"
- { "id": "split-vertical", "ratio": "50-50"|"33-67", "divider": true|false } — use "pane:left" and "pane:right"

Write styles (write actions only):
- writeStyle "body" (default), "header", or "equation" (LaTeX string in content)
`;

const SYSTEM_PROMPT = `You are an expert lecturer planning a ~60 second whiteboard video using FIXED layouts and diagram templates. Output JSON only.

${LAYOUT_RULES}

For every draw action you MUST set templateId and templateParams (structured slots). Set content to a one-line fallback description.

Allowed templateId values: ${TEMPLATE_IDS.join(", ")}.

Template slots:
- box-graph / flowchart: { nodes: [{id, label}], edges: [{from, to, label?}], layout?: "layered"|"tree"|"horizontal" }
- bayes-net: { nodes: [{id, label}], edges: [{from, to}] }
- matrix-block: { title?, rows: [[cell, ...], ...], scale?: "md"|"lg"|"xl", highlightRows?, highlightCols?, highlightColor?: "green"|"blue" }
- matrix-math: { matrix: [[...]], brackets?, title?, scale?, highlightRows?, highlightCols?, highlightColor? } — use scale "lg"|"xl" or highlights for HTML grid; small pure math uses KaTeX
- attention-mask: { size: 4-48, windowRadius?, title?, caption?, highlightColor? } — sliding-window diagonal band (like transformer attention figure)
- matrix-multiply: { left: [[...]], right: [[...]], showResult?: boolean }
- cartesian-plot: { xLabel?, yLabel?, series: [{ points: [{x,y}], style?: "line"|"scatter" }], annotations? }
- probability-tree: { levels: [{ branches: [{label, prob?}] }] }
- venn-2: { leftLabel, rightLabel, intersection? }
- venn-3: { labels: [a,b,c], center? }
- dp-grid: { rows, cols, cells?: [{r, c, text, highlight?}] }
- layer-graph: { layers: [{size, label?}] }
- bar-chart: { bars: [{label, value}], yLabel? }

Use at least 2 templated draws. First template draw at or before t=20s.
Region exclusivity: erase before placing new primary content in a region already occupied.
durationSeconds 60-90 (prefer 60). 4-6 beats. Unique targetIds.`;

const USER_PROMPT_TEMPLATE = `Topic: {{topicTitle}}
Question: {{topicQuestion}}
Domain: {{topicDomain}}
Difficulty: {{topicDifficulty}}

JSON shape — include board.layout when using split panes; draw actions MUST include templateId and templateParams:

{
  "id": "{{topicId}}-v6-templates-001",
  "topic": { "id": "{{topicId}}", "title": "{{topicTitle}}", "question": "{{topicQuestion}}", "domain": "{{topicDomain}}" },
  "promptVariant": { "id": "whiteboard-v6-templates", "name": "Whiteboard v6 templates" },
  "metadata": { "generator": "agent", "createdAt": "ISO-8601" },
  "lesson": { "title": "...", "learnerLevel": "...", "durationSeconds": 60, "payoff": "...", "staircase": [], "destination": "..." },
  "narration": { "fullText": "...", "beats": [] },
  "board": {
    "layout": { "id": "split-vertical", "ratio": "50-50", "divider": true },
    "actions": [{
      "at": 0,
      "kind": "draw",
      "targetId": "diagram_main",
      "content": "fallback",
      "region": "pane:left",
      "templateId": "box-graph",
      "templateParams": { "nodes": [{"id":"a","label":"A"}], "edges": [] }
    }]
  }
}

Constraints: durationSeconds 60-90; >=2 templated draws; region erase rules; JSON only.`;

export const WHITEBOARD_V6_TEMPLATES: PromptVariant = {
  id: "whiteboard-v6-templates",
  name: "Whiteboard v6 layouts + templates",
  systemPrompt: SYSTEM_PROMPT,
  userPromptTemplate: USER_PROMPT_TEMPLATE,
};

export function renderUserPrompt(template: string, subject: Subject): string {
  return template
    .replaceAll("{{topicId}}", subject.id)
    .replaceAll("{{topicTitle}}", subject.title)
    .replaceAll("{{topicQuestion}}", subject.question)
    .replaceAll("{{topicDomain}}", subject.domain)
    .replaceAll("{{topicDifficulty}}", subject.difficulty);
}
