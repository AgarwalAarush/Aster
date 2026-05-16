# Iteration 001: Staircase Beats Prompt

## Setup
- Prompt variant: `staircase-beats-v1`, based on the user-provided payoff/staircase/destination prompt.
- Runner: in-Cursor subagents.
- Topics: Grouped Query Attention, VAE loss, FlashAttention.
- Goal: optimize storyboard and script quality before rendering video.

## Results
- `flash-attention-agent-001`: 88% (`81/92`)
- `vae-loss-agent-001`: 82%
- `gqa-agent-001`: 80%

## Critiques
### `gqa-agent-001`
- Strong: much better than the earlier 24-second storyboard; includes MHA, MQA, GQA, KV cache, grouping ratio, and a concrete `12 / 4 = 3` example.
- Weak: visual specificity still under-scored because the rubric expects explicit memory bars, equation transforms, and diagram language throughout the candidate.
- Next prompt change: require each beat's visual to name concrete primitives and persistent visual elements, not only describe the idea.

### `vae-loss-agent-001`
- Strong: explains ELBO, KL, reconstruction, beta-VAE, and reparameterization in a coherent staircase.
- Weak: reconstruction was sometimes described too generically; rubric wants explicit negative log likelihood / likelihood language and clearer q(z|x) to p(x|z) flow.
- Next prompt change: require first-principles notation for probabilistic ML topics and force the generator to name the loss term in mathematical form before analogy.

### `flash-attention-agent-001`
- Strong: best candidate; covers N by N score matrix, HBM/SRAM, tiling, online softmax, exactness, and non-goals.
- Weak: detailed critique showed partial hits for score-matrix quantification, online softmax state, and exactness/recomputation trade-off due wording gaps.
- Next prompt change: require every quantified claim and every algorithmic state variable to appear in both narration and visual plan.

## Changes Made From This Iteration
- Relaxed `visualPlan.diagram` length from 80 to 180 chars after the first archive/grade attempt rejected realistic agent diagram descriptions.
- Made the rubric topic-aware so VAE and FlashAttention are not graded against GQA-specific criteria.
- Updated the script QA prompt builder to include payoff, staircase, destination, beat discipline, and `whyThisBeat`.
- Extended candidate schema to preserve optional `lesson.payoff`, `lesson.staircase`, `lesson.destination`, and per-beat `whyThisBeat`.

## Next Direction
- Run a second sweep with `buildScriptQaPrompt` instead of ad hoc subagent prompts.
- Add a grader criterion for beat discipline: every section should have `whyThisBeat`, one concrete visual, and 10-30 seconds of narration.
- Add topic packs for more ML subjects as they appear: diffusion loss, RMSNorm, LoRA, MoE routing, PPO/RLHF, rotary embeddings.
