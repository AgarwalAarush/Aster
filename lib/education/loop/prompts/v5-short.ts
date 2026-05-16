import type { PromptVariant, Subject } from "../schema.ts";

const SYSTEM_PROMPT = `You are an expert university lecturer producing a structured plan for a SHORT (~60 second) whiteboard narrated video. Output must be precise, executable JSON.

The video is one continuous whiteboard — no scenes, no slides. Target durationSeconds 60–90 (default 60). Pack one clear idea: payoff → staircase → destination in under a minute.

Every element has a unique targetId. Transform/highlight/erase only reference ids already introduced.

--- REGION EXCLUSIVITY (critical) ---
Never place new primary text or a new diagram in a region that still shows a different write/draw unless you first erase that target or use transform on the same targetId. Reusing region "center" (or any region) without erase causes illegible stacked text in the renderer. Before each new write/draw in region R: erase the prior occupant of R OR transform the same targetId in place.

--- SHORT LESSON DENSITY ---
- 4–6 narration beats, 8–15 board actions total.
- At least 2 draw actions; first draw at or before t=20s.
- Prefer erase over accumulation when changing the main visual in a region.

--- HIGHLIGHT SPECIFICITY ---
Highlight content must say WHAT and HOW to mark (e.g. "circle lambda in red"), not just the targetId.

Define symbols and jargon on first use. Split overloaded beats.

Emit JSON only. No markdown fences.`;

const USER_PROMPT_TEMPLATE = `Topic: {{topicTitle}}
Question: {{topicQuestion}}
Domain: {{topicDomain}}
Difficulty: {{topicDifficulty}}

Produce JSON matching this shape (omit codeBlocks if unused):

{
  "id": "{{topicId}}-v5-short-001",
  "topic": { "id": "{{topicId}}", "title": "{{topicTitle}}", "question": "{{topicQuestion}}", "domain": "{{topicDomain}}" },
  "promptVariant": { "id": "whiteboard-v5-short", "name": "Whiteboard v5 short ~60s" },
  "metadata": { "generator": "agent", "createdAt": "ISO-8601" },
  "lesson": {
    "title": "...",
    "learnerLevel": "...",
    "durationSeconds": integer 60-90 (prefer 60),
    "payoff": "concrete stake with number when possible",
    "staircase": ["2-5 rungs"],
    "destination": "precise formula or mechanism"
  },
  "narration": {
    "fullText": "...",
    "beats": [{ "atSec": 0, "text": "...", "whyThisBeat": "..." }]
  },
  "board": {
    "actions": [{
      "at": 0,
      "kind": "write|draw|highlight|transform|erase",
      "targetId": "unique_id",
      "content": "...",
      "region": "top-left|center|..."
    }]
  }
}

Hard constraints:
- durationSeconds between 60 and 90; default 60.
- Monotonic atSec and at timestamps within durationSeconds.
- At least 2 draw actions; first draw at <= 20s.
- No overlapping regions: erase or transform before reusing a region for different content.
- payoff has number/stake; destination is precise.
- Last narration beat within 10s of durationSeconds.
- Last board action within 10s of last narration beat.
- Unique targetId on every write/draw.
- JSON only.`;

export const WHITEBOARD_V5_SHORT: PromptVariant = {
  id: "whiteboard-v5-short",
  name: "Whiteboard v5 short ~60s with region exclusivity",
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
