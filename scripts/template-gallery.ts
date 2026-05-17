import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { BoardAction, LectureLesson } from "../lib/education/loop/schema.ts";
import { generateWhiteboardHtml } from "../lib/hyperframes/whiteboard-composition.ts";
import { escapeHtml } from "../lib/hyperframes/util.ts";

type GalleryEntry = {
  id: string;
  title: string;
  lesson: LectureLesson;
  question?: string;
};

function padActions(primary: BoardAction[]): BoardAction[] {
  const filler: BoardAction[] = [
    { at: 50, kind: "write", targetId: "_pad1", content: ".", region: "center" },
    { at: 51, kind: "write", targetId: "_pad2", content: ".", region: "center" },
    { at: 52, kind: "write", targetId: "_pad3", content: ".", region: "center" },
    { at: 53, kind: "write", targetId: "_pad4", content: ".", region: "center" },
    { at: 54, kind: "write", targetId: "_pad5", content: ".", region: "center" },
  ];
  const merged = [...primary, ...filler].slice(0, Math.max(5, primary.length));
  return merged.map((a, i) => ({ ...a, at: i === 0 ? a.at : 50 + i }));
}

function baseLesson(
  title: string,
  actions: BoardAction[],
  layout?: LectureLesson["board"]["layout"],
): LectureLesson {
  return {
    id: `gallery-${title.toLowerCase().replace(/\s+/g, "-")}`,
    topic: {
      id: "gallery",
      title: "Template gallery",
      question: "Preview",
      domain: "ml-dl",
    },
    promptVariant: { id: "gallery", name: "Gallery" },
    metadata: { generator: "template-gallery", createdAt: new Date().toISOString() },
    lesson: {
      title,
      learnerLevel: "intermediate",
      durationSeconds: 60,
      payoff: "Preview template rendering for education whiteboard system",
      staircase: ["preview"],
      destination: "See rendered template",
    },
    narration: {
      fullText: "Gallery preview narration text long enough for schema validation requirements here.",
      beats: [
        { atSec: 0, text: "Gallery preview beat one", whyThisBeat: "Shows template" },
        { atSec: 20, text: "Gallery preview beat two", whyThisBeat: "Shows layout" },
        { atSec: 40, text: "Gallery preview beat three", whyThisBeat: "Shows style" },
      ],
    },
    board: {
      layout,
      actions: padActions(actions),
    },
  };
}

