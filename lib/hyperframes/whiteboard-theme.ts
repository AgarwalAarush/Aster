export function renderWhiteboardTheme(): string {
  return `
    :root {
      --ink: #1a1a1a;
      --ink-muted: rgba(26, 26, 26, 0.6);
      --paper: #f7f6f0;
      --paper-tint: rgba(0, 0, 0, 0.02);
      --rule: rgba(0, 0, 0, 0.12);
      --highlight: rgba(255, 224, 102, 0.45);
      --highlight-edge: rgba(255, 180, 0, 0.6);
      --code-bg: #1e1e1e;
      --code-ink: #e8e8e8;
    }

    body {
      margin: 0;
      background: var(--paper);
      color: var(--ink);
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    [data-composition-id="aster-lesson"] {
      position: relative;
      width: 1920px;
      height: 1080px;
      overflow: hidden;
      background:
        radial-gradient(circle at 18% 28%, rgba(0, 0, 0, 0.025), transparent 480px),
        radial-gradient(circle at 78% 70%, rgba(0, 0, 0, 0.02), transparent 520px),
        var(--paper);
      isolation: isolate;
    }

    .lesson-header {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 100px;
      padding: 22px 60px 0;
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: center;
      gap: 32px;
      border-bottom: 2px solid var(--rule);
    }

    .question {
      margin: 0;
      font-size: 22px;
      color: var(--ink-muted);
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }

    .lesson-title {
      margin: 0;
      font-size: 38px;
      line-height: 1;
      font-weight: 700;
      letter-spacing: -0.01em;
      text-align: right;
    }

    .board {
      position: absolute;
      top: 110px;
      left: 60px;
      right: 60px;
      bottom: 200px;
      overflow: hidden;
    }

    .board-item {
      position: absolute;
      opacity: 0;
      padding: 12px 18px;
      box-sizing: border-box;
    }

    .board-item.kind-write {
      transform: translateY(12px);
    }

    .board-item.kind-draw {
      transform: scale(0.95);
    }

    .write-content {
      font-size: 38px;
      line-height: 1.25;
      color: var(--ink);
      letter-spacing: -0.005em;
      white-space: pre-wrap;
    }

    .draw-content {
      border: 2px dashed rgba(0, 0, 0, 0.4);
      background: var(--paper-tint);
      border-radius: 14px;
      padding: 22px 26px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .draw-tag {
      align-self: flex-start;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--ink-muted);
      background: rgba(0, 0, 0, 0.06);
      padding: 4px 10px;
      border-radius: 999px;
    }

    .draw-description {
      font-size: 26px;
      line-height: 1.35;
      color: var(--ink);
    }

    .board-item.kind-highlight {
      padding: 0;
    }

    .highlight-overlay {
      width: 100%;
      height: 100%;
      background: var(--highlight);
      mix-blend-mode: multiply;
      border: 3px solid var(--highlight-edge);
      border-radius: 8px;
    }

    .board-item.kind-transform,
    .board-item.kind-erase {
      display: none;
    }

    .narration-strip {
      position: absolute;
      bottom: 30px;
      left: 60px;
      right: 60px;
      height: 150px;
      padding: 24px 36px;
      background: rgba(255, 255, 255, 0.85);
      border-top: 2px solid var(--rule);
      border-radius: 20px;
    }

    .beat {
      position: absolute;
      inset: 24px 36px;
      margin: 0;
      font-size: 30px;
      line-height: 1.32;
      color: var(--ink);
      opacity: 0;
    }

    .code-deck {
      position: absolute;
      top: 130px;
      right: 80px;
      width: 720px;
      z-index: 5;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .code-block {
      margin: 0;
      padding: 22px 26px;
      background: var(--code-bg);
      color: var(--code-ink);
      border-radius: 12px;
      font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
      font-size: 18px;
      line-height: 1.45;
      opacity: 0;
      transform: translateX(40px);
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.18);
      white-space: pre;
      overflow-x: auto;
    }
  `;
}
