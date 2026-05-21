# Aster
Aster turns a natural-language question into a rendered whiteboard lesson video (MP4). It uses a Next.js app to collect the question, an LLM planning stage to produce a structured lesson, and Hyperframes to render a 1080p animation.

## What Aster does
- Accepts a question in the web UI (`app/page.tsx`) or via `POST /api/videos`.
- Plans a lecture-style lesson JSON with narration beats and board actions.
- Renders an MP4 to `public/renders/<jobId>.mp4`.
- Returns metadata with the public video URL.

## End-to-end pipeline
1. **Request layer** (`app/page.tsx` → `app/api/videos/route.ts` → `lib/videos/create.ts`)
   - `/api/videos` runs in Node (`runtime = "nodejs"`, `maxDuration = 300`).
   - `createVideoFromQuestion` orchestrates the pipeline and supports dependency injection (`planLesson`, `renderLesson`) for tests.
2. **Lesson planning** (`lib/education/lesson.ts`, `lib/education/loop/schema.ts`)
   - Builds a `Subject` from the question.
   - Calls OpenAI Chat Completions with `response_format: json_object`.
   - Validates and normalizes output with Zod (`parseLessonResponse`).
3. **Rendering** (`lib/hyperframes/render.ts` and whiteboard modules)
   - Writes `generated/<jobId>/index.html`, `question.txt`, and `lesson.json`.
   - Runs `npx hyperframes lint` and `npx hyperframes render`.
   - Stores final video at `public/renders/<jobId>.mp4`.

## Quickstart
### 1) Install dependencies
```bash
npm ci
```

### 2) Configure environment
```bash
cp .env.example .env
```
Set at minimum:
- `OPENAI_API_KEY` (required for lesson planning)

Optional:
- `OPENAI_MODEL` (default: `gpt-4.1-mini`)
- `HYPERFRAMES_RENDER_QUALITY` (default: `standard`)
- `CURSOR_API_KEY`, `CURSOR_AGENT_MODEL` (used by autonomous QA loop with Cursor SDK)

### 3) Run local app
```bash
npm run dev
```
Open `http://localhost:3000`, enter a question, and generate a lesson video.

## API usage
`POST /api/videos`

Request body:
```json
{
  "question": "Why does dividing by a fraction mean multiplying by the reciprocal?"
}
```

Response shape:
```json
{
  "question": "...",
  "title": "...",
  "video": {
    "jobId": "...",
    "publicUrl": "/renders/<jobId>.mp4"
  }
}
```

## Developer commands
- `npm run dev` — start Next.js dev server.
- `npm run build` / `npm start` — production build and serve.
- `npm run lint` — ESLint (Next + TypeScript config).
- `npm run typecheck` — TypeScript (`tsc --noEmit`).
- `npm test` — run Vitest test suite.
- `npx vitest run lib/hyperframes/render.test.ts` — run a single test file.
- `npx vitest run -t "renders storyboard"` — run tests matching a name.

## Offline QA & iteration workflows
### Education QA harness
- `npm run qa:education -- <subcommand>`
- Uses Node’s native TypeScript loader (`--experimental-strip-types`).
- In `lib/education/qa/**` and `lib/education/loop/**`, keep explicit `.ts` import extensions.

### Autonomous lesson loop
- `npm run qa:loop -- <run-id> init [--variant-module ... --variant-export ... --architecture baseline|region-exclusive|templates]`
- `npm run qa:loop -- <run-id> step <name>`
- `npm run qa:loop -- <run-id> run --sdk` (requires `CURSOR_API_KEY`)

Default in-IDE step flow:
`lesson-prompts` → `lesson-ingest` → `lesson-critic-ingest` → `video-pipeline` → `video-critic-ingest` → `revise-prompt` → `apply-revision`

### Video eval loop
- `npm run qa:video -- <phase> <sweep-id> ...`
- Phases include: `prepare`, `ingest-candidates`, `compose`, `capture-frames`, `render-critic`, `ingest-critiques`, `aggregate`, `decide`.

## Project conventions
- Do not commit generated job artifacts from `generated/<jobId>/` or `public/renders/<jobId>.mp4` (except existing tracked placeholders/reference samples).
- Prefer dependency injection over mocks for pipeline stages (`planLesson`, `renderLesson`, `runCommand`).
- Keep HTML escaping (`escapeHtml`, `escapeHtmlAttr`) for any user text flowing into rendered composition HTML.

## Operational gotchas
- `hyperframes` is invoked via `npx` and is not pinned in `package.json`; first run needs network access.
- Missing `OPENAI_API_KEY` fails at lesson-planning call time, not app startup.
- Any new render-triggering API route should use Node runtime and sufficient timeout (edge runtime cannot run `execFile`).

## Key directories
- `app/` — Next.js UI and API routes.
- `lib/videos/` — request orchestration.
- `lib/education/` — lesson planning, schemas, QA loops.
- `lib/hyperframes/` — composition, timeline, rendering.
- `scripts/` — QA/iteration/video evaluation CLIs.
- `qa-runs/` — saved sweep runs, critiques, summaries.
- `generated/` — per-job render inputs (local artifacts).
- `public/renders/` — rendered MP4 output.