const ENTRIES: GalleryEntry[] = [
  {
    id: "layout-full",
    title: "Layout: full",
    lesson: baseLesson(
      "Layout — full",
      [{ at: 0, kind: "write", targetId: "t1", content: "Full pane content", region: "pane:full", writeStyle: "header" }],
      { id: "full" },
    ),
  },
  {
    id: "layout-split-50",
    title: "Layout: split 50/50 + divider",
    lesson: baseLesson(
      "Layout — split 50/50",
      [
        { at: 0, kind: "write", targetId: "left", content: "Left pane", region: "pane:left" },
        { at: 0, kind: "write", targetId: "right", content: "Right pane", region: "pane:right" },
      ],
      { id: "split-vertical", ratio: "50-50", divider: true },
    ),
  },
  {
    id: "layout-split-33",
    title: "Layout: split 33/67",
    lesson: baseLesson(
      "Layout — split 33/67",
      [
        { at: 0, kind: "write", targetId: "left", content: "Narrow left", region: "pane:left" },
        { at: 0, kind: "write", targetId: "right", content: "Wide right pane", region: "pane:right" },
      ],
      { id: "split-vertical", ratio: "33-67", divider: true },
    ),
  },
  {
    id: "write-body",
    title: "Write: body",
    lesson: baseLesson("Write — body", [
      { at: 0, kind: "write", targetId: "b1", content: "Body text at 38px", region: "pane:full", writeStyle: "body" },
    ]),
  },
  {
    id: "write-header",
    title: "Write: header",
    lesson: baseLesson("Write — header", [
      { at: 0, kind: "write", targetId: "h1", content: "Section header", region: "pane:full", writeStyle: "header" },
    ]),
  },
  {
    id: "write-equation",
    title: "Write: equation",
    lesson: baseLesson("Write — equation", [
      {
        at: 0,
        kind: "write",
        targetId: "eq1",
        content: "P(H \\mid E) = \\frac{P(E \\mid H) P(H)}{P(E)}",
        region: "pane:full",
        writeStyle: "equation",
      },
    ]),
  },
  {
    id: "box-graph",
    title: "Template: box-graph",
    lesson: baseLesson("Box graph (DAG)", [
      {
        at: 0,
        kind: "draw",
        targetId: "g1",
        content: "DAG",
        region: "pane:full",
        templateId: "box-graph",
        templateParams: {
          nodes: [
            { id: "a", label: "Prior" },
            { id: "b", label: "Likelihood" },
            { id: "c", label: "Posterior" },
          ],
          edges: [
            { from: "a", to: "b" },
            { from: "b", to: "c" },
          ],
          layout: "layered",
        },
      },
    ]),
  },
  {
    id: "flowchart",
    title: "Template: flowchart",
    lesson: baseLesson("Flowchart", [
      {
        at: 0,
        kind: "draw",
        targetId: "f1",
        content: "flow",
        region: "pane:full",
        templateId: "flowchart",
        templateParams: {
          nodes: [
            { id: "s", label: "Start" },
            { id: "e", label: "End" },
          ],
          edges: [{ from: "s", to: "e", label: "yes" }],
        },
      },
    ]),
  },
  {
    id: "bayes-net",
    title: "Template: bayes-net",
    lesson: baseLesson("Bayes net", [
      {
        at: 0,
        kind: "draw",
        targetId: "bn1",
        content: "bn",
        region: "pane:full",
        templateId: "bayes-net",
        templateParams: {
          nodes: [
            { id: "h", label: "H" },
            { id: "e", label: "E" },
            { id: "d", label: "D" },
          ],
          edges: [
            { from: "h", to: "e" },
            { from: "e", to: "d" },
          ],
        },
      },
    ]),
  },
  {
    id: "matrix-block",
    title: "Template: matrix-block",
    lesson: baseLesson("Matrix table", [
      {
        at: 0,
        kind: "draw",
        targetId: "mb1",
        content: "table",
        region: "pane:full",
        templateId: "matrix-block",
        templateParams: {
          title: "Confusion matrix",
          scale: "lg",
          highlightRows: [0],
          highlightCols: [0],
          highlightColor: "green",
          rows: [
            ["TP", "FN"],
            ["FP", "TN"],
          ],
        },
      },
    ]),
  },
  {
    id: "matrix-math",
    title: "Template: matrix-math (KaTeX)",
    lesson: baseLesson("Matrix math — small", [
      {
        at: 0,
        kind: "draw",
        targetId: "mm1",
        content: "math",
        region: "pane:full",
        templateId: "matrix-math",
        templateParams: {
          matrix: [
            ["\\alpha", "\\beta"],
            ["\\gamma", "\\delta"],
          ],
          brackets: "[]",
        },
      },
    ]),
  },
  {
    id: "matrix-math-large",
    title: "Template: matrix-math (large 8×8)",
    lesson: baseLesson("Matrix math — large", [
      {
        at: 0,
        kind: "draw",
        targetId: "mm8",
        content: "large matrix",
        region: "pane:full",
        templateId: "matrix-math",
        templateParams: {
          title: "8×8 weight block",
          scale: "lg",
          matrix: Array.from({ length: 8 }, (_, r) =>
            Array.from({ length: 8 }, (_, c) => `w_{${r}${c}}`),
          ),
          brackets: "[]",
        },
      },
    ]),
  },
  {
    id: "matrix-highlight",
    title: "Template: matrix highlights",
    lesson: baseLesson("Row/column highlights", [
      {
        at: 0,
        kind: "draw",
        targetId: "mh1",
        content: "highlights",
        region: "pane:full",
        templateId: "matrix-math",
        templateParams: {
          title: "Multiply: row × column",
          scale: "lg",
          highlightRows: [1],
          highlightCols: [2],
          highlightColor: "blue",
          matrix: [
            ["a", "b", "c", "d"],
            ["e", "f", "g", "h"],
            ["i", "j", "k", "l"],
            ["m", "n", "o", "p"],
          ],
        },
      },
    ]),
  },
  {
    id: "attention-mask",
    title: "Template: attention-mask (sliding window)",
    lesson: baseLesson("Sliding window attention", [
      {
        at: 0,
        kind: "draw",
        targetId: "attn1",
        content: "attention mask",
        region: "pane:full",
        templateId: "attention-mask",
        templateParams: {
          size: 32,
          windowRadius: 4,
          caption: "(b) Sliding window attention",
        },
      },
    ]),
  },
  {
    id: "matrix-multiply",
    title: "Template: matrix-multiply",
    lesson: baseLesson("Matrix multiply", [
      {
        at: 0,
        kind: "draw",
        targetId: "mx1",
        content: "multiply",
        region: "pane:full",
        templateId: "matrix-multiply",
        templateParams: {
          left: [["a", "b"]],
          right: [["x"], ["y"]],
          showResult: true,
        },
      },
    ]),
  },
  {
    id: "cartesian-plot",
    title: "Template: cartesian-plot",
    lesson: baseLesson("Cartesian plot", [
      {
        at: 0,
        kind: "draw",
        targetId: "cp1",
        content: "plot",
        region: "pane:full",
        templateId: "cartesian-plot",
        templateParams: {
          xLabel: "x",
          yLabel: "f(x)",
          series: [
            {
              points: [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
                { x: 2, y: 0.5 },
                { x: 3, y: 2 },
              ],
              style: "line",
            },
          ],
        },
      },
    ]),
  },
  {
    id: "probability-tree",
    title: "Template: probability-tree",
    lesson: baseLesson("Probability tree", [
      {
        at: 0,
        kind: "draw",
        targetId: "pt1",
        content: "tree",
        region: "pane:full",
        templateId: "probability-tree",
        templateParams: {
          levels: [
            { branches: [{ label: "H", prob: "0.01" }, { label: "¬H", prob: "0.99" }] },
            {
              branches: [
                { label: "E|H", prob: "0.99" },
                { label: "E|¬H", prob: "0.01" },
              ],
            },
          ],
        },
      },
    ]),
  },
  {
    id: "venn-2",
    title: "Template: venn-2",
    lesson: baseLesson("Venn (2)", [
      {
        at: 0,
        kind: "draw",
        targetId: "v2",
        content: "venn",
        region: "pane:full",
        templateId: "venn-2",
        templateParams: { leftLabel: "A", rightLabel: "B", intersection: "A∩B" },
      },
    ]),
  },
  {
    id: "venn-3",
    title: "Template: venn-3",
    lesson: baseLesson("Venn (3)", [
      {
        at: 0,
        kind: "draw",
        targetId: "v3",
        content: "venn",
        region: "pane:full",
        templateId: "venn-3",
        templateParams: { labels: ["A", "B", "C"], center: "A∩B∩C" },
      },
    ]),
  },
  {
    id: "dp-grid",
    title: "Template: dp-grid",
    lesson: baseLesson("DP grid", [
      {
        at: 0,
        kind: "draw",
        targetId: "dp1",
        content: "grid",
        region: "pane:full",
        templateId: "dp-grid",
        templateParams: {
          rows: 3,
          cols: 4,
          cells: [
            { r: 0, c: 0, text: "0" },
            { r: 2, c: 3, text: "ans", highlight: true },
          ],
        },
      },
    ]),
  },
  {
    id: "layer-graph",
    title: "Template: layer-graph",
    lesson: baseLesson("Layer graph (MLP)", [
      {
        at: 0,
        kind: "draw",
        targetId: "lg1",
        content: "mlp",
        region: "pane:full",
        templateId: "layer-graph",
        templateParams: {
          layers: [
            { size: 3, label: "input" },
            { size: 4, label: "hidden" },
            { size: 2, label: "output" },
          ],
        },
      },
    ]),
  },
  {
    id: "bar-chart",
    title: "Template: bar-chart",
    lesson: baseLesson("Bar chart", [
      {
        at: 0,
        kind: "draw",
        targetId: "bc1",
        content: "bars",
        region: "pane:full",
        templateId: "bar-chart",
        templateParams: {
          yLabel: "loss",
          bars: [
            { label: "train", value: 0.4 },
            { label: "val", value: 0.6 },
          ],
        },
      },
    ]),
  },
];

