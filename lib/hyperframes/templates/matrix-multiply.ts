import { matrixToLatex, renderKatexHtml } from "../primitives/katex.ts";

export type MatrixMultiplyParams = {
  left: string[][];
  right: string[][];
  showResult?: boolean;
  result?: string[][];
};

function multiplySymbolic(left: string[][], right: string[][]): string[][] | null {
  if (left[0]?.length !== right.length) {
    return null;
  }
  const rows = left.length;
  const cols = right[0]?.length ?? 0;
  const out: string[][] = [];
  for (let i = 0; i < rows; i += 1) {
    const row: string[] = [];
    for (let j = 0; j < cols; j += 1) {
      const terms: string[] = [];
      for (let k = 0; k < right.length; k += 1) {
        const a = left[i]?.[k];
        const b = right[k]?.[j];
        if (a && b) {
          terms.push(`${a}${b}`);
        }
      }
      row.push(terms.join("+") || "0");
    }
    out.push(row);
  }
  return out;
}

export function renderMatrixMultiplyHtml(params: MatrixMultiplyParams): string {
  const left = params.left.slice(0, 6).map((r) => r.slice(0, 6));
  const right = params.right.slice(0, 6).map((r) => r.slice(0, 6));
  const result = params.showResult
    ? (params.result ?? multiplySymbolic(left, right) ?? [["?"]])
    : null;

  const parts = [
    `<div class="katex-block">${renderKatexHtml(matrixToLatex(left), "block")}</div>`,
    `<div class="katex-op">${renderKatexHtml("\\times", "block")}</div>`,
    `<div class="katex-block">${renderKatexHtml(matrixToLatex(right), "block")}</div>`,
  ];
  if (result) {
    parts.push(`<div class="katex-op">${renderKatexHtml("=", "block")}</div>`);
    parts.push(`<div class="katex-block">${renderKatexHtml(matrixToLatex(result), "block")}</div>`);
  }

  return `<div class="template-diagram matrix-multiply"><div class="matrix-multiply-row">${parts.join("")}</div></div>`;
}
