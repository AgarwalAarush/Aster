import type { Storyboard } from "../education/schema";
import type { RenderResult } from "../hyperframes/render";

type CreateVideoDependencies = {
  planStoryboard?: (question: string) => Promise<Storyboard>;
  renderStoryboard?: (storyboard: Storyboard, question: string) => Promise<RenderResult>;
};

export type CreateVideoResponse = {
  question: string;
  title: string;
  video: {
    jobId: string;
    publicUrl: string;
  };
};

export async function createVideoFromQuestion(
  question: string,
  dependencies: CreateVideoDependencies = {},
): Promise<CreateVideoResponse> {
  const normalizedQuestion = question.trim();

  if (normalizedQuestion.length < 8) {
    throw new Error("Enter a more specific question");
  }

  const planStoryboard =
    dependencies.planStoryboard ?? (await import("../education/script")).createStoryboard;
  const renderStoryboard =
    dependencies.renderStoryboard ?? (await import("../hyperframes/render")).renderStoryboard;
  const storyboard = await planStoryboard(normalizedQuestion);
  const render = await renderStoryboard(storyboard, normalizedQuestion);

  return {
    question: normalizedQuestion,
    title: storyboard.lesson.title,
    video: {
      jobId: render.jobId,
      publicUrl: render.publicUrl,
    },
  };
}
