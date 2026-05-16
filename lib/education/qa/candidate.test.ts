import { describe, expect, it } from "vitest";
import { parseScriptCandidate } from "./candidate";

const completeCandidate = {
  id: "gqa-strong-001",
  topic: {
    id: "gqa",
    title: "Grouped Query Attention",
    question: "What is grouped query attention?",
  },
  promptVariant: {
    id: "technical-lesson-v1",
    name: "Technical lesson prompt v1",
    prompt: "Create a deep script-first lesson.",
  },
  metadata: {
    runner: "in-cursor-agent",
    model: "gpt-5.5",
    createdAt: "2026-05-15T00:00:00.000Z",
  },
  lesson: {
    title: "Grouped Query Attention",
    learnerLevel: "ML engineers",
    targetDurationSeconds: 150,
    learningObjective:
      "Explain why GQA trades a small amount of attention flexibility for lower KV cache memory.",
  },
  script: {
    fullNarration:
      "Transformer attention uses query heads to look up key and value heads. Multi-head attention gives every query head its own KV heads, while grouped query attention shares fewer KV heads across groups.",
    sections: [
      {
        kind: "motivation",
        title: "Why KV cache matters",
        narration: "During decoding, every generated token stores keys and values in the KV cache.",
        visual: "Memory bars grow with each token.",
        estimatedSeconds: 24,
      },
      {
        kind: "mechanism",
        title: "Group query heads",
        narration: "Twelve query heads can share four KV heads, so each KV head serves a group of three query heads.",
        visual: "Twelve Q nodes connect into four KV groups.",
        estimatedSeconds: 36,
      },
      {
        kind: "math",
        title: "The cache reduction",
        narration: "The grouping ratio is query heads divided by KV heads, so 12 / 4 = 3.",
        visual: "Equation transforms from h_q / h_kv to 12 / 4.",
        estimatedSeconds: 30,
      },
    ],
  },
  visualPlan: [
    {
      sceneTitle: "MHA to GQA to MQA",
      diagram: "comparison",
      animation: "Slide from many KV heads, to grouped KV heads, to one KV head.",
    },
  ],
};

describe("parseScriptCandidate", () => {
  it("accepts a complete storyboard and script candidate for QA grading", () => {
    const candidate = parseScriptCandidate(completeCandidate);

    expect(candidate.id).toBe("gqa-strong-001");
    expect(candidate.lesson.targetDurationSeconds).toBe(150);
    expect(candidate.script.sections[1]?.kind).toBe("mechanism");
    expect(candidate.visualPlan[0]?.diagram).toBe("comparison");
  });

  it("rejects candidates that are too short for script-first QA", () => {
    expect(() =>
      parseScriptCandidate({
        ...completeCandidate,
        lesson: {
          ...completeCandidate.lesson,
          targetDurationSeconds: 30,
        },
      }),
    ).toThrow();
  });

  it("accepts concrete diagram descriptions from agent-generated visual plans", () => {
    const candidate = parseScriptCandidate({
      ...completeCandidate,
      visualPlan: [
        {
          sceneTitle: "Score matrix bottleneck",
          diagram:
            "Q times K transpose producing a large N by N score grid with memory readouts and tile boundaries.",
          animation: "The grid expands as N increases, then tile boundaries snap into place.",
        },
      ],
    });

    expect(candidate.visualPlan[0]?.diagram).toContain("N by N score grid");
  });

  it("rejects candidates without prompt provenance", () => {
    const withoutPrompt: Partial<typeof completeCandidate> = { ...completeCandidate };
    delete withoutPrompt.promptVariant;

    expect(() => parseScriptCandidate(withoutPrompt)).toThrow();
  });
});
