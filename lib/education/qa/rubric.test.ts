import { describe, expect, it } from "vitest";
import { gradeScriptCandidate } from "./rubric";
import { gqaStrongCandidate, gqaWeakCandidate } from "./fixtures/gqa";
import { flashAttentionStrongCandidate, vaeLossStrongCandidate } from "./fixtures/ml";

describe("gradeScriptCandidate", () => {
  it("scores a strong GQA script materially higher than the shallow generated baseline", () => {
    const weak = gradeScriptCandidate(gqaWeakCandidate);
    const strong = gradeScriptCandidate(gqaStrongCandidate);

    expect(strong.percent).toBeGreaterThanOrEqual(85);
    expect(weak.percent).toBeLessThan(55);
    expect(strong.percent - weak.percent).toBeGreaterThanOrEqual(35);
  });

  it("penalizes missing GQA requirements that made the current video shallow", () => {
    const result = gradeScriptCandidate(gqaWeakCandidate);
    const failedIds = result.criteria.filter((criterion) => !criterion.passed).map((criterion) => criterion.id);

    expect(failedIds).toContain("gqa-mha-gqa-mqa");
    expect(failedIds).toContain("gqa-kv-cache");
    expect(failedIds).toContain("gqa-math");
    expect(failedIds).toContain("visual-specificity");
    expect(failedIds).toContain("duration");
  });

  it("returns actionable notes for prompt iteration", () => {
    const result = gradeScriptCandidate(gqaWeakCandidate);

    expect(result.recommendations.join(" ")).toContain("MHA");
    expect(result.recommendations.join(" ")).toContain("KV cache");
  });

  it("uses VAE-specific criteria for VAE loss scripts", () => {
    const result = gradeScriptCandidate(vaeLossStrongCandidate);

    expect(result.percent).toBeGreaterThanOrEqual(85);
    expect(result.criteria.map((criterion) => criterion.id)).toContain("vae-elbo");
    expect(result.criteria.map((criterion) => criterion.id)).not.toContain("gqa-mha-gqa-mqa");
  });

  it("uses FlashAttention-specific criteria for FlashAttention scripts", () => {
    const result = gradeScriptCandidate(flashAttentionStrongCandidate);

    expect(result.percent).toBeGreaterThanOrEqual(85);
    expect(result.criteria.map((criterion) => criterion.id)).toContain("flash-online-softmax");
    expect(result.criteria.map((criterion) => criterion.id)).not.toContain("gqa-mha-gqa-mqa");
  });
});
