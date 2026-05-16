import { z } from "zod";
import type { LectureLesson, Subject } from "./schema.ts";

const CRITERION_IDS = [
  "payoff-concreteness",
  "staircase-coherence",
  "destination-precision",
  "narration-clarity",
  "board-specificity",
  "board-coherence",
  "board-visual-balance",
  "math-notation-correctness",
  "code-content-decision",
  "pacing-and-density",
  "redundancy-and-focus",
] as const;

export type CriterionId = (typeof CRITERION_IDS)[number];

export const CRITERION_MAX: Record<CriterionId, number> = {
  "payoff-concreteness": 8,
  "staircase-coherence": 10,
  "destination-precision": 8,
  "narration-clarity": 12,
  "board-specificity": 10,
  "board-coherence": 10,
  "board-visual-balance": 8,
  "math-notation-correctness": 10,
  "code-content-decision": 6,
  "pacing-and-density": 10,
  "redundancy-and-focus": 8,
};

export const TOTAL_MAX = Object.values(CRITERION_MAX).reduce((a, b) => a + b, 0);

const criterionSchema = z.object({
  id: z.enum(CRITERION_IDS),
  label: z.string().trim().min(3).max(120),
  max: z.number().int().min(1).max(20),
  score: z.number().int().min(0).max(20),
  notes: z.string().trim().min(8).max(1600),
});

export const critiqueReportSchema = z
  .object({
    candidateId: z.string().trim().min(3).max(160),
    subjectId: z.string().trim().min(2).max(120),
    promptVariantId: z.string().trim().min(2).max(120),
    criteria: z.array(criterionSchema).length(CRITERION_IDS.length),
    totalScore: z.number().int().min(0).max(TOTAL_MAX),
    maxScore: z.number().int().min(TOTAL_MAX).max(TOTAL_MAX),
    percent: z.number().int().min(0).max(100),
    topThreeIssues: z.array(z.string().trim().min(8).max(400)).min(0).max(5),
    wouldRecommendForPipeline: z.boolean(),
    summary: z.string().trim().min(40).max(1200),
  })
  .superRefine((report, ctx) => {
    const seen = new Set<string>();
    for (const criterion of report.criteria) {
      if (seen.has(criterion.id)) {
        ctx.addIssue({
          code: "custom",
          message: `duplicate criterion id: ${criterion.id}`,
          path: ["criteria"],
        });
      }
      seen.add(criterion.id);

      const expectedMax = CRITERION_MAX[criterion.id];
      if (criterion.max !== expectedMax) {
        ctx.addIssue({
          code: "custom",
          message: `criterion ${criterion.id} declared max ${criterion.max} but rubric defines ${expectedMax}`,
          path: ["criteria"],
        });
      }
      if (criterion.score > criterion.max) {
        ctx.addIssue({
          code: "custom",
          message: `criterion ${criterion.id} score ${criterion.score} exceeds max ${criterion.max}`,
          path: ["criteria"],
        });
      }
    }

    for (const id of CRITERION_IDS) {
      if (!seen.has(id)) {
        ctx.addIssue({
          code: "custom",
          message: `missing criterion: ${id}`,
          path: ["criteria"],
        });
      }
    }

    const computedTotal = report.criteria.reduce((sum, c) => sum + c.score, 0);
    if (computedTotal !== report.totalScore) {
      ctx.addIssue({
        code: "custom",
        message: `totalScore ${report.totalScore} does not match summed criterion scores ${computedTotal}`,
        path: ["totalScore"],
      });
    }
  });

export type CritiqueReport = z.infer<typeof critiqueReportSchema>;

export function parseCritiqueReportSafe(value: unknown) {
  return critiqueReportSchema.safeParse(value);
}

const CRITIC_SYSTEM_PROMPT = `You are a senior teaching evaluator and a senior whiteboard-lecture director. You are reviewing a structured plan for a continuous-whiteboard narrated video lesson and scoring it against a fixed rubric. The plan was produced by an LLM under a specific prompt variant; your scoring drives prompt iteration. Be exact, fair, and specific. Reward concrete decisions; penalize hand-waving and unjustified omissions.

You will read:
  - The subject (topic, question, domain, difficulty, intended learner level)
  - The candidate lesson plan as JSON
  - The rubric below

You will score every criterion. You will not skip any. You will not invent criteria. You will use the integer maxes exactly as defined.

You will then return a single JSON object. No prose. No markdown. JSON only.`;

