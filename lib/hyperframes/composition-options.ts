export type CompositionArchitecture = "baseline" | "region-exclusive" | "templates";

export type WhiteboardCompositionOptions = {
  architecture?: CompositionArchitecture;
  /** When true, all board items and beats render visible (for static gallery). */
  galleryMode?: boolean;
};

export const DEFAULT_COMPOSITION_OPTIONS: WhiteboardCompositionOptions = {
  architecture: "baseline",
  galleryMode: false,
};
