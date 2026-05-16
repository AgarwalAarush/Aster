import type { LectureLesson } from "../education/loop/schema.ts";
import type { RenderResult } from "../hyperframes/render.ts";

type CreateVideoDependencies = {
  planLesson?: (question: string) => Promise<LectureLesson>;
  renderLesson?: (lesson: LectureLesson, question: string) => Promise<RenderResult>;
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

  const planLesson =
    dependencies.planLesson ?? (await import("../education/lesson.ts")).createLesson;
  const renderLesson =
    dependencies.renderLesson ?? (await import("../hyperframes/render.ts")).renderLesson;
  const lesson = await planLesson(normalizedQuestion);
  const render = await renderLesson(lesson, normalizedQuestion);

  return {
    question: normalizedQuestion,
    title: lesson.lesson.title,
    video: {
      jobId: render.jobId,
      publicUrl: render.publicUrl,
    },
  };
}
