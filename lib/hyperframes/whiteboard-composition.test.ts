import { describe, expect, it } from "vitest";
import type { LectureLesson } from "../education/loop/schema.ts";
import { generateWhiteboardHtml } from "./whiteboard-composition.ts";

function makeLesson(overrides: Partial<LectureLesson> = {}): LectureLesson {
  return {
    id: "test-lesson-001",
    topic: {
      id: "test",
      title: "Test Topic",
      question: "Why?",
      domain: "ml-dl",
    },
    promptVariant: { id: "whiteboard-v2", name: "v2" },
    metadata: { generator: "test", createdAt: "2026-05-15T00:00:00Z" },
    lesson: {
      title: "A <Test> Title",
      learnerLevel: "intro learners",
      durationSeconds: 120,
      payoff: "A concrete payoff that matters with stakes",
      staircase: ["rung one", "rung two"],
      destination: "You will hold the formula F = ma after this lesson ends",
    },
    narration: {
      fullText: "narration fulltext sufficiently long to satisfy schema minimum length",
      beats: [
        { atSec: 0, text: "first beat goes here", whyThisBeat: "intro rung one" },
        { atSec: 30, text: "second beat goes here", whyThisBeat: "intro rung two" },
        { atSec: 90, text: "third beat goes here", whyThisBeat: "wrap rung two" },
      ],
    },
    board: {
      actions: [
        { at: 0, kind: "write", targetId: "title_lbl", content: "Hello & welcome", region: "top-left" },
        { at: 10, kind: "draw", targetId: "diagram_1", content: "two circles labeled A B", region: "center" },
        { at: 30, kind: "highlight", targetId: "title_lbl", content: "underline in red", region: "top-left" },
        { at: 60, kind: "transform", targetId: "diagram_1", content: "circles with arrows", region: "center" },
        { at: 100, kind: "erase", targetId: "diagram_1", content: "diagram_1", region: "center" },
      ],
    },
    ...overrides,
  };
}

describe("generateWhiteboardHtml", () => {
  it("preserves the Hyperframes root contract", () => {
    const html = generateWhiteboardHtml(makeLesson(), "Why?");
    expect(html).toContain('id="root"');
    expect(html).toContain('data-composition-id="aster-lesson"');
    expect(html).toContain('data-start="0"');
    expect(html).toContain('data-width="1920"');
    expect(html).toContain('data-height="1080"');
    expect(html).toContain('window.__timelines["aster-lesson"] = tl');
  });

  it("emits one board-item per action with data-action-index", () => {
    const html = generateWhiteboardHtml(makeLesson(), "Why?");
    for (let i = 0; i < 5; i += 1) {
      expect(html).toContain(`data-action-index="${i}"`);
    }
  });

  it("emits one beat per narration beat with data-beat-index", () => {
    const html = generateWhiteboardHtml(makeLesson(), "Why?");
    expect(html).toContain('data-beat-index="0"');
    expect(html).toContain('data-beat-index="1"');
    expect(html).toContain('data-beat-index="2"');
  });

  it("escapes HTML in lesson content", () => {
    const html = generateWhiteboardHtml(makeLesson(), "Why?");
    expect(html).toContain("A &lt;Test&gt; Title");
    expect(html).toContain("Hello &amp; welcome");
  });

  it("omits the code deck element when codeBlocks is absent", () => {
    const html = generateWhiteboardHtml(makeLesson(), "Why?");
    expect(html).not.toContain('id="code-deck"');
    expect(html).not.toContain('data-block-index="0"');
  });

  it("emits a code-block per entry when codeBlocks is present", () => {
    const lesson = makeLesson({
      codeBlocks: [
        { atSec: 40, language: "python", code: "print('hi')", purpose: "shows print works" },
        { atSec: 80, language: "python", code: "x = 1 + 2", purpose: "shows arithmetic" },
      ],
    });
    const html = generateWhiteboardHtml(lesson, "Why?");
    expect(html).toContain('id="code-deck"');
    expect(html).toContain('data-block-index="0"');
    expect(html).toContain('data-block-index="1"');
    expect(html).toContain("print(&#39;hi&#39;)");
  });

  it("ends the timeline at durationSeconds", () => {
    const html = generateWhiteboardHtml(makeLesson(), "Why?");
    expect(html).toContain("tl.set({}, {}, 120);");
  });

  it("emits region-exclusive hide ops when architecture is region-exclusive", () => {
    const html = generateWhiteboardHtml(makeLesson(), "Why?", {
      architecture: "region-exclusive",
    });
    expect(html).toContain('data-region="center"');
    expect(html).toContain("data-region=");
  });

  it("emits a transformTarget call for transform actions", () => {
    const html = generateWhiteboardHtml(makeLesson(), "Why?");
    expect(html).toContain("transformTarget(");
    expect(html).toContain('[data-action-id="diagram_1"]');
  });

  it("emits a positionHighlight call for highlight actions", () => {
    const html = generateWhiteboardHtml(makeLesson(), "Why?");
    expect(html).toContain("positionHighlight(");
  });

  it("emits layout chrome when board.layout is set", () => {
    const base = makeLesson();
    const lesson = makeLesson({
      board: {
        layout: { id: "split-vertical", ratio: "50-50", divider: true },
        actions: base.board.actions,
      },
    });
    const html = generateWhiteboardHtml(lesson, "Why?");
    expect(html).toContain("board-layout-chrome");
    expect(html).toContain("layout-divider");
  });

  it("renders katex for equation writeStyle", () => {
    const lesson = makeLesson({
      board: {
        actions: [
          {
            at: 0,
            kind: "write",
            targetId: "eq",
            content: "E = mc^2",
            region: "center",
            writeStyle: "equation",
          },
          { at: 10, kind: "write", targetId: "p2", content: ".", region: "center" },
          { at: 11, kind: "write", targetId: "p3", content: ".", region: "center" },
          { at: 12, kind: "write", targetId: "p4", content: ".", region: "center" },
          { at: 13, kind: "write", targetId: "p5", content: ".", region: "center" },
        ],
      },
    });
    const html = generateWhiteboardHtml(lesson, "Why?");
    expect(html).toContain("katex");
    expect(html).toContain("write-equation");
  });
});
