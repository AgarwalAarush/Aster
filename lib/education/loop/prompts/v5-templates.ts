import type { PromptVariant, Subject } from "../schema.ts";
import { TEMPLATE_IDS } from "../../../hyperframes/templates/registry.ts";

const SYSTEM_PROMPT = `You are an expert lecturer planning a ~60 second whiteboard video using FIXED diagram templates. Output JSON only.

For every draw action you MUST set templateId and templateParams (structured slots). You may still set content to a one-line fallback description.

Allowed templateId values: ${TEMPLATE_IDS.join(", ")}.

Template slots:
- flowchart: templateParams { nodes: [{id, label}], edges: [{from, to, label?}] }
- bayes-net: templateParams { nodes: [{id, label, x?, y?}], edges: [{from, to}] }
- matrix-block: templateParams { title?, rows: [[cell, ...], ...] }

Use at least 2 draw actions with templates. First template draw at or before t=20s.
Region exclusivity: erase before placing new primary content in a region already occupied.
durationSeconds 60-90 (prefer 60). 4-6 beats. Unique targetIds.`;

const USER_PROMPT_TEMPLATE = `Topic: {{topicTitle}}
Question: {{topicQuestion}}
Domain: {{topicDomain}}
Difficulty: {{topicDifficulty}}

JSON shape — draw actions MUST include templateId and templateParams:

{
  "id": "{{topicId}}-v5-templates-001",
  "topic": { "id": "{{topicId}}", "title": "{{topicTitle}}", "question": "{{topicQuestion}}", "domain": "{{topicDomain}}" },
  "promptVariant": { "id": "whiteboard-v5-templates", "name": "Whiteboard v5 templates" },
  "metadata": { "generator": "agent", "createdAt": "ISO-8601" },
  "lesson": { "title": "...", "learnerLevel": "...", "durationSeconds": 60, "payoff": "...", "staircase": [], "destination": "..." },
  "narration": { "fullText": "...", "beats": [] },
  "board": {
    "actions": [{
      "at": 0,
      "kind": "draw",
      "targetId": "diagram_main",
      "content": "fallback one-line description",
      "region": "center",
      "templateId": "flowchart",
      "templateParams": { "nodes": [{"id":"a","label":"A"}], "edges": [] }
    }]
  }
}

Constraints: durationSeconds 60-90; >=2 templated draws; region erase rules; JSON only.`;

export const WHITEBOARD_V5_TEMPLATES: PromptVariant = {
  id: "whiteboard-v5-templates",
  name: "Whiteboard v5 template-constrained diagrams",
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
