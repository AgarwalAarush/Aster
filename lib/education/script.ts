import OpenAI from "openai";
import { parseStoryboard, type Storyboard } from "./schema";

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

export type StoryboardPlannerClient = {
  chat: {
    completions: {
      create(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
    };
  };
};

type CreateStoryboardOptions = {
  client?: StoryboardPlannerClient;
  model?: string;
};

const DEFAULT_MODEL = "gpt-4.1-mini";
const MOTION_TARGET_BY_TYPE = {
  drawPath: "diagram",
  morphBlob: "ambient",
  revealText: "keyLine",
  pulseNode: "diagram",
  slidePanel: "scene",
  transformEquation: "equation",
  scatterParticles: "particles",
} as const;

export async function createStoryboard(
  question: string,
  options: CreateStoryboardOptions = {},
): Promise<Storyboard> {
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
          "You are an expert teacher, motion designer, and video director. Return only valid JSON that matches the requested schema.",
      },
      {
        role: "user",
        content: buildStoryboardPrompt(trimmedQuestion),
      },
    ],
  });

  const rawContent = response.choices[0]?.message.content;

  if (!rawContent) {
    throw new Error("OpenAI returned an empty storyboard");
  }

  return parseStoryboard(normalizeMotionBeatTargets(JSON.parse(rawContent)));
}

function buildStoryboardPrompt(question: string): string {
  return `Create a visual-first educational video storyboard for this question: "${question}".

Return JSON with exactly this shape:
{
  "lesson": {
    "title": "short video title",
    "coreIdea": "one sentence learning objective",
    "learnerLevel": "who this is for",
    "durationSeconds": 24
  },
  "style": "monochromeLiquidGlass",
  "scenes": [
    {
      "title": "scene title",
      "narration": "one or two spoken sentences, concrete and intuitive",
      "onScreenText": "short sparse text, formula, or key phrase",
      "visualMetaphor": "specific visual metaphor for a black-and-white liquid-glass animation",
      "diagram": {
        "type": "fractionBars | flow | particles | numberLine | comparison | equationTransform | orbit | wave | blankCanvas",
        "label": "short diagram label",
        "values": ["up to eight short labels, numbers, formulas, or concepts"]
      },
      "motionBeats": [
        {
          "type": "drawPath | morphBlob | revealText | pulseNode | slidePanel | transformEquation | scatterParticles",
          "target": "ambient | scene | diagram | equation | keyLine | particles",
          "at": 0.8
        }
      ]
    }
  ]
}

Rules:
- Use 4 scenes.
- Set style exactly to "monochromeLiquidGlass".
- Keep durationSeconds between 20 and 30.
- For each motionBeat.target, choose exactly one token from: ambient, scene, diagram, equation, keyLine, particles.
- Explain by analogy, then principle, then example, then recap.
- Avoid jargon unless you define it immediately.
- Make every visual feasible with SVG, text, simple shapes, particles, linework, and GSAP motion.
- Do not include HTML, CSS, JavaScript, markdown, image URLs, or arbitrary code.
- Prefer sparse on-screen text over paragraphs.`;
}

function normalizeMotionBeatTargets(value: unknown): unknown {
  if (!isRecord(value) || !Array.isArray(value.scenes)) {
    return value;
  }

  for (const scene of value.scenes) {
    if (!isRecord(scene) || !Array.isArray(scene.motionBeats)) {
      continue;
    }

    for (const beat of scene.motionBeats) {
      if (!isRecord(beat) || typeof beat.type !== "string") {
        continue;
      }

      const target = MOTION_TARGET_BY_TYPE[beat.type as keyof typeof MOTION_TARGET_BY_TYPE];

      if (target) {
        beat.target = target;
      }
    }
  }

  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
