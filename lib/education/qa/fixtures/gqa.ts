import type { ScriptCandidate } from "../candidate";

export const gqaWeakCandidate: ScriptCandidate = {
  id: "gqa-weak",
  topic: {
    id: "gqa",
    title: "Grouped Query Attention",
    question: "What is grouped query attention?",
  },
  promptVariant: {
    id: "baseline-compact-storyboard",
    name: "Baseline compact storyboard",
    prompt: "Create a visual-first educational video storyboard with four short scenes.",
  },
  metadata: {
    runner: "fixture",
    model: "baseline",
    createdAt: "2026-05-15T00:00:00.000Z",
  },
  lesson: {
    title: "Understanding Grouped Query Attention",
    learnerLevel: "Intermediate machine learning enthusiasts",
    targetDurationSeconds: 90,
    learningObjective: "Describe that grouped query attention divides queries into smaller groups.",
  },
  script: {
    fullNarration:
      "Imagine a large puzzle being solved by multiple small teams, each focusing on one part. Grouped query attention works similarly by splitting queries into groups for focused processing. Grouped query attention splits all queries into smaller groups, allowing each group to attend independently to keys and values. For example, if we have 12 queries split into 3 groups of 4, each group attends to relevant keys and values. Grouped query attention improves efficiency by dividing queries into groups that attend separately.",
    sections: [
      {
        kind: "motivation",
        title: "Teams solving puzzles",
        narration:
          "Imagine a large puzzle being solved by multiple small teams, each focusing on one part.",
        visual: "Several small puzzle pieces fit together inside a liquid-glass frame.",
        estimatedSeconds: 20,
      },
      {
        kind: "mechanism",
        title: "Dividing queries into groups",
        narration:
          "Grouped query attention splits all queries into smaller groups, allowing each group to attend independently to keys and values.",
        visual: "Three glass bubbles each contain four dots.",
        estimatedSeconds: 25,
      },
      {
        kind: "example",
        title: "Twelve queries",
        narration:
          "For example, if we have 12 queries split into 3 groups of 4, each group attends to keys and values.",
        visual: "Twelve dots become three groups.",
        estimatedSeconds: 20,
      },
    ],
  },
  visualPlan: [
    {
      sceneTitle: "Queries become groups",
      diagram: "particles",
      animation: "Dots move into three bubbles.",
    },
  ],
};

export const gqaStrongCandidate: ScriptCandidate = {
  id: "gqa-strong",
  topic: {
    id: "gqa",
    title: "Grouped Query Attention",
    question: "What is grouped query attention, and why do LLMs use it?",
  },
  promptVariant: {
    id: "technical-script-v1",
    name: "Technical script-first prompt v1",
    prompt:
      "Create a 90-180 second technical lesson with fullNarration, section narration, equations, trade-offs, and visualPlan.",
  },
  metadata: {
    runner: "fixture",
    model: "golden",
    createdAt: "2026-05-15T00:00:00.000Z",
  },
  lesson: {
    title: "Grouped Query Attention: the KV Cache Middle Ground",
    learnerLevel: "ML engineers learning transformer inference",
    targetDurationSeconds: 150,
    learningObjective:
      "Explain how GQA reduces KV cache memory by sharing key/value heads across groups of query heads while preserving more quality than MQA.",
  },
  script: {
    fullNarration:
      "At inference time, a transformer does not recompute every past token from scratch. It stores key and value vectors in the KV cache, then each new query head reads from that cache. Standard multi-head attention, or MHA, gives every query head its own key and value head, which is flexible but expensive because the KV cache grows with the number of KV heads. Multi-query attention, or MQA, goes to the other extreme: all query heads share one key head and one value head, which is fast and memory efficient but can lose quality because every head must read through the same KV channel. Grouped query attention, or GQA, is the middle ground. If a layer has 12 query heads and 4 key/value heads, the grouping ratio is h_q divided by h_kv, so 12 / 4 = 3. Each KV head serves a group of three query heads. The attention computation still forms Q times K transpose, but there are fewer K and V streams to cache and load. Visually, MHA looks like 12 query lanes each paired with its own KV lane. GQA bundles those 12 query lanes into four groups, with three query lanes sharing each KV lane. MQA bundles all 12 query lanes into one shared KV lane. The trade-off is clear: MHA maximizes per-head expressiveness, MQA minimizes memory, and GQA keeps much of MHA's diversity while cutting KV cache memory by the grouping ratio. In our 12-to-4 example, the KV cache for keys and values is roughly one third of MHA for that layer. That is why modern LLMs use GQA: faster decoding and lower memory bandwidth without collapsing all heads into a single shared key/value view.",
    sections: [
      {
        kind: "motivation",
        title: "Why the KV cache matters",
        narration:
          "At inference time, a transformer stores key and value vectors in the KV cache so the next token can attend to previous tokens without recomputing them.",
        visual: "A memory bar labeled KV cache grows as tokens are generated.",
        estimatedSeconds: 22,
      },
      {
        kind: "background",
        title: "MHA is flexible but expensive",
        narration:
          "Multi-head attention gives every query head its own key and value head, so the cache size grows with the number of KV heads.",
        visual: "Twelve query lanes connect to twelve separate key/value lanes.",
        estimatedSeconds: 24,
      },
      {
        kind: "tradeoff",
        title: "MQA is the opposite extreme",
        narration:
          "Multi-query attention lets all query heads share one key/value head, saving memory but forcing every head through the same KV channel.",
        visual: "Twelve query lanes squeeze into one shared key/value lane.",
        estimatedSeconds: 22,
      },
      {
        kind: "mechanism",
        title: "GQA groups query heads",
        narration:
          "Grouped query attention keeps many query heads but fewer key/value heads. With 12 query heads and 4 KV heads, each KV head serves a group of three query heads.",
        visual: "Twelve Q nodes cluster into four groups, each pointing at one KV node.",
        estimatedSeconds: 30,
      },
      {
        kind: "math",
        title: "The grouping ratio",
        narration:
          "The grouping ratio is h_q divided by h_kv. In the example, 12 / 4 = 3, so the KV cache is roughly one third of the MHA cache for keys and values.",
        visual: "Equation h_q / h_kv transforms into 12 / 4 = 3, then a memory bar shrinks to one third.",
        estimatedSeconds: 28,
      },
      {
        kind: "recap",
        title: "The middle ground",
        narration:
          "MHA maximizes flexibility, MQA minimizes KV memory, and GQA balances the two by sharing KV heads within groups.",
        visual: "A spectrum diagram animates from MHA to GQA to MQA.",
        estimatedSeconds: 20,
      },
    ],
  },
  visualPlan: [
    {
      sceneTitle: "Inference bottleneck",
      diagram: "memory bars",
      animation: "KV cache bars grow with token count and KV head count.",
    },
    {
      sceneTitle: "MHA versus GQA versus MQA",
      diagram: "head comparison",
      animation: "Query lanes reorganize from 12-to-12, to 12-to-4, to 12-to-1.",
    },
    {
      sceneTitle: "Grouping math",
      diagram: "equation transform",
      animation: "h_q / h_kv becomes 12 / 4 = 3 and shrinks the cache bar.",
    },
  ],
};
