# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Next.js dev server (the only entry point users interact with).
- `npm run build` / `npm start` — production build / serve.
- `npm run lint` — ESLint (Next core-web-vitals + TS configs); `generated/**` and `public/renders/**` are ignored.
- `npm run typecheck` — `tsc --noEmit`. TS path alias `@/*` resolves to the repo root.
- `npm test` — Vitest run. Run a single file: `npx vitest run lib/hyperframes/render.test.ts`. Filter by name: `npx vitest run -t "renders storyboard"`.
- `npm run qa:education -- <subcommand>` — Education QA CLI. Runs via Node's native TS loader (`--experimental-strip-types`), so all imports inside `lib/education/qa/**` and `lib/education/loop/**` use explicit `.ts` extensions; keep that convention when adding files there. The same applies to the scripts that import those modules (`scripts/education-qa.ts`, `scripts/iterate.ts`, `scripts/bootstrap-champion.ts`, etc.).
- `npm run qa:video -- <phase> <sweep-id> ...` — Video visual eval loop (`lib/education/video-eval/**`, `scripts/video-eval.ts`). Phases: `prepare`, `ingest-candidates`, `compose`, `capture-frames`, `render-critic`, `ingest-critiques`, `aggregate`, `decide` (optional: `render-mp4`, `capture-mp4-frames`). Timeline screenshots use Playwright (`npx playwright install chromium` once). After `render-critic`, run a Cursor agent on each `qa-runs/<sweep>/visual-critic-prompts/*.critic.txt` with the matching `frames/<subject>/` PNGs attached; save JSON to `critiques/<subject>.raw.txt`.

Required env (see `.env.example`): `OPENAI_API_KEY`, `OPENAI_MODEL` (defaults to `gpt-4.1-mini`), `HYPERFRAMES_RENDER_QUALITY` (defaults to `standard`).

## Architecture

Aster turns a natural-language question into a rendered MP4 lesson. The end-to-end pipeline lives in three layered modules; understanding the contract between them is the key to working productively here.

**Request flow** (`app/page.tsx` → `app/api/videos/route.ts` → `lib/videos/create.ts`):
The API route is `nodejs` runtime with `maxDuration = 300` because the pipeline shells out to a video renderer. `createVideoFromQuestion` is the orchestrator and accepts injectable `planLesson` / `renderLesson` deps — tests rely on this seam, so preserve it when extending.

**Stage 1 — Lesson planning** (`lib/education/lesson.ts` + `lib/education/loop/schema.ts`):
`createLesson` synthesizes a `Subject` from the question (id-slug + title + `domain: "ml-dl"` + `difficulty: "intermediate"`), renders the user prompt from the current champion variant (`lib/education/loop/prompts/v2.ts` → `WHITEBOARD_V2`), then calls OpenAI Chat Completions with `response_format: json_object` and `temperature: 0.4`. The raw JSON goes through `parseLessonResponse` (`lib/education/loop/parse.ts`) which Zod-validates it against `lectureLessonSchema` and surfaces any parse warnings. The schema is a *lecture lesson*: `lesson.title/learnerLevel/durationSeconds (60–360)/payoff/staircase/destination`, plus parallel `narration.beats` (with `atSec`/`text`/`whyThisBeat`), `board.actions` (`write` | `draw` | `highlight` | `transform` | `erase`, each with an `at` and optional `region`), and an optional `codeBlocks` list. To change the live prompt, swap which `WHITEBOARD_V*` module `lesson.ts` imports — the QA loops below produce those variants.

**Stage 2 — Hyperframes render** (`lib/hyperframes/*`):
`renderLesson` writes three files into `generated/<jobId>/` — `index.html` (composition), `question.txt`, `lesson.json` — then shells `npx hyperframes lint <jobDir>` followed by `npx hyperframes render --output <public/renders/<jobId>.mp4> --quality <q>`. The MP4 lands in `public/renders/` so Next can serve it at `/renders/<jobId>.mp4`. `runCommand` is injectable for tests.