function buildGalleryPage(): string {
  const nav = ENTRIES.map(
    (e) => `<a href="#${escapeHtml(e.id)}">${escapeHtml(e.title)}</a>`,
  ).join("\n");

  const sections = ENTRIES.map((entry) => {
    const frame = generateWhiteboardHtml(entry.lesson, entry.question ?? "Gallery", {
      galleryMode: true,
    });
    const bodyMatch = frame.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const inner = bodyMatch?.[1] ?? frame;
    return `<section class="gallery-section" id="${escapeHtml(entry.id)}">
      <h2>${escapeHtml(entry.title)}</h2>
      <div class="gallery-frame">${inner}</div>
    </section>`;
  }).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Aster whiteboard template gallery</title>
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; background: #e8e6df; color: #1a1a1a; }
    header.gallery-nav { position: sticky; top: 0; z-index: 100; background: #fff; border-bottom: 1px solid #ccc; padding: 12px 24px; display: flex; flex-wrap: wrap; gap: 10px; }
    header.gallery-nav a { color: #2563eb; text-decoration: none; font-size: 14px; }
    header.gallery-nav a:hover { text-decoration: underline; }
    .gallery-section { padding: 32px 24px 48px; border-bottom: 1px solid #ccc; }
    .gallery-section h2 { margin: 0 0 16px; font-size: 22px; }
    .gallery-frame { overflow: auto; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); }
    .gallery-frame [data-composition-id] { transform: scale(0.5); transform-origin: top left; width: 1920px; height: 1080px; }
  </style>
</head>
<body>
  <header class="gallery-nav">${nav}</header>
  ${sections}
</body>
</html>`;
}

const outDir = join(process.cwd(), "generated", "template-gallery");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "index.html");
writeFileSync(outPath, buildGalleryPage(), "utf8");
console.log(`Wrote ${outPath}`);
