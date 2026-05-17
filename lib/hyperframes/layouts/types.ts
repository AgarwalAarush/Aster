export type LayoutId = "full" | "split-vertical";
export type SplitRatio = "50-50" | "33-67";

export type BoardLayout = {
  id: LayoutId;
  ratio?: SplitRatio;
  divider?: boolean;
};

export const DEFAULT_BOARD_LAYOUT: BoardLayout = { id: "full" };
