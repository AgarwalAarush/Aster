import katex from "katex";

export type EquationDisplay = "inline" | "block";

export function renderKatexHtml(latex: string, displayMode: EquationDisplay = "block"): string {
  try {
    return katex.renderToString(latex, {
      displayMode: displayMode === "block",
      throwOnError: false,
      strict: "ignore",
      trust: false,
    });
  } catch {
    return latex;
  }
}

export function renderKatexStylesheetLink(): string {
  return `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css" crossorigin="anonymous" />`;
}

export function matrixToLatex(rows: string[][], brackets: "()" | "[]" = "()"): string {
  const env = brackets === "[]" ? "bmatrix" : "pmatrix";
  const body = rows.map((row) => row.join(" & ")).join(" \\\\ ");
  return `\\begin{${env}} ${body} \\end{${env}}`;
}
