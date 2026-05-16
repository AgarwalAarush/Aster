export type CompositionArchitecture = "baseline" | "region-exclusive" | "templates";

export type WhiteboardCompositionOptions = {
  architecture?: CompositionArchitecture;
};

export const DEFAULT_COMPOSITION_OPTIONS: WhiteboardCompositionOptions = {
  architecture: "baseline",
};
