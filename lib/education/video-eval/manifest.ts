import { z } from "zod";

export const architectureSchema = z.enum(["baseline", "region-exclusive", "templates"]);
export const frameModeSchema = z.enum(["timeline", "mp4"]);

export const videoSweepManifestSchema = z.object({
  sweepId: z.string().trim().min(3).max(120),
  promptVariantId: z.string().trim().min(2).max(120),
  architecture: architectureSchema,
  frameMode: frameModeSchema.default("timeline"),
  frameTimestampsSec: z.array(z.number().int().min(0).max(360)).min(1).max(36),
  createdAt: z.string().datetime(),
});

export type VideoSweepManifest = z.infer<typeof videoSweepManifestSchema>;
export type ArchitectureMode = z.infer<typeof architectureSchema>;
export type FrameMode = z.infer<typeof frameModeSchema>;

export function parseVideoSweepManifest(value: unknown): VideoSweepManifest {
  return videoSweepManifestSchema.parse(value);
}
