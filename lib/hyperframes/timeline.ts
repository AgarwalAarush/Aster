import type { Storyboard } from "../education/schema";

export function renderTimelineScript(storyboard: Storyboard): string {
  const sceneDuration = storyboard.lesson.durationSeconds / storyboard.scenes.length;
  const sceneSteps = storyboard.scenes
    .map((scene, index) => {
      const sceneNumber = index + 1;
      const start = roundTime(index * sceneDuration);
      const outStart = roundTime(start + sceneDuration - 0.55);
      const beatSteps = scene.motionBeats
        .map((beat) => renderMotionBeat(sceneNumber, roundTime(start + beat.at), beat.type, beat.target))
        .join("\n");

      return `
      tl.from(".scene-${sceneNumber}", { opacity: 0, y: 80, scale: 0.96, duration: 0.7, ease: "power3.out" }, ${start});
      tl.from(".scene-${sceneNumber} .liquid-glass", { borderRadius: 90, filter: "blur(8px)", duration: 0.8, ease: "power2.out" }, ${start});
      tl.from(".scene-${sceneNumber} .diagram-svg", { opacity: 0, scale: 0.9, rotate: -2, duration: 0.65, ease: "power3.out" }, ${roundTime(start + 0.2)});
      ${beatSteps}
      tl.to(".scene-${sceneNumber}", { opacity: 0, y: -54, scale: 0.985, duration: 0.5, ease: "power2.in" }, ${outStart});`;
    })
    .join("\n");

  return `
    <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
    <script>
      function drawSVGPath(selector, duration) {
        document.querySelectorAll(selector).forEach((path) => {
          const length = typeof path.getTotalLength === "function" ? path.getTotalLength() : 700;
          path.style.strokeDasharray = length;
          path.style.strokeDashoffset = length;
        });
        return { strokeDashoffset: 0, duration, ease: "power2.out" };
      }

      const tl = gsap.timeline({ paused: true });
      tl.from(".question", { opacity: 0, y: -24, duration: 0.55 }, 0);
      tl.from(".lesson-title", { opacity: 0, y: -24, duration: 0.55 }, 0.08);
      tl.to(".blob-one", { x: 90, y: 40, scale: 1.08, rotate: 8, duration: ${storyboard.lesson.durationSeconds}, ease: "none" }, 0);
      tl.to(".blob-two", { x: -120, y: -64, scale: 0.94, rotate: -10, duration: ${storyboard.lesson.durationSeconds}, ease: "none" }, 0);
      ${sceneSteps}
      tl.set({}, {}, ${storyboard.lesson.durationSeconds});
      window.__timelines = window.__timelines || {};
      window.__timelines["aster-lesson"] = tl;
    </script>
  `;
}

function renderMotionBeat(
  sceneNumber: number,
  at: number,
  type: string,
  target: string,
): string {
  const scene = `.scene-${sceneNumber}`;

  if (type === "drawPath") {
    return `tl.to("${scene} .draw-line", drawSVGPath("${scene} .draw-line", 0.9), ${at});`;
  }

  if (type === "scatterParticles") {
    return `tl.from("${scene} .particle", { opacity: 0, scale: 0.2, stagger: 0.03, duration: 0.5, ease: "back.out(1.8)" }, ${at});`;
  }

  if (type === "transformEquation") {
    return `tl.from("${scene} .equation-step", { opacity: 0, y: 34, stagger: 0.16, duration: 0.42, ease: "power2.out" }, ${at});`;
  }

  if (type === "pulseNode") {
    return `tl.to("${scene} .glass-outline", { scale: 1.04, transformOrigin: "center", yoyo: true, repeat: 1, duration: 0.32, ease: "power2.inOut" }, ${at});`;
  }

  if (type === "morphBlob") {
    return `tl.to(".ambient-blob", { borderRadius: "38% 62% 44% 56% / 58% 40% 60% 42%", duration: 0.85, ease: "sine.inOut" }, ${at});`;
  }

  if (type === "revealText" || target === "keyLine") {
    return `tl.from("${scene} .key-line", { opacity: 0, y: 24, scale: 0.94, duration: 0.45, ease: "back.out(1.7)" }, ${at});`;
  }

  return `tl.from("${scene} .liquid-glass", { opacity: 0, x: -34, duration: 0.45, ease: "power2.out" }, ${at});`;
}

function roundTime(value: number): number {
  return Math.round(value * 100) / 100;
}
