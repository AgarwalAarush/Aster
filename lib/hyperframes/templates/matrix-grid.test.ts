import { describe, expect, it } from "vitest";
import { renderAttentionMaskHtml } from "./attention-mask.ts";
import { renderMatrixBlockHtml } from "./matrix-block.ts";
import { renderMatrixGridHtml, slidingWindowCellIntensities } from "./matrix-grid.ts";
import { renderMatrixMathHtml } from "./matrix-math.ts";

describe("matrix-grid", () => {
  it("renders matrix-block table cells", () => {
    const html = renderMatrixBlockHtml({
      rows: [
        ["TP", "FN"],
        ["FP", "TN"],
      ],
      title: "Confusion",
    });
    expect(html).toContain("matrix-grid-table");
    expect(html).toContain("TP");
  });

  it("applies row and column highlights", () => {
    const html = renderMatrixGridHtml({
      rows: [
        ["1", "2"],
        ["3", "4"],
      ],
      highlightRows: [0],
      highlightCols: [1],
      highlightColor: "blue",
    });
    expect(html).toContain("color-mix");
  });

  it("renders large matrix-math as HTML grid", () => {
    const html = renderMatrixMathHtml({
      scale: "lg",
      matrix: Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => "x")),
    });
    expect(html).toContain("matrix-math-grid");
  });

  it("renders sliding window attention mask", () => {
    const html = renderAttentionMaskHtml({ size: 16, windowRadius: 3 });
    expect(html).toContain("attention-mask");
    const intensities = slidingWindowCellIntensities(16, 3);
    expect(intensities.length).toBeGreaterThan(16);
    expect(html).toContain("matrix-cell");
  });
});
