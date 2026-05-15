import OpenAI from "openai";
import { parseScenePlan, type ScenePlan } from "./schema";

type ChatCompletionRequest = {
  model: string;
  temperature: number;
  response_format: {
    type: "json_object";
  };
  messages: Array<{
    role: "system" | "user";
    content: string;
  }>;
};

type ChatCompletionResponse = {
  choices: Array<{
    message: {
      content: string | null;
    };
  }>;
};

export type ScenePlannerClient = {
  chat: {
    completions: {
      create(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
    };
  };
};

type CreateScenePlanOptions = {
  client?: ScenePlannerClient;
  model?: string;
};

const DEFAULT_MODEL = "gpt-4.1-mini";

export async function createScenePlan(
  question: string,
  options: CreateScenePlanOptions = {},
): Promise<ScenePlan> {
  const trimmedQuestion = question.trim();

  if (!trimmedQuestion) {
    throw new Error("Question is required");
  }

  const client = options.client ?? new OpenAI();
  const model = options.model ?? process.env.OPENAI_MODEL ?? DEFAULT_MODEL;

  const response = await client.chat.completions.create({
    model,
    temperature: 0.6,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are an expert teacher and video lesson director. Return only valid JSON that matches the requested schema.",
      },
      {
        role: "user",
        content: buildScenePlanPrompt(trimmedQuestion),
      },
    ],
  });

  const rawContent = response.choices[0]?.message.content;

  if (!rawContent) {
    throw new Error("OpenAI returned an empty scene plan");
  }

  return parseScenePlan(JSON.parse(rawContent));
}

function buildScenePlanPrompt(question: string): string {
  return `Create a short educational video plan for this question: "${question}".

Return JSON with exactly this shape:
{
  "title": "short video title",
  "objective": "one sentence learning objective",
  "audience": "who this is for",
  "durationSeconds": 24,
  "scenes": [
    {
      "title": "scene title",
      "narration": "one or two spoken sentences, concrete and intuitive",
      "visual": "specific visual direction for the animation",
      "emphasis": "short on-screen phrase or formula"
    }
  ]
}

Rules:
- Use 4 scenes.
- Keep durationSeconds between 20 and 30.
- Explain by analogy, then principle, then example, then recap.
- Avoid jargon unless you define it immediately.
- Make every visual feasible with text, simple shapes, and motion graphics.`;
}
