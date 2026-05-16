import { z } from "zod";
import { subjectSchema, type Subject } from "./schema.ts";

export const SUBJECTS: Subject[] = [
  {
    id: "grouped-query-attention",
    domain: "ml-dl",
    title: "Grouped-Query Attention",
    question:
      "Why does grouped-query attention reduce inference cost compared to multi-head attention, and what does it trade away?",
    difficulty: "advanced",
  },
  {
    id: "layernorm-vs-batchnorm",
    domain: "ml-dl",
    title: "LayerNorm vs BatchNorm",
    question:
      "Why does LayerNorm replace BatchNorm in transformers, and what does normalizing along that axis actually do?",
    difficulty: "intermediate",
  },
  {
    id: "adam-optimizer",
    domain: "ml-dl",
    title: "Adam Optimizer",
    question:
      "How does the Adam optimizer combine momentum with adaptive per-parameter learning rates, and why does that help in practice?",
    difficulty: "intermediate",
  },
  {
    id: "dropout-regularization",
    domain: "ml-dl",
    title: "Dropout Regularization",
    question:
      "Why does randomly zeroing activations during training regularize a neural network, and what is happening at test time?",
    difficulty: "intro",
  },
  {
    id: "positional-encoding",
    domain: "ml-dl",
    title: "Positional Encoding in Transformers",
    question:
      "Why do transformers need positional encodings, and how do sinusoidal and learned encodings differ?",
    difficulty: "intermediate",
  },
  {
    id: "bias-variance-tradeoff",
    domain: "classical-ml",
    title: "Bias-Variance Tradeoff",
    question:
      "What is the bias-variance tradeoff, and why does increasing model capacity not always reduce test error?",
    difficulty: "intro",
  },
  {
    id: "em-algorithm",
    domain: "classical-ml",
    title: "Expectation-Maximization",
    question:
      "How does the EM algorithm find local maxima of likelihood for latent-variable models, and why does it always converge?",
    difficulty: "advanced",
  },
  {
    id: "gradient-boosting",
    domain: "classical-ml",
    title: "Gradient Boosting",
    question:
      "Why does gradient boosting build models stage-wise on residuals, and how is that equivalent to gradient descent in function space?",
    difficulty: "intermediate",
  },
  {
    id: "svm-kernel-trick",
    domain: "classical-ml",
    title: "SVM Kernel Trick",
    question:
      "How does the kernel trick let support vector machines fit non-linear boundaries without explicitly mapping data to a higher-dimensional space?",
    difficulty: "intermediate",
  },
  {
    id: "bayes-rule",
    domain: "probability-stats",
    title: "Bayes' Rule",
    question:
      "How does Bayes' rule update beliefs given evidence, and why is the posterior proportional to likelihood times prior?",
    difficulty: "intro",
  },
  {
    id: "mle-vs-map",
    domain: "probability-stats",
    title: "MLE vs MAP",
    question:
      "How do maximum likelihood estimation and maximum a posteriori estimation differ, and when does each give the better answer?",
    difficulty: "intermediate",
  },
  {
    id: "kl-divergence",
    domain: "probability-stats",
    title: "KL Divergence",
    question:
      "Why is KL divergence asymmetric, and what does choosing forward vs reverse KL mean for the distribution you fit?",
    difficulty: "intermediate",
  },
  {
    id: "central-limit-theorem",
    domain: "probability-stats",
    title: "Central Limit Theorem",
    question:
      "Why does the central limit theorem make the average of many independent variables look Gaussian, and what conditions does it really need?",
    difficulty: "intermediate",
  },
  {
    id: "eigenvectors-pca",
    domain: "pure-math",
    title: "Eigenvectors and PCA",
    question:
      "Why are PCA's principal components the eigenvectors of the data covariance matrix, ranked by eigenvalue?",
    difficulty: "intermediate",
  },
  {
    id: "fourier-transform",
    domain: "pure-math",
    title: "Fourier Transform",
    question:
      "Why does the Fourier transform decompose a signal into a sum of sines and cosines, and what does the magnitude of each frequency component mean?",
    difficulty: "intermediate",
  },
  {
    id: "lagrange-multipliers",
    domain: "pure-math",
    title: "Lagrange Multipliers",
    question:
      "Why do Lagrange multipliers solve constrained optimization, and what does the multiplier value actually represent?",
    difficulty: "intermediate",
  },
  {
    id: "taylor-series",
    domain: "pure-math",
    title: "Taylor Series",
    question:
      "Why can a smooth function be approximated near a point by a polynomial built from its derivatives, and what controls the error?",
    difficulty: "intro",
  },
  {
    id: "np-hardness",
    domain: "cs-theory",
    title: "NP-Hardness",
    question:
      "What does it mean for a problem to be NP-hard, and why does a polynomial-time algorithm for any one of them collapse the whole class?",
    difficulty: "intermediate",
  },
  {
    id: "dynamic-programming",
    domain: "cs-theory",
    title: "Dynamic Programming",
    question:
      "Why does dynamic programming work, and how do optimal substructure and overlapping subproblems tell you when to use it?",
    difficulty: "intermediate",
  },
  {
    id: "consistent-hashing",
    domain: "cs-theory",
    title: "Consistent Hashing",
    question:
      "How does consistent hashing keep most keys mapped to the same node when nodes are added or removed?",
    difficulty: "intermediate",
  },
  {
    id: "rlhf",
    domain: "ai-systems",
    title: "RLHF",
    question:
      "How does reinforcement learning from human feedback align language models, and what role do the reward model and KL penalty play?",
    difficulty: "advanced",
  },
  {
    id: "mixture-of-experts",
    domain: "ai-systems",
    title: "Mixture of Experts",
    question:
      "How do mixture-of-experts layers scale total parameters without scaling compute per token, and what does the router actually decide?",
    difficulty: "advanced",
  },
  {
    id: "speculative-decoding",
    domain: "ai-systems",
    title: "Speculative Decoding",
    question:
      "Why does speculative decoding accelerate LLM inference using a smaller draft model, and why does the output distribution stay exact?",
    difficulty: "advanced",
  },
  {
    id: "flash-attention",
    domain: "ai-systems",
    title: "FlashAttention",
    question:
      "Why is FlashAttention faster than naive attention without changing the result, and what does tiling through SRAM actually save?",
    difficulty: "advanced",
  },
  {
    id: "lora-fine-tuning",
    domain: "ai-systems",
    title: "LoRA Fine-Tuning",
    question:
      "Why can LoRA approximate full fine-tuning by training a low-rank update, and what does the rank control?",
    difficulty: "advanced",
  },
];

export const SUBJECTS_BY_ID: Record<string, Subject> = Object.fromEntries(
  SUBJECTS.map((subject) => [subject.id, subject]),
);

export function getSubject(id: string): Subject {
  const subject = SUBJECTS_BY_ID[id];

  if (!subject) {
    throw new Error(`Unknown subject id: ${id}`);
  }

  return subject;
}

z.array(subjectSchema).length(25).parse(SUBJECTS);
