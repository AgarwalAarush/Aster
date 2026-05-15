import type { StoryboardScene } from "../education/schema";

export function renderDiagramSvg(scene: StoryboardScene, index: number): string {
  const title = escapeHtml(scene.diagram.label);
  const values = scene.diagram.values.map(escapeHtml);
  const id = `diagram-${index}`;

  switch (scene.diagram.type) {
    case "fractionBars":
      return wrapSvg(scene.diagram.type, id, `
        <text x="72" y="92" class="diagram-label">${title}</text>
        <rect class="glass-outline" x="88" y="180" width="560" height="92" rx="46" />
        <line class="draw-line" x1="368" y1="180" x2="368" y2="272" />
        <rect class="glass-fill" x="88" y="180" width="280" height="92" rx="46" />
        <text x="188" y="240" class="diagram-value">${values[1] ?? "1/2"}</text>
        <text x="468" y="240" class="diagram-value">${values[1] ?? "1/2"}</text>
        <text x="282" y="356" class="diagram-big">${values[2] ?? "2"}</text>
      `);
    case "equationTransform":
      return wrapSvg(scene.diagram.type, id, `
        <text x="72" y="92" class="diagram-label">${title}</text>
        ${values
          .slice(0, 3)
          .map(
            (value, valueIndex) => `
              <g class="equation-step equation-step-${valueIndex + 1}">
                <rect class="glass-outline" x="${88 + valueIndex * 300}" y="210" width="230" height="112" rx="34" />
                <text x="${203 + valueIndex * 300}" y="282" class="diagram-value centered">${value}</text>
              </g>
            `,
          )
          .join("")}
        <path class="draw-line" d="M326 266 C384 214 426 214 484 266" />
        <path class="draw-line" d="M626 266 C684 214 726 214 784 266" />
      `);
    case "particles":
      return wrapSvg(scene.diagram.type, id, `
        <text x="72" y="92" class="diagram-label">${title}</text>
        ${Array.from({ length: 18 }, (_, particleIndex) => {
          const x = 120 + (particleIndex % 6) * 118;
          const y = 170 + Math.floor(particleIndex / 6) * 86;
          return `<circle class="particle particle-${particleIndex + 1}" cx="${x}" cy="${y}" r="${12 + (particleIndex % 3) * 4}" />`;
        }).join("")}
      `);
    case "flow":
      return wrapSvg(scene.diagram.type, id, `
        <text x="72" y="92" class="diagram-label">${title}</text>
        ${values
          .slice(0, 3)
          .map(
            (value, valueIndex) => `
              <g class="flow-node flow-node-${valueIndex + 1}">
                <circle class="glass-outline" cx="${170 + valueIndex * 280}" cy="250" r="72" />
                <text x="${170 + valueIndex * 280}" y="260" class="diagram-value centered">${value}</text>
              </g>
            `,
          )
          .join("")}
        <path class="draw-line" d="M246 250 L374 250" />
        <path class="draw-line" d="M526 250 L654 250" />
      `);
    case "numberLine":
    case "comparison":
    case "orbit":
    case "wave":
    case "blankCanvas":
      return wrapSvg(scene.diagram.type, id, `
        <text x="72" y="92" class="diagram-label">${title}</text>
        <path class="draw-line" d="M102 306 C218 150 342 150 458 306 S698 462 814 306" />
        <circle class="glass-fill" cx="458" cy="306" r="74" />
        <text x="458" y="318" class="diagram-value centered">${values[0] ?? scene.onScreenText}</text>
      `);
  }
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function wrapSvg(type: StoryboardScene["diagram"]["type"], id: string, children: string): string {
  return `
    <svg class="diagram-svg diagram-${type}" id="${id}" viewBox="0 0 920 520" role="img" aria-hidden="true">
      <defs>
        <filter id="${id}-soft-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="9" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      ${children}
    </svg>
  `;
}
