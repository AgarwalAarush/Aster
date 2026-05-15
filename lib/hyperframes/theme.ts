export function renderLiquidGlassTheme(): string {
  return `
    :root {
      --ink: #f7f7f2;
      --muted: rgba(247, 247, 242, 0.58);
      --line: rgba(247, 247, 242, 0.2);
      --glass: rgba(255, 255, 255, 0.075);
      --black: #030303;
    }

    body {
      margin: 0;
      background: var(--black);
      color: var(--ink);
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    [data-composition-id="aster-lesson"] {
      position: relative;
      width: 1920px;
      height: 1080px;
      overflow: hidden;
      background:
        radial-gradient(circle at 18% 18%, rgba(255,255,255,0.18), transparent 310px),
        radial-gradient(circle at 76% 24%, rgba(255,255,255,0.12), transparent 380px),
        radial-gradient(circle at 58% 78%, rgba(255,255,255,0.08), transparent 420px),
        linear-gradient(135deg, #020202 0%, #0b0b0c 46%, #151515 100%);
      isolation: isolate;
    }

    .grain {
      position: absolute;
      inset: 0;
      z-index: 12;
      opacity: 0.12;
      pointer-events: none;
      background-image:
        linear-gradient(0deg, transparent 0 50%, rgba(255,255,255,0.08) 50% 100%),
        linear-gradient(90deg, transparent 0 50%, rgba(255,255,255,0.05) 50% 100%);
      background-size: 5px 5px;
      mix-blend-mode: overlay;
    }

    .ambient-blob {
      position: absolute;
      border: 1px solid rgba(255,255,255,0.18);
      border-radius: 48% 52% 61% 39% / 45% 42% 58% 55%;
      background: linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.025));
      filter: blur(0.2px);
      box-shadow: inset 0 0 90px rgba(255,255,255,0.1), 0 40px 140px rgba(0,0,0,0.5);
    }

    .blob-one { width: 520px; height: 420px; left: 108px; top: 86px; opacity: 0.42; }
    .blob-two { width: 620px; height: 520px; right: 96px; bottom: 80px; opacity: 0.28; }

    .question {
      position: absolute;
      left: 74px;
      top: 62px;
      z-index: 3;
      max-width: 880px;
      margin: 0;
      color: var(--muted);
      font-size: 28px;
      letter-spacing: -0.02em;
    }

    .lesson-title {
      position: absolute;
      right: 76px;
      top: 58px;
      z-index: 3;
      max-width: 680px;
      margin: 0;
      text-align: right;
      font-family: Georgia, "Times New Roman", serif;
      font-size: 74px;
      line-height: 0.9;
      letter-spacing: -0.08em;
    }

    .scene {
      position: absolute;
      inset: 150px 72px 70px;
      z-index: 2;
      display: grid;
      grid-template-columns: 0.92fr 1.08fr;
      gap: 56px;
      align-items: center;
    }

    .liquid-glass {
      position: relative;
      min-height: 640px;
      padding: 54px;
      border: 1px solid var(--line);
      border-radius: 52px;
      background: linear-gradient(145deg, rgba(255,255,255,0.13), rgba(255,255,255,0.035));
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,0.24),
        inset 0 -80px 120px rgba(255,255,255,0.025),
        0 44px 150px rgba(0,0,0,0.48);
      backdrop-filter: blur(28px);
      overflow: hidden;
    }

    .liquid-glass::before {
      content: "";
      position: absolute;
      inset: 18px;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 40px;
      pointer-events: none;
    }

    .scene-index {
      margin: 0 0 26px;
      color: rgba(255,255,255,0.46);
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 0.34em;
      text-transform: uppercase;
    }

    .scene h2 {
      margin: 0;
      font-family: Georgia, "Times New Roman", serif;
      font-size: 82px;
      line-height: 0.9;
      letter-spacing: -0.075em;
    }

    .scene-copy {
      margin: 32px 0 0;
      color: var(--muted);
      font-size: 35px;
      line-height: 1.22;
      letter-spacing: -0.04em;
    }

    .key-line {
      display: inline-flex;
      margin-top: 42px;
      max-width: 680px;
      padding: 22px 30px;
      border: 1px solid rgba(255,255,255,0.28);
      border-radius: 999px;
      background: rgba(255,255,255,0.9);
      color: #050505;
      font-size: 34px;
      font-weight: 900;
      letter-spacing: -0.045em;
    }

    .diagram-stage {
      min-height: 640px;
      display: grid;
      place-items: center;
    }

    .diagram-svg {
      width: 100%;
      max-width: 920px;
      overflow: visible;
    }

    .diagram-label {
      fill: rgba(255,255,255,0.5);
      font-size: 28px;
      font-weight: 800;
      letter-spacing: 0.22em;
      text-transform: uppercase;
    }

    .diagram-value {
      fill: var(--ink);
      font-size: 38px;
      font-weight: 900;
      letter-spacing: -0.045em;
    }

    .diagram-big {
      fill: var(--ink);
      font-family: Georgia, "Times New Roman", serif;
      font-size: 116px;
      font-weight: 900;
      letter-spacing: -0.08em;
    }

    .centered { text-anchor: middle; }
    .glass-outline { fill: rgba(255,255,255,0.035); stroke: rgba(255,255,255,0.68); stroke-width: 2; }
    .glass-fill { fill: rgba(255,255,255,0.18); stroke: rgba(255,255,255,0.72); stroke-width: 2; filter: url(#soft-glow); }
    .draw-line { fill: none; stroke: rgba(255,255,255,0.82); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
    .particle { fill: rgba(255,255,255,0.72); filter: url(#soft-glow); }
  `;
}
