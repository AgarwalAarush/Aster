# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Next.js dev server (the only entry point users interact with).
- `npm run build` / `npm start` — production build / serve.
- `npm run lint` — ESLint (Next core-web-vitals + TS configs); `generated/**` and `public/renders/**` are ignored.
- `npm run typecheck` — `tsc --noEmit`. TS path alias `@/*` resolves to the repo root.
- `npm test` — Vitest run. Run a single file: `npx vitest run lib/hyperframes/render.test.ts`. Filter by name: `npx vitest run -t "renders storyboard"`.
- `npm run qa:education -- <subcommand>` — Education QA CLI. Runs via Node's native TS loader (`--experimental-strip-types`), so all imports inside `lib/education/qa/**` use explicit `.ts` extensions; keep that convention when adding files there.

Required env (see `.env.example`): `OPENAI_API_KEY`, `OPENAI_MODEL` (defaults to `gpt-4.1-mini`), `HYPERFRAMES_RENDER_QUALITY` (defaults to `standard`).

## Architecture

Aster turns a natural-language question into a rendered MP4 lesson. The end-to-end pipeline lives in three layered modules; understanding the contract between them is the key to working productively here.

**Request flow** (`app/page.tsx` → `app/api/videos/route.ts` → `lib/videos/create.ts`):
The API route is `nodejs` runtime with `maxDuration = 300` because the pipeline shells out to a video renderer. `createVideoFromQuestion` is the orchestrator and accepts injectable `planStoryboard` / `renderStoryboard` deps — tests rely on this seam, so preserve it when extending.

**Stage 1 — Storyboard planning** (`lib/education/script.ts` + `lib/education/schema.ts`):
Calls OpenAI Chat Completions with `response_format: json_object` and a hard-coded prompt that pins the output shape. The model output is then post-processed by `normalizeMotionBeatTargets` — motion beat `target` values are overwritten based on the beat `type` via the `MOTION_TARGET_BY_TYPE` map before Zod validation. If you add a new `motionBeatType` in `schema.ts`, you must also add it to that map or the validator will reject otherwise-valid LLM output. Storyboards are locked to exactly 4 scenes, 20–36s total, `style: "monochromeLiquidGlass"`.

**Stage 2 — Hyperframes render** (`lib/hyperframes/*`):
`renderStoryboard` writes three files into `generated/<jobId>/` — `index.html` (composition), `question.txt`, `storyboard.json` — then shells `npx hyperframes lint <jobDir>` followed by `npx hyperframes render --output <public/renders/<jobId>.mp4> --quality <q>`. The MP4 lands in `public/renders/` so Next can serve it at `/renders/<jobId>.mp4`. `runCommand` is also injectable for tests.

The composition is fully self-contained HTML: `composition.ts` lays out scenes, `theme.ts` emits the CSS (1920×1080, dark monochrome liquid-glass), `svg-primitives.ts` switches on `diagram.type` to emit per-scene SVG markup, and `timeline.ts` emits a GSAP `<script>` that drives the animation via `data-start` / `data-duration` attributes. Hyperframes consumes that structure — keep `data-composition-id="aster-lesson"` and the `data-start`/`data-duration` attributes on scenes intact when changing markup.

**Education QA harness** (`lib/education/qa/**`, `scripts/education-qa.ts`):
Separate offline tool, not part of the request pipeline. `archive` validates a script candidate JSON via Zod (`candidate.ts`) and writes it to a directory; `grade` reads a directory of candidates and scores them against topic-aware criteria in `rubric.ts`. Fixture data lives in `lib/education/qa/fixtures/`, and tracked eval sweeps live under `qa-runs/`.

## Conventions

- Generated artifacts (`generated/<jobId>/`, `public/renders/<jobId>.mp4`) are gitignored except for `.gitkeep` placeholders and the `generated/sample-*` reference jobs — don't commit new job output.
- Dependency injection over mocking: the orchestrator and renderer take optional `planStoryboard` / `renderStoryboard` / `runCommand` functions so tests can drive the pipeline without OpenAI or `npx hyperframes`. Follow this pattern for new stages.
- All user-supplied strings flowing into the composition pass through `escapeHtml` in `svg-primitives.ts` — keep that on the path for any new fields that reach `index.html`.

## Gotchas

- **`npx hyperframes`** is invoked by `lib/hyperframes/render.ts` but is **not** declared in `package.json` — npx fetches it on demand. First run on a clean machine needs network access; any sandbox/firewall that blocks the npm registry will hard-fail the renderer with no local fallback.
- First-time setup: `cp .env.example .env` and set `OPENAI_API_KEY`. Without it, storyboard generation throws at the OpenAI call, not at startup.
- Any new API route that triggers the render pipeline must set `export const runtime = "nodejs"` and bump `maxDuration` (current `/api/videos` uses 300s) — the default edge runtime can't `execFile`, and the default timeout will cut renders short.
