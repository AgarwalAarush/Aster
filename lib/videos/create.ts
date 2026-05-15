import type { ScenePlan } from "../education/schema";
import type { RenderResult } from "../hyperframes/render";

type CreateVideoDependencies = {
  planQuestion?: (question: string) => Promise<ScenePlan>;
  renderPlan?: (plan: ScenePlan, question: string) => Promise<RenderResult>;
};

export type CreateVideoResponse = {
  question: string;
  plan: ScenePlan;
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

  const planQuestion =
    dependencies.planQuestion ?? (await import("../education/script")).createScenePlan;
  const renderPlan =
    dependencies.renderPlan ?? (await import("../hyperframes/render")).renderScenePlan;
  const plan = await planQuestion(normalizedQuestion);
  const render = await renderPlan(plan, normalizedQuestion);

  return {
    question: normalizedQuestion,
    plan,
    video: {
      jobId: render.jobId,
      publicUrl: render.publicUrl,
    },
  };
}
