type Box = { top: string; left: string; width: string; height: string };

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
  full: { top: "5%", left: "5%", width: "90%", height: "90%" },
};

const FALLBACK: Box = { top: "5%", left: "5%", width: "90%", height: "90%" };

export function regionToBox(region?: string): Box {
  if (!region) {
    return REGION_MAP.center;
  }
  return REGION_MAP[region.toLowerCase()] ?? FALLBACK;
}

export function regionToCssInline(region?: string): string {
  const box = regionToBox(region);
  return `top: ${box.top}; left: ${box.left}; width: ${box.width}; height: ${box.height};`;
}
