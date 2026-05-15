import type { ScenePlan } from "../education/schema";

const WIDTH = 1920;
const HEIGHT = 1080;
const COMPOSITION_ID = "aster-lesson";

export function generateCompositionHtml(plan: ScenePlan, question: string): string {
  const sceneDuration = plan.durationSeconds / plan.scenes.length;
  const sceneClips = plan.scenes
    .map((scene, index) => {
      const start = roundTime(index * sceneDuration);
      const duration = roundTime(sceneDuration);

      return `
        <section class="clip scene-card scene-${index + 1}" data-start="${start}" data-duration="${duration}" data-track-index="${index}">
          <p class="scene-kicker">Scene ${index + 1}</p>
          <h2>${escapeHtml(scene.title)}</h2>
          <p class="visual">${escapeHtml(scene.visual)}</p>
        </section>
        <p class="clip narration narration-${index + 1}" data-start="${start + 0.35}" data-duration="${Math.max(1, duration - 0.7)}" data-track-index="${index + 10}">
          ${escapeHtml(scene.narration)}
        </p>
        <div class="clip emphasis emphasis-${index + 1}" data-start="${start + duration - 1.8}" data-duration="1.55" data-track-index="${index + 20}">
          ${escapeHtml(scene.emphasis)}
        </div>`;
    })
    .join("\n");

  const timelineSteps = plan.scenes
    .map((_, index) => {
      const start = roundTime(index * sceneDuration);

      return `
    tl.from(".scene-${index + 1}", { opacity: 0, y: 90, scale: 0.94, duration: 0.65, ease: "power3.out" }, ${start});
    tl.from(".narration-${index + 1}", { opacity: 0, y: 36, duration: 0.45, ease: "power2.out" }, ${start + 0.35});
    tl.from(".emphasis-${index + 1}", { opacity: 0, y: 24, scale: 0.92, duration: 0.35, ease: "back.out(1.8)" }, ${roundTime(start + sceneDuration - 1.8)});
    tl.to(".scene-${index + 1}", { opacity: 0, y: -60, scale: 0.98, duration: 0.45, ease: "power2.in" }, ${roundTime(start + sceneDuration - 0.45)});`;
    })
    .join("\n");

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(plan.title)}</title>
    <style>
      body {
        margin: 0;
        background: #080a0f;
        color: #fff7ed;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      [data-composition-id="${COMPOSITION_ID}"] {
        position: relative;
        width: ${WIDTH}px;
        height: ${HEIGHT}px;
        overflow: hidden;
        background:
          radial-gradient(circle at 18% 14%, rgba(255, 191, 105, 0.28), transparent 360px),
          radial-gradient(circle at 80% 20%, rgba(96, 165, 250, 0.24), transparent 420px),
          linear-gradient(135deg, #070910 0%, #111827 55%, #2a1607 100%);
      }

      .grain {
        position: absolute;
        inset: 0;
        opacity: 0.13;
        background-image:
          linear-gradient(0deg, transparent 0 50%, rgba(255,255,255,0.08) 50% 100%),
          linear-gradient(90deg, transparent 0 50%, rgba(255,255,255,0.05) 50% 100%);
        background-size: 6px 6px;
      }

      .question {
        position: absolute;
        top: 64px;
        left: 76px;
        max-width: 1120px;
        color: rgba(255, 247, 237, 0.72);
        font-size: 34px;
        line-height: 1.25;
        letter-spacing: -0.02em;
      }

      .lesson-title {
        position: absolute;
        right: 80px;
        top: 74px;
        max-width: 520px;
        text-align: right;
        font-size: 58px;
        line-height: 0.95;
        letter-spacing: -0.06em;
      }

      .scene-card {
        position: absolute;
        left: 130px;
        top: 245px;
        width: 720px;
        min-height: 420px;
        padding: 54px;
        border: 1px solid rgba(255, 247, 237, 0.2);
        border-radius: 42px;
        background: rgba(255, 247, 237, 0.09);
        box-shadow: 0 36px 110px rgba(0, 0, 0, 0.35);
      }

      .scene-kicker {
        margin: 0 0 26px;
        color: #fbbf24;
        font-size: 24px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
      }

      h2 {
        margin: 0;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 82px;
        line-height: 0.94;
        letter-spacing: -0.07em;
      }

      .visual {
        margin: 34px 0 0;
        color: rgba(255, 247, 237, 0.72);
        font-size: 34px;
        line-height: 1.25;
      }

      .narration {
        position: absolute;
        left: 930px;
        top: 350px;
        width: 760px;
        margin: 0;
        font-size: 48px;
        line-height: 1.18;
        letter-spacing: -0.035em;
      }

      .emphasis {
        position: absolute;
        left: 930px;
        bottom: 230px;
        width: fit-content;
        max-width: 790px;
        padding: 24px 34px;
        border-radius: 999px;
        background: #fbbf24;
        color: #211405;
        font-size: 36px;
        font-weight: 800;
        letter-spacing: -0.03em;
      }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="${COMPOSITION_ID}" data-start="0" data-width="${WIDTH}" data-height="${HEIGHT}">
      <div class="grain"></div>
      <p class="question">Question: ${escapeHtml(question)}</p>
      <h1 class="lesson-title">${escapeHtml(plan.title)}</h1>
      ${sceneClips}
    </div>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
    <script>
      const tl = gsap.timeline({ paused: true });
      tl.from(".question", { opacity: 0, y: -30, duration: 0.55 }, 0);
      tl.from(".lesson-title", { opacity: 0, y: -30, duration: 0.55 }, 0.12);
      ${timelineSteps}
      tl.set({}, {}, ${plan.durationSeconds});
      window.__timelines = window.__timelines || {};
      window.__timelines["${COMPOSITION_ID}"] = tl;
    </script>
  </body>
</html>`;
}

function roundTime(value: number): number {
  return Math.round(value * 100) / 100;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
