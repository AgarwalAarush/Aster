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

const TOPIC_CRITERIA: Record<string, KeywordCriterion[]> = {
  gqa: [
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
  ],
  "vae-loss": [
    {
      id: "vae-encoder-decoder",
      label: "Explains encoder, decoder, and latent distribution",
      max: 14,
      requiredTerms: ["encoder", "decoder", "q(z|x)", "p(x|z)"],
      recommendation: "Explain the encoder q(z|x), decoder p(x|z), and how samples flow through them.",
    },
    {
      id: "vae-reconstruction",
      label: "Explains reconstruction likelihood",
      max: 12,
      requiredTerms: ["reconstruction", "negative log likelihood", "explain x"],
      recommendation: "Name the reconstruction term as likelihood or negative log likelihood, not just pixel error.",
    },
    {
      id: "vae-kl-prior",
      label: "Explains KL pressure against the prior",
      max: 14,
      requiredTerms: ["kl", "p(z)", "prior", "sampleable"],
      recommendation: "Explain KL(q(z|x) || p(z)) as pressure toward a sampleable prior.",
    },
    {
      id: "vae-elbo",
      label: "Connects the terms to the ELBO",
      max: 14,
      requiredTerms: ["elbo", "lower bound", "negative elbo"],
      recommendation: "Connect reconstruction plus KL to maximizing the ELBO or minimizing negative ELBO.",
    },
    {
      id: "vae-beta-tradeoff",
      label: "Names beta-VAE trade-off pressure",
      max: 12,
      requiredTerms: ["beta", "tradeoff", "regular", "reconstruction"],
      recommendation: "Explain beta-VAE as a knob between reconstruction detail and latent regularity.",
    },
  ],
  "flash-attention": [
    {
      id: "flash-score-matrix",
      label: "Explains the materialized attention matrix bottleneck",
      max: 14,
      requiredTerms: ["n by n", "qk", "67 million", "134 mb"],
      recommendation: "Quantify the materialized N by N score matrix, ideally with the 8192-token example.",
    },
    {
      id: "flash-memory-hierarchy",
      label: "Explains HBM versus SRAM",
      max: 14,
      requiredTerms: ["hbm", "sram", "memory", "traffic"],
      recommendation: "Explain why HBM traffic, not only arithmetic, is the bottleneck.",
    },
    {
      id: "flash-tiling",
      label: "Explains tiling through SRAM",
      max: 14,
      requiredTerms: ["tile", "q", "k", "v", "sram"],
      recommendation: "Explain Q/K/V tiling and that score tiles are consumed without writing the full matrix.",
    },
    {
      id: "flash-online-softmax",
      label: "Explains online softmax state",
      max: 14,
      requiredTerms: ["online softmax", "running max", "running sum", "output"],
      recommendation: "Explain online softmax with running max, normalization sum, and output accumulator.",
    },
    {
      id: "flash-exact-tradeoff",
      label: "Names exactness and trade-offs",
      max: 12,
      requiredTerms: ["exact", "not sparse", "tradeoff", "recomputation"],
      recommendation: "Clarify FlashAttention is exact attention with kernel complexity or recomputation trade-offs.",
    },
  ],
};

export function gradeScriptCandidate(value: unknown): GradeResult {
  const candidate = parseScriptCandidate(value);
  const text = candidateSearchText(candidate);
  const topicCriteria = TOPIC_CRITERIA[candidate.topic.id] ?? [];
  const criteria = [
    gradeDuration(candidate),
    gradeStructure(candidate),
    ...topicCriteria.map((criterion) => gradeKeywordCriterion(text, criterion)),
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
