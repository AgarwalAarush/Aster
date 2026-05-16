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
  return `Create a script-first technical education candidate for QA review.

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
    "learningObjective": "what the learner should understand"
  },
  "script": {
    "fullNarration": "complete spoken script, not bullet points",
    "sections": [
      {
        "kind": "motivation | background | mechanism | math | tradeoff | example | recap",
        "title": "section title",
        "narration": "spoken narration for this section",
        "visual": "concrete diagram or animation direction",
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
