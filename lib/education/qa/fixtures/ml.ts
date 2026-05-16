import type { ScriptCandidate } from "../candidate";

export const vaeLossStrongCandidate: ScriptCandidate = {
  id: "vae-loss-strong",
  topic: {
    id: "vae-loss",
    title: "Variational Autoencoder Loss",
    question: "Why does VAE loss combine reconstruction loss and KL divergence?",
  },
  promptVariant: {
    id: "staircase-beats-v1",
    name: "Staircase beats v1",
    prompt: "Create a beat-based technical script with payoff, staircase, and destination.",
  },
  metadata: {
    runner: "fixture",
    model: "golden",
    createdAt: "2026-05-16T02:30:00.000Z",
  },
  lesson: {
    title: "Why VAE Loss Has Two Terms",
    learnerLevel: "intermediate machine learning learner",
    targetDurationSeconds: 156,
    learningObjective:
      "Explain why a variational autoencoder combines reconstruction likelihood with KL divergence to optimize the ELBO while shaping a sampleable latent space.",
  },
  script: {
    fullNarration:
      "A Variational Autoencoder, or VAE, is not trying to memorize one private code per input. It learns an encoder q(z|x), a decoder p(x|z), and a prior p(z), usually N(0,I), so new samples from the prior land in meaningful latent space. The reconstruction term, often negative log likelihood or binary cross entropy, rewards decoded samples that explain x. The KL divergence term KL(q(z|x) || p(z)) pulls each encoder distribution toward the prior so the latent space stays continuous and sampleable. Together they form the negative Evidence Lower Bound, or ELBO: loss equals reconstruction minus expected log likelihood plus KL regularization. The reparameterization trick, z = mu + sigma epsilon, lets gradients flow through stochastic samples. Beta-VAE exposes the tradeoff by using reconstruction plus beta times KL: low beta improves detail, high beta improves latent regularity or disentanglement but can blur reconstructions.",
    sections: [
      {
        kind: "motivation",
        title: "Why two losses",
        narration:
          "A VAE loss is a bargain: reconstruct the input, but keep the latent space sampleable from a simple prior.",
        visual: "Two force arrows pull a latent point between reconstruction fidelity and prior matching.",
        estimatedSeconds: 18,
      },
      {
        kind: "background",
        title: "Encoder and decoder distributions",
        narration:
          "The encoder outputs q(z|x), usually a Gaussian with mu and sigma, while the decoder models p(x|z).",
        visual: "Input flows through encoder to a Gaussian q(z|x), then a sampled z flows through decoder.",
        estimatedSeconds: 20,
      },
      {
        kind: "mechanism",
        title: "Reconstruction term",
        narration:
          "The reconstruction term is negative log likelihood: decoded samples should explain x under p(x|z).",
        visual: "Original and reconstruction sit side by side with pixel errors accumulating into a loss bar.",
        estimatedSeconds: 20,
      },
      {
        kind: "math",
        title: "KL and ELBO",
        narration:
          "The KL term KL(q(z|x) || p(z)) keeps q near p(z), and the full objective is the negative ELBO.",
        visual: "ELBO equation decomposes into reconstruction likelihood minus KL divergence.",
        estimatedSeconds: 28,
      },
      {
        kind: "tradeoff",
        title: "Beta pressure",
        narration:
          "Beta-VAE changes the tradeoff: beta below 1 favors sharper reconstruction, while beta above 1 favors a more regular latent space.",
        visual: "A beta knob trades reconstruction sharpness against latent regularity.",
        estimatedSeconds: 24,
      },
    ],
  },
  visualPlan: [
    {
      sceneTitle: "VAE loss forces",
      diagram: "Split force diagram with reconstruction pulling to x and KL pulling q(z|x) to p(z).",
      animation: "The latent distribution settles between both forces as the loss equation appears.",
    },
  ],
};

export const flashAttentionStrongCandidate: ScriptCandidate = {
  id: "flash-attention-strong",
  topic: {
    id: "flash-attention",
    title: "FlashAttention",
    question: "How does FlashAttention make attention faster and more memory efficient?",
  },
  promptVariant: {
    id: "staircase-beats-v1",
    name: "Staircase beats v1",
    prompt: "Create a beat-based technical script with payoff, staircase, and destination.",
  },
  metadata: {
    runner: "fixture",
    model: "golden",
    createdAt: "2026-05-16T02:30:00.000Z",
  },
  lesson: {
    title: "FlashAttention: Exact Attention by Moving Less Data",
    learnerLevel: "intermediate machine learning engineer",
    targetDurationSeconds: 160,
    learningObjective:
      "Explain how FlashAttention avoids materializing the N by N attention matrix by using tiling, SRAM, HBM-aware scheduling, and online softmax.",
  },
  script: {
    fullNarration:
      "FlashAttention makes exact attention faster by moving less data through High Bandwidth Memory, or HBM. Standard attention computes QK^T, materializes an N by N score matrix, applies softmax, and multiplies by V. For 8192 tokens, that score matrix has over 67 million entries per head, about 134 MB in fp16 before masks, dropout, gradients, or heads. The bottleneck is IO: HBM is large but slower, while on-chip SRAM is small but fast. FlashAttention tiles Q, K, and V so each block fits in SRAM, computes score tiles, updates the output accumulator, and never writes the full attention matrix to HBM. Online softmax keeps a running max m, normalization sum l, and output O so softmax remains numerically stable across tiles. It is exact up to floating point roundoff, not sparse or low-rank. The tradeoff is more complex kernels and recomputation in backward, but much lower memory traffic and activation storage. It does not change the attention formula or make attention O(N); it changes the schedule.",
    sections: [
      {
        kind: "motivation",
        title: "The payoff",
        narration:
          "FlashAttention speeds up exact attention by moving less data, not by changing the attention formula.",
        visual: "Attention layer stays unchanged while HBM traffic arrows shrink.",
        estimatedSeconds: 16,
      },
      {
        kind: "background",
        title: "The N by N wall",
        narration:
          "Standard attention materializes QK^T as an N by N score matrix; at 8192 tokens that is over 67 million fp16 scores per head.",
        visual: "A score matrix expands with a 67M counter and 134 MB readout.",
        estimatedSeconds: 25,
      },
      {
        kind: "mechanism",
        title: "SRAM versus HBM",
        narration:
          "HBM is large and farther away; SRAM is tiny but fast, so repeatedly writing scores through HBM is the bottleneck.",
        visual: "GPU memory hierarchy shows red traffic arrows between compute and HBM.",
        estimatedSeconds: 22,
      },
      {
        kind: "math",
        title: "Online softmax",
        narration:
          "Online softmax keeps running max m, running sum l, and output accumulator O while tiles stream through SRAM.",
        visual: "Score chunks update m, l, and O without materializing the whole row.",
        estimatedSeconds: 30,
      },
      {
        kind: "tradeoff",
        title: "Exact but more complex",
        narration:
          "FlashAttention is exact up to floating point roundoff, but pays with specialized kernels and some backward recomputation.",
        visual: "Checklist: unchanged formula and all query-key pairs; changed schedule and memory movement.",
        estimatedSeconds: 24,
      },
    ],
  },
  visualPlan: [
    {
      sceneTitle: "Tiled attention",
      diagram: "Q, K, and V tiles enter SRAM while the full N by N score matrix is crossed out.",
      animation: "Tiles stream through SRAM and update output without writing score tiles to HBM.",
    },
  ],
};
