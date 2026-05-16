export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function escapeHtmlAttr(value: string): string {
  return escapeHtml(value);
}

export function roundTime(value: number): number {
  return Math.round(value * 100) / 100;
}
