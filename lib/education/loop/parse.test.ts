import { describe, expect, it } from "vitest";
import { extractJsonObject, parseLessonResponse } from "./parse.ts";

describe("extractJsonObject", () => {
  it("returns input unchanged when it is a balanced JSON object", () => {
    const json = `{"a":1,"b":{"c":2}}`;
    expect(extractJsonObject(json)).toBe(json);
  });

  it("strips a fenced code block", () => {
    const raw = "```json\n{\"a\":1}\n```";
    expect(extractJsonObject(raw)).toBe(`{"a":1}`);
  });

  it("recovers JSON after leading prose", () => {
    const raw = "Here is the lesson:\n{\"a\":1}\nThanks!";
    expect(extractJsonObject(raw)).toBe(`{"a":1}`);
  });

  it("handles nested braces and strings with braces inside", () => {
    const raw = "noise {\"text\": \"with } brace\", \"nested\": {\"x\": 1}} trailing";
    expect(extractJsonObject(raw)).toBe(`{"text": "with } brace", "nested": {"x": 1}}`);
  });

  it("returns null when no object is present", () => {
    expect(extractJsonObject("just prose")).toBeNull();
  });
});

describe("parseLessonResponse", () => {
  it("rejects missing JSON", () => {
    const result = parseLessonResponse("nothing useful");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("no-json-found");
    }
  });

  it("rejects malformed JSON", () => {
    const result = parseLessonResponse("{ this is not valid json }");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(["invalid-json", "schema-mismatch"]).toContain(result.reason);
    }
  });

  it("rejects JSON that does not match the lesson schema", () => {
    const result = parseLessonResponse(`{"unrelated":true}`);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("schema-mismatch");
    }
  });
});