const RUBRIC_SECTION = `Rubric (each criterion: id, label, max integer, scoring guidance):

1) payoff-concreteness  (max 8)
   The lesson.payoff states a concrete reason a learner should care, ideally with a number or specific stake. Vague payoffs ("important", "useful") score 0-2. Generic-but-true payoffs without numbers or stakes score 3-5. Concrete payoffs with numbers or sharp stakes score 6-8.

2) staircase-coherence  (max 10)
   The staircase rungs build monotonically: each rung is strictly necessary, no gaps, no rungs reach beyond what's needed. Score down for missing prerequisite, redundant rung, or rung that is actually the destination.

3) destination-precision  (max 8)
   The destination names a precise object (formula, mechanism, theorem, named technique) the learner can hold afterward. "Understand X" scores 0-2. "Hold formula F and know what each factor protects against" scores 7-8.

4) narration-clarity  (max 12)
   Every symbol is defined the first time it appears in narration. Every term of jargon is defined or unpacked the first time it appears. Sentences are concrete, not hand-wavy. No contradictions. Read through narration.beats in order and penalize each undefined symbol or jargon term.

5) board-specificity  (max 10)
   Every "draw" action is concrete enough that a renderer could execute it without inventing details. "Draw a graph" scores 0. "Draw three nodes A, B, C left-to-right with arrows A->B and B->C" scores full credit. "write" actions whose content is "the formula" or "the equation" without the actual content also lose points here.

6) board-coherence  (max 10)
   The action timeline forms a sensible whiteboard story: nothing is highlighted/transformed/erased without first being introduced; transformations preserve identity in a comprehensible way; the canvas state implied at each moment is plausible (not impossibly cluttered).

7) board-visual-balance  (max 8)
   Mix of action kinds is appropriate to the topic. Topics that admit diagrams (graphs, distributions, geometry, networks, hierarchies) should have multiple draw actions, not just text writes. Topics that are purely formal still need at least one structural diagram. Heavy text-dump with one-or-zero draws on a visual topic scores 0-3.

8) math-notation-correctness  (max 10)
   All formulas are mathematically correct. Symbol use is consistent (a symbol means the same thing throughout). Numerical examples are arithmetically correct. Catch incorrect derivations, off-by-one errors, dimension mismatches, wrong constants.

9) code-content-decision  (max 6)
   Did the lesson make the right decision about whether to include code-as-content? If code is present: is it syntactically valid in its declared language? Is it the right granularity for the beat? Is it correct for the concept? If code is absent: would including code have materially clarified the mechanism? Score 6 for correct decision well-executed; 3 for borderline; 0 for clearly wrong (broken code present, or code obviously needed and absent).

10) pacing-and-density  (max 10)
    Beats are appropriately spaced for difficulty: intro topics get more seconds per beat, advanced topics get denser pacing. No beat is overloaded with multiple distinct ideas. Total beat times respect durationSeconds. Score down for one beat doing five things, or for huge gaps with no narration.

11) redundancy-and-focus  (max 8)
    No repeated content across beats. Stays on the topic question. Doesn't waste time on tangents or restate what was just said.

After scoring, write 1-3 topThreeIssues (highest-leverage fixes), set wouldRecommendForPipeline (true only if percent >= 75 AND no criterion below half its max), and write a 2-3 sentence summary.`;

const CRITIC_OUTPUT_SHAPE = `Return JSON matching this shape exactly:

{
  "candidateId": "<copy from candidate.id>",
  "subjectId": "<copy from candidate.topic.id>",
  "promptVariantId": "<copy from candidate.promptVariant.id>",
  "criteria": [
    { "id": "payoff-concreteness", "label": "Payoff concreteness", "max": 8, "score": <0-8>, "notes": "<specific reason for score>" },
    { "id": "staircase-coherence", "label": "Staircase coherence", "max": 10, "score": <0-10>, "notes": "..." },
    { "id": "destination-precision", "label": "Destination precision", "max": 8, "score": <0-8>, "notes": "..." },
    { "id": "narration-clarity", "label": "Narration clarity", "max": 12, "score": <0-12>, "notes": "..." },
    { "id": "board-specificity", "label": "Board specificity", "max": 10, "score": <0-10>, "notes": "..." },
    { "id": "board-coherence", "label": "Board coherence", "max": 10, "score": <0-10>, "notes": "..." },
    { "id": "board-visual-balance", "label": "Board visual balance", "max": 8, "score": <0-8>, "notes": "..." },
    { "id": "math-notation-correctness", "label": "Math and notation correctness", "max": 10, "score": <0-10>, "notes": "..." },
    { "id": "code-content-decision", "label": "Code-content decision", "max": 6, "score": <0-6>, "notes": "..." },
    { "id": "pacing-and-density", "label": "Pacing and density", "max": 10, "score": <0-10>, "notes": "..." },
    { "id": "redundancy-and-focus", "label": "Redundancy and focus", "max": 8, "score": <0-8>, "notes": "..." }
  ],
  "totalScore": <sum of all criterion scores>,
  "maxScore": ${TOTAL_MAX},
  "percent": <round(totalScore / maxScore * 100)>,
  "topThreeIssues": ["<most important fix>", "<second>", "<third>"],
  "wouldRecommendForPipeline": <true|false>,
  "summary": "<2-3 sentences>"
}

Return ONLY the JSON object. No commentary. No fences. No preamble.`;

export function buildCriticPrompt(subject: Subject, lesson: LectureLesson): {
  systemPrompt: string;
  userPrompt: string;
} {
  const userPrompt = `SUBJECT
  id: ${subject.id}
  domain: ${subject.domain}
  difficulty: ${subject.difficulty}
  title: ${subject.title}
  question: ${subject.question}

CANDIDATE LESSON PLAN (JSON)
${JSON.stringify(lesson, null, 2)}

${RUBRIC_SECTION}

${CRITIC_OUTPUT_SHAPE}`;

  return {
    systemPrompt: CRITIC_SYSTEM_PROMPT,
    userPrompt,
  };
}
