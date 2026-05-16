import OpenAI from "openai";
import { parseLessonResponse } from "./loop/parse.ts";
import { WHITEBOARD_V2 } from "./loop/prompts/v2.ts";
import { renderUserPrompt } from "./loop/prompts/v0.ts";
import type { LectureLesson, Subject } from "./loop/schema.ts";

type ChatCompletionRequest = {
  model: string;
  temperature: number;
  response_format: { type: "json_object" };
  messages: Array<{ role: "system" | "user"; content: string }>;
};

type ChatCompletionResponse = {
  choices: Array<{ message: { content: string | null } }>;
};

export type LessonPlannerClient = {
  chat: {
    completions: {
      create(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
    };
  };
};

type CreateLessonOptions = {
  client?: LessonPlannerClient;
  model?: string;
};

const DEFAULT_MODEL = "gpt-4.1-mini";

export async function createLesson(
  question: string,
  options: CreateLessonOptions = {},
): Promise<LectureLesson> {
  const trimmedQuestion = question.trim();

  if (trimmedQuestion.length < 8) {
    throw new Error("Question is required");
  }

  const client = options.client ?? new OpenAI();
  const model = options.model ?? process.env.OPENAI_MODEL ?? DEFAULT_MODEL;

  const subject = synthesizeSubject(trimmedQuestion);
  const userPrompt = renderUserPrompt(WHITEBOARD_V2.userPromptTemplate, subject);

  const response = await client.chat.completions.create({
    model,
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: WHITEBOARD_V2.systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const rawContent = response.choices[0]?.message.content;

  if (!rawContent) {
    throw new Error("OpenAI returned an empty lesson");
  }

  const parsed = parseLessonResponse(rawContent);

  if (!parsed.ok) {
    throw new Error(`Lesson parse failed (${parsed.reason}): ${parsed.detail}`);
  }

  if (parsed.warnings.length > 0) {
    for (const warning of parsed.warnings) {
      console.warn(`[createLesson] ${warning}`);
    }
  }

  return parsed.lesson;
}

function synthesizeSubject(question: string): Subject {
  const id = toSlug(question, 40) || "lesson";
  const title = question.length <= 80 ? question : `${question.slice(0, 77)}...`;
  return {
    id,
    title,
    question,
    domain: "ml-dl",
    difficulty: "intermediate",
  };
}

function toSlug(value: string, maxLength: number): string {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
  return cleaned;
}
