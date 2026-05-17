import type { BoardLayout } from "./layouts/types.ts";

export type Box = { top: string; left: string; width: string; height: string };

export type RegionContext = {
  layout?: BoardLayout;
};

const REGION_MAP: Record<string, Box> = {
  "top-left": { top: "0%", left: "0%", width: "50%", height: "50%" },
  "top-center": { top: "0%", left: "25%", width: "50%", height: "50%" },
  top: { top: "0%", left: "25%", width: "50%", height: "50%" },
  "top-right": { top: "0%", left: "50%", width: "50%", height: "50%" },
  "center-left": { top: "25%", left: "0%", width: "50%", height: "50%" },
  left: { top: "25%", left: "0%", width: "50%", height: "50%" },
  center: { top: "20%", left: "20%", width: "60%", height: "60%" },
  middle: { top: "20%", left: "20%", width: "60%", height: "60%" },
  "center-right": { top: "25%", left: "50%", width: "50%", height: "50%" },
  right: { top: "25%", left: "50%", width: "50%", height: "50%" },
  "bottom-left": { top: "50%", left: "0%", width: "50%", height: "50%" },
  "bottom-center": { top: "50%", left: "25%", width: "50%", height: "50%" },
  bottom: { top: "50%", left: "25%", width: "50%", height: "50%" },
  "bottom-right": { top: "50%", left: "50%", width: "50%", height: "50%" },
  "left-half": { top: "0%", left: "0%", width: "50%", height: "100%" },
  "right-half": { top: "0%", left: "50%", width: "50%", height: "100%" },
  "top-half": { top: "0%", left: "0%", width: "100%", height: "50%" },
  "bottom-half": { top: "50%", left: "0%", width: "100%", height: "50%" },
  "left-third": { top: "0%", left: "0%", width: "33.333%", height: "100%" },
  "right-two-thirds": { top: "0%", left: "33.333%", width: "66.667%", height: "100%" },
  full: { top: "5%", left: "5%", width: "90%", height: "90%" },
};

const FALLBACK: Box = { top: "5%", left: "5%", width: "90%", height: "90%" };

const PANE_INSET = "4%";

function paneFullBox(): Box {
  return {
    top: PANE_INSET,
    left: PANE_INSET,
    width: `calc(100% - 2 * ${PANE_INSET})`,
    height: `calc(100% - 2 * ${PANE_INSET})`,
  };
}

function paneLeftBox(layout?: BoardLayout): Box {
  const ratio = layout?.id === "split-vertical" ? (layout.ratio ?? "50-50") : "50-50";
  const width = ratio === "33-67" ? "33.333%" : "50%";
  return {
    top: PANE_INSET,
    left: PANE_INSET,
    width: `calc(${width} - ${PANE_INSET})`,
    height: `calc(100% - 2 * ${PANE_INSET})`,
  };
}

function paneRightBox(layout?: BoardLayout): Box {
  const ratio = layout?.id === "split-vertical" ? (layout.ratio ?? "50-50") : "50-50";
  const left = ratio === "33-67" ? "33.333%" : "50%";
  const width = ratio === "33-67" ? "66.667%" : "50%";
  return {
    top: PANE_INSET,
    left,
    width: `calc(${width} - ${PANE_INSET})`,
    height: `calc(100% - 2 * ${PANE_INSET})`,
  };
}

function resolvePaneRegion(key: string, ctx?: RegionContext): Box | null {
  const layout = ctx?.layout;
  switch (key) {
    case "pane:full":
    case "pane-full":
      return paneFullBox();
    case "pane:left":
    case "pane-left":
      return paneLeftBox(layout);
    case "pane:right":
    case "pane-right":
      return paneRightBox(layout);
    default:
      return null;
  }
}

export function regionToBox(region?: string, ctx?: RegionContext): Box {
  if (!region) {
    return REGION_MAP.center;
  }
  const key = region.toLowerCase();
  const pane = resolvePaneRegion(key, ctx);
  if (pane) {
    return pane;
  }
  return REGION_MAP[key] ?? FALLBACK;
}

export function regionToCssInline(region?: string, ctx?: RegionContext): string {
  const box = regionToBox(region, ctx);
  return `top: ${box.top}; left: ${box.left}; width: ${box.width}; height: ${box.height};`;
}
