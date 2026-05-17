import type { LectureLesson } from "../../education/loop/schema.ts";
import { DEFAULT_BOARD_LAYOUT, type BoardLayout, type LayoutId, type SplitRatio } from "./types.ts";

export function resolveBoardLayout(lesson: LectureLesson): BoardLayout {
  const raw = lesson.board.layout;
  if (!raw) {
    return DEFAULT_BOARD_LAYOUT;
  }
  return {
    id: raw.id as LayoutId,
    ratio: raw.ratio as SplitRatio | undefined,
    divider: raw.divider,
  };
}
