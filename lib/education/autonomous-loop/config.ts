import type { ArchitectureMode } from "../video-eval/manifest.ts";

export type LoopMode = "lesson" | "video" | "full";

export type AutonomousLoopConfig = {
  runId: string;
  maxIterations: number;
  mode: LoopMode;
  variantModule: string;
  variantExport: string;
  architecture: ArchitectureMode;
  cursorModel: string;
  lessonThreshold: {
    meanGte: number;
    perCriterionMeanGte: number;
    perSubjectGte: number;
  };
  videoThreshold: {
    meanGte: number;
    textOverlapMeanGte: number;
  };
};

export const DEFAULT_LOOP_CONFIG: Omit<AutonomousLoopConfig, "runId"> = {
  maxIterations: 3,
  mode: "full",
  variantModule: "lib/education/loop/prompts/v5-short.ts",
  variantExport: "WHITEBOARD_V5_SHORT",
  architecture: "baseline",
  cursorModel: process.env.CURSOR_AGENT_MODEL ?? "composer-2",
  lessonThreshold: {
    meanGte: 90,
    perCriterionMeanGte: 85,
    perSubjectGte: 82,
  },
  videoThreshold: {
    meanGte: 75,
    textOverlapMeanGte: 50,
  },
};
