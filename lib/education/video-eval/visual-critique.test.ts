import { describe, expect, it } from "vitest";
import {
  VISUAL_CRITERION_IDS,
  VISUAL_CRITERION_MAX,
  VISUAL_TOTAL_MAX,
  parseVisualCritiqueResponse,
  type VisualCriterionId,
} from "./visual-critique.ts";

function goldenReport() {
  const criteria = VISUAL_CRITERION_IDS.map((id: VisualCriterionId) => ({
    id,
    label: id,
    max: VISUAL_CRITERION_MAX[id],
    score: Math.floor(VISUAL_CRITERION_MAX[id] * 0.8),
    notes: "acceptable with minor issues noted here for testing",
  }));
  const totalScore = criteria.reduce((s, c) => s + c.score, 0);
  return {
    candidateId: "bayes-rule-v5-001",
    subjectId: "bayes-rule",
    promptVariantId: "whiteboard-v5-short",
    architecture: "baseline" as const,
    frameMode: "timeline" as const,
    criteria,
    totalScore,
    maxScore: VISUAL_TOTAL_MAX,
    percent: Math.round((totalScore / VISUAL_TOTAL_MAX) * 100),
    topThreeIssues: ["minor overlap at t20"],
    wouldRecommendForPipeline: true,
    summary: "Generally legible short lesson with one overlap frame. Diagram present and on-topic.",
  };
}

describe("parseVisualCritiqueResponse", () => {
  it("parses valid golden JSON", () => {
    const raw = JSON.stringify(goldenReport());
    const result = parseVisualCritiqueResponse(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.report.percent).toBeGreaterThan(0);
      expect(result.report.criteria).toHaveLength(VISUAL_CRITERION_IDS.length);
    }
  });
});
