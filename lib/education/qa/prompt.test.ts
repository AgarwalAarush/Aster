import { describe, expect, it } from "vitest";
import { buildScriptQaPrompt } from "./prompt";

describe("buildScriptQaPrompt", () => {
  it("asks for a script-first technical lesson with duration, math, and visual planning", () => {
    const prompt = buildScriptQaPrompt({
      topicTitle: "Grouped Query Attention",
      question: "What is GQA and why do LLMs use it?",
      targetDurationSeconds: 150,
    });

    expect(prompt).toContain("90-180 seconds");
    expect(prompt).toContain("fullNarration");
    expect(prompt).toContain("MHA");
    expect(prompt).toContain("GQA");
    expect(prompt).toContain("MQA");
    expect(prompt).toContain("KV cache");
    expect(prompt).toContain("math");
    expect(prompt).toContain("visualPlan");
    expect(prompt).toContain("payoff");
    expect(prompt).toContain("staircase");
    expect(prompt).toContain("destination");
    expect(prompt).toContain("whyThisBeat");
    expect(prompt).toContain("one idea, one visual");
  });
});