The composition is fully self-contained HTML produced by `whiteboard-composition.ts:generateWhiteboardHtml`: `whiteboard-theme.ts` emits the 1920×1080 paper/ink CSS, `whiteboard-timeline.ts` emits the GSAP `<script>` that drives board actions / narration beats / code blocks by `data-at` timestamps, and `regions.ts` maps action `region` strings (e.g. `top-left`, `center`, `right-half`) to inline `top/left/width/height`. Hyperframes consumes the resulting DOM — keep `data-composition-id="aster-lesson"` on the root and `data-at` on each animated element intact when changing markup. The older `composition.ts` / `theme.ts` / `svg-primitives.ts` / `timeline.ts` modules belonged to the retired storyboard pipeline and are no longer on the render path.

**Offline iteration — keyword-rubric harness** (`lib/education/qa/**`, `scripts/education-qa.ts`):
Offline A/B harness for the *script-writing prompt* used during the storyboard era; still useful as a deterministic regression check. `prompt.ts:buildScriptQaPrompt` emits a prompt template tagged with a `promptVariant.id`; an external runner (`in-cursor-agent` | `manual` | `fixture`) produces a candidate JSON conforming to `candidate.ts`; `cli.ts archive` Zod-validates it into `qa-runs/<date>-<slug>/candidates/`; `cli.ts grade --dir <…>` flattens each candidate's text via `candidateSearchText` and scores it with `rubric.ts`. The grader applies two universal criteria — `gradeDuration` (≥120s) and `gradeStructure` (≥5 of 6 section `kind`s: motivation/background/mechanism/math/tradeoff/recap) — then routes to `TOPIC_CRITERIA[candidate.topic.id]` for keyword-substring scoring. Unknown topic ids silently score only the universal criteria. Adding a topic = new entry in `TOPIC_CRITERIA` + a golden in `lib/education/qa/fixtures/` to anchor rubric tests.

**Offline iteration — critique loop** (`lib/education/loop/**`, `scripts/iterate.ts` + `bootstrap-champion.ts` + `decide.ts` + `aggregate-sweep.ts` + `ingest-critiques.ts` + `ingest-sweep.ts` + `render-*-prompts.ts`):
The newer harness that produces the prompt variants the live pipeline actually uses. `generate.ts` runs a candidate prompt over a `subjects.ts` / `iteration-subjects.ts` panel to produce `LectureLesson` JSONs; `critique.ts` LLM-grades each lesson against 11 named criteria (`payoff-concreteness`, `staircase-coherence`, `destination-precision`, `narration-clarity`, `board-specificity`, `board-coherence`, `board-visual-balance`, `math-notation-correctness`, `code-content-decision`, `pacing-and-density`, `redundancy-and-focus` — see `CRITERION_MAX` for weights); `aggregate.ts` rolls per-criterion scores into a sweep summary; `decide.ts` promotes a winning variant to `prompts/v{N}.ts`. Tracked sweeps and champions live under `qa-runs/<date>-<slug>/`.

## Conventions

- Generated artifacts (`generated/<jobId>/`, `public/renders/<jobId>.mp4`) are gitignored except for `.gitkeep` placeholders and the `generated/sample-*` reference jobs — don't commit new job output.
- Dependency injection over mocking: the orchestrator and renderer take optional `planLesson` / `renderLesson` / `runCommand` functions so tests can drive the pipeline without OpenAI or `npx hyperframes`. Follow this pattern for new stages.
- All user-supplied strings flowing into the composition pass through `escapeHtml` / `escapeHtmlAttr` in `lib/hyperframes/util.ts` — keep that on the path for any new fields that reach `index.html`.

## Gotchas

- **`npx hyperframes`** is invoked by `lib/hyperframes/render.ts` but is **not** declared in `package.json` — npx fetches it on demand. First run on a clean machine needs network access; any sandbox/firewall that blocks the npm registry will hard-fail the renderer with no local fallback.
- First-time setup: `cp .env.example .env` and set `OPENAI_API_KEY`. Without it, storyboard generation throws at the OpenAI call, not at startup.
- Any new API route that triggers the render pipeline must set `export const runtime = "nodejs"` and bump `maxDuration` (current `/api/videos` uses 300s) — the default edge runtime can't `execFile`, and the default timeout will cut renders short.
