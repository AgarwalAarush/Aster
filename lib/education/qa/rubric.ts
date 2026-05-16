import { candidateSearchText, parseScriptCandidate, type ScriptCandidate } from "./candidate.ts";

type Criterion = {
  id: string;
  label: string;
  max: number;
  score: number;
  passed: boolean;
  notes: string;
};

export type GradeResult = {
  candidateId: string;
  score: number;
  maxScore: number;
  percent: number;
  criteria: Criterion[];
  recommendations: string[];
};

type KeywordCriterion = {
  id: string;
  label: string;
  max: number;
  requiredTerms: string[];
  recommendation: string;
};

const KEYWORD_CRITERIA: KeywordCriterion[] = [
  {
    id: "prerequisite-setup",
    label: "Sets up transformer attention prerequisites",
    max: 10,
    requiredTerms: ["transformer", "attention", "query", "key", "value"],
    recommendation: "Add prerequisite setup for transformer attention: queries, keys, values, and decoding.",
  },
  {
    id: "gqa-kv-cache",
    label: "Explains KV cache motivation",
    max: 14,
    requiredTerms: ["kv cache", "inference", "decoding", "memory"],
    recommendation: "Explain the KV cache bottleneck and why memory bandwidth matters during decoding.",
  },
  {
    id: "gqa-mha-gqa-mqa",
    label: "Compares MHA, GQA, and MQA trade-offs",
    max: 16,
    requiredTerms: ["mha", "gqa", "mqa", "trade-off"],
    recommendation: "Include the MHA -> GQA -> MQA spectrum and the quality/speed/memory trade-off.",
  },
  {
    id: "gqa-math",
    label: "Shows grouping and cache math",
    max: 14,
    requiredTerms: ["12", "4", "3", "h_q", "h_kv", "ratio"],
    recommendation: "Show concrete grouping math, such as h_q / h_kv = 12 / 4 = 3.",
  },
  {
    id: "visual-specificity",
    label: "Specifies diagrams and animation beats",
    max: 12,
    requiredTerms: ["diagram", "animation", "memory bar", "equation"],
    recommendation: "Add concrete visual direction for diagrams, equation transforms, and memory bars.",
  },
];

export function gradeScriptCandidate(value: unknown): GradeResult {
  const candidate = parseScriptCandidate(value);
  const text = candidateSearchText(candidate);
  const criteria = [
    gradeDuration(candidate),
    gradeStructure(candidate),
    ...KEYWORD_CRITERIA.map((criterion) => gradeKeywordCriterion(text, criterion)),
  ];
  const score = criteria.reduce((sum, criterion) => sum + criterion.score, 0);
  const maxScore = criteria.reduce((sum, criterion) => sum + criterion.max, 0);
  const recommendations = criteria
    .filter((criterion) => !criterion.passed)
    .map((criterion) => criterion.notes);

  return {
    candidateId: candidate.id,
    score,
    maxScore,
    percent: Math.round((score / maxScore) * 100),
    criteria,
    recommendations,
  };
}

function gradeDuration(candidate: ScriptCandidate): Criterion {
  const seconds = candidate.lesson.targetDurationSeconds;
  const passed = seconds >= 120;

  return {
    id: "duration",
    label: "Targets enough time for a technical explanation",
    max: 12,
    score: passed ? 12 : seconds >= 90 ? 6 : 0,
    passed,
    notes: passed ? "Duration is sufficient." : "Increase target duration toward 120-180 seconds.",
  };
}

function gradeStructure(candidate: ScriptCandidate): Criterion {
  const kinds = new Set(candidate.script.sections.map((section) => section.kind));
  const requiredKinds = ["motivation", "background", "mechanism", "math", "tradeoff", "recap"];
  const hitCount = requiredKinds.filter((kind) => kinds.has(kind as never)).length;
  const passed = hitCount >= requiredKinds.length - 1;

  return {
    id: "lesson-arc",
    label: "Uses a complete technical lesson arc",
    max: 12,
    score: Math.round((hitCount / requiredKinds.length) * 12),
    passed,
    notes: passed
      ? "Lesson arc is complete."
      : "Use a fuller arc: motivation, background, mechanism, math, trade-off, and recap.",
  };
}

function gradeKeywordCriterion(text: string, criterion: KeywordCriterion): Criterion {
  const hitCount = criterion.requiredTerms.filter((term) => text.includes(term)).length;
  const passed = hitCount === criterion.requiredTerms.length;

  return {
    id: criterion.id,
    label: criterion.label,
    max: criterion.max,
    score: Math.round((hitCount / criterion.requiredTerms.length) * criterion.max),
    passed,
    notes: passed ? `${criterion.label} is covered.` : criterion.recommendation,
  };
}
