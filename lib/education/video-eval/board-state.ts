import type { BoardAction, LectureLesson } from "../loop/schema.ts";
import { regionToBox } from "../../hyperframes/regions.ts";

export type ActiveBoardAction = {
  index: number;
  at: number;
  kind: BoardAction["kind"];
  targetId: string;
  region: string;
  contentPreview: string;
};

function normalizeRegion(region?: string): string {
  return (region ?? "center").toLowerCase();
}

/**
 * Returns board actions visible at time `tSec`, respecting erase and "all" erase.
 */
export function getActiveBoardActionsAt(
  lesson: LectureLesson,
  tSec: number,
): ActiveBoardAction[] {
  const visible = new Map<string, ActiveBoardAction>();

  for (const [index, action] of lesson.board.actions.entries()) {
    if (action.at > tSec) {
      break;
    }

    if (action.kind === "erase") {
      if (action.targetId === "all") {
        visible.clear();
      } else {
        visible.delete(action.targetId);
      }
      continue;
    }

    if (action.kind === "highlight") {
      continue;
    }

    if (action.kind === "write" || action.kind === "draw") {
      visible.set(action.targetId, {
        index,
        at: action.at,
        kind: action.kind,
        targetId: action.targetId,
        region: normalizeRegion(action.region),
        contentPreview: truncate(action.content, 80),
      });
      continue;
    }

    if (action.kind === "transform") {
      const existing = visible.get(action.targetId);
      if (existing) {
        visible.set(action.targetId, {
          ...existing,
          contentPreview: truncate(action.content, 80),
        });
      }
    }
  }

  return [...visible.values()].sort((a, b) => a.at - b.at);
}

export function formatBoardStateTable(
  lesson: LectureLesson,
  timestampsSec: readonly number[],
): string {
  const lines: string[] = [];
  for (const t of timestampsSec) {
    const active = getActiveBoardActionsAt(lesson, t);
    lines.push(`At t=${t}s (${active.length} visible board elements):`);
    if (active.length === 0) {
      lines.push("  (empty board)");
    } else {
      for (const item of active) {
        lines.push(
          `  [${item.kind}] id=${item.targetId} region=${item.region} — ${item.contentPreview}`,
        );
      }
    }
    const byRegion = groupByRegion(active);
    const overlaps = [...byRegion.entries()].filter(([, items]) => items.length > 1);
    if (overlaps.length > 0) {
      lines.push("  WARNING: multiple visible items share a region (likely overlap):");
      for (const [region, items] of overlaps) {
        lines.push(`    region=${region}: ${items.map((i) => i.targetId).join(", ")}`);
      }
    }
  }
  return lines.join("\n");
}

function groupByRegion(actions: ActiveBoardAction[]): Map<string, ActiveBoardAction[]> {
  const map = new Map<string, ActiveBoardAction[]>();
  for (const action of actions) {
    const list = map.get(action.region) ?? [];
    list.push(action);
    map.set(action.region, list);
  }
  return map;
}

export function regionBoxesForLesson(lesson: LectureLesson): string {
  const regions = new Set(
    lesson.board.actions.map((a) => normalizeRegion(a.region)),
  );
  const lines = ["Region layout (percent of board):"];
  for (const region of regions) {
    const box = regionToBox(region);
    lines.push(`  ${region}: top=${box.top} left=${box.left} width=${box.width} height=${box.height}`);
  }
  return lines.join("\n");
}

function truncate(value: string, max: number): string {
  const oneLine = value.replace(/\s+/g, " ").trim();
  return oneLine.length <= max ? oneLine : `${oneLine.slice(0, max - 1)}…`;
}
