type BuildScriptQaPromptOptions = {
  topicTitle: string;
  question: string;
  targetDurationSeconds?: number;
};

export function buildScriptQaPrompt({
  topicTitle,
  question,
  targetDurationSeconds = 150,
}: BuildScriptQaPromptOptions): string {
  return `Create a script-plus-storyboard for a narrated technical video. This is not a blog post.

Before writing beats, decide and state:
- payoff: the concrete reason the viewer should care, with a number when the topic admits one.
- staircase: the minimum prerequisite sequence that gets the viewer to the concept.
- destination: the precise mechanism, definition, or theorem the viewer should hold afterward.

Write beats, not sections. Each beat is one idea, one visual, and one short stretch of narration.
If a beat does two things, split it. Each beat must include whyThisBeat: the rung it adds to the staircase.

Topic: ${topicTitle}
Question: ${question}
Target duration: ${targetDurationSeconds} seconds. Keep dense ML topics in the 90-180 seconds range.

Return only JSON with this structure:
{
  "id": "kebab-case-candidate-id",
  "topic": {
    "id": "kebab-case-topic-id",
    "title": "${topicTitle}",
    "question": "${question}"
  },
  "promptVariant": {
    "id": "technical-script-v1",
    "name": "Technical script-first prompt v1",
    "prompt": "the exact prompt variant used"
  },
  "metadata": {
    "runner": "in-cursor-agent",
    "model": "model name",
    "agentId": "optional agent identifier",
    "createdAt": "ISO timestamp"
  },
  "lesson": {
    "title": "specific lesson title",
    "learnerLevel": "specific audience",
    "targetDurationSeconds": ${targetDurationSeconds},
    "learningObjective": "what the learner should understand",
    "payoff": "optional payoff sentence",
    "staircase": ["optional prerequisite rung list"],
    "destination": "optional precise destination sentence"
  },
  "script": {
    "fullNarration": "complete spoken script, not bullet points",
    "sections": [
      {
        "kind": "motivation | background | mechanism | math | tradeoff | example | recap",
        "title": "section title",
        "narration": "spoken narration for this section",
        "visual": "concrete diagram or animation direction",
        "whyThisBeat": "one line explaining what this beat accomplishes in the staircase",
        "estimatedSeconds": 20
      }
    ]
  },
  "visualPlan": [
    {
      "sceneTitle": "scene title",
      "diagram": "diagram type or visual structure",
      "animation": "specific animation beat"
    }
  ]
}

Requirements for GQA-style ML systems topics:
- Build a lesson arc: motivation, background, mechanism, worked example, trade-off, recap.
- Explain MHA, GQA, and MQA, including the quality/speed/memory trade-off.
- Explain the KV cache and why fewer key/value heads reduce inference memory bandwidth.
- Include math and shape reasoning, such as h_q / h_kv and a concrete 12 query heads / 4 KV heads = 3 queries per KV group example.
- Make the visualPlan explicit: diagrams for head layouts, grouped arrows, memory bars, equation transforms, and animation beats.
- Avoid shallow analogies unless they directly support the technical mechanism.`;
}
