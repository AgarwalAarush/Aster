"use client";

import { FormEvent, useMemo, useState } from "react";
import type { CreateVideoResponse } from "@/lib/videos/create";

type GenerationState = "idle" | "generating" | "complete" | "error";

export default function Home() {
  const [question, setQuestion] = useState("Why do we divide by fractions by multiplying by the reciprocal?");
  const [state, setState] = useState<GenerationState>("idle");
  const [result, setResult] = useState<CreateVideoResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const statusText = useMemo(() => {
    if (state === "generating") {
      return "Planning scenes, writing a composition, and rendering an MP4 locally...";
    }

    if (state === "complete") {
      return "Rendered video ready.";
    }

    if (state === "error") {
      return "Generation hit a snag.";
    }

    return "Ready for a question.";
  }, [state]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("generating");
    setError(null);
    setResult(null);

    const response = await fetch("/api/videos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question }),
    });

    const payload = (await response.json()) as CreateVideoResponse | { error?: string };

    if (!response.ok) {
      setState("error");
      setError("error" in payload && payload.error ? payload.error : "Unable to generate video");
      return;
    }

    setResult(payload as CreateVideoResponse);
    setState("complete");
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-8 text-stone-50 md:px-10">
      <div className="pointer-events-none absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-300/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-0 h-96 w-96 rounded-full bg-sky-400/15 blur-3xl" />

      <section className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="flex flex-col justify-between rounded-[2rem] border border-white/10 bg-black/20 p-7 shadow-2xl shadow-black/30 backdrop-blur md:p-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.48em] text-amber-200/75">Aster MVP</p>
            <h1 className="mt-7 font-[var(--font-display)] text-5xl leading-[0.92] tracking-[-0.07em] md:text-7xl">
              Turn a question into a cinematic mini lesson.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-stone-200/75">
              Ask anything you are trying to understand. Aster asks OpenAI for a teaching plan,
              writes a Hyperframes composition, renders it locally, and gives you an MP4.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-10 space-y-5">
            <label htmlFor="question" className="block text-sm font-bold uppercase tracking-[0.24em] text-stone-300">
              Question
            </label>
            <textarea
              id="question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={5}
              className="w-full resize-none rounded-[1.5rem] border border-white/15 bg-stone-950/70 p-5 text-lg leading-7 text-stone-50 outline-none ring-amber-200/40 transition focus:border-amber-200/70 focus:ring-4"
              placeholder="Why does dividing by a fraction mean multiplying by the reciprocal?"
            />
            <button
              type="submit"
              disabled={state === "generating"}
              className="group w-full rounded-full bg-amber-300 px-7 py-4 text-base font-black uppercase tracking-[0.2em] text-stone-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {state === "generating" ? "Rendering..." : "Generate lesson video"}
            </button>
            <p className="text-sm text-stone-300/75">{statusText}</p>
            {error ? <p className="rounded-2xl bg-red-500/15 p-4 text-sm text-red-100">{error}</p> : null}
          </form>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-stone-950/55 p-5 shadow-2xl shadow-black/35 backdrop-blur md:p-7">
          <div className="flex h-full flex-col">
            <div className="aspect-video overflow-hidden rounded-[1.5rem] border border-white/10 bg-black">
              {result ? (
                <video
                  key={result.video.publicUrl}
                  src={result.video.publicUrl}
                  controls
                  className="h-full w-full"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.16),transparent_30rem)] p-10 text-center">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.32em] text-amber-200/70">Preview</p>
                    <p className="mt-4 max-w-md text-2xl font-semibold leading-snug text-stone-100">
                      Your generated Hyperframes MP4 will appear here after rendering.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <InfoCard label="Pipeline" value="OpenAI JSON -> Hyperframes HTML -> MP4" />
              <InfoCard label="Storage" value={result ? result.video.jobId : "Local generated job"} />
            </div>

            {result ? (
              <div className="mt-6 flex-1 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
                <p className="text-sm font-bold uppercase tracking-[0.28em] text-amber-200/70">Scene Plan</p>
                <h2 className="mt-4 font-[var(--font-display)] text-4xl leading-none tracking-[-0.05em]">
                  {result.plan.title}
                </h2>
                <p className="mt-3 text-stone-300">{result.plan.objective}</p>
                <div className="mt-5 space-y-3">
                  {result.plan.scenes.map((scene, index) => (
                    <details key={`${scene.title}-${index}`} className="rounded-2xl bg-black/20 p-4">
                      <summary className="cursor-pointer font-semibold text-stone-100">
                        {index + 1}. {scene.title}
                      </summary>
                      <p className="mt-3 text-sm leading-6 text-stone-300">{scene.narration}</p>
                      <p className="mt-2 text-sm text-amber-100/80">{scene.emphasis}</p>
                    </details>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <p className="text-xs font-bold uppercase tracking-[0.28em] text-stone-400">{label}</p>
      <p className="mt-3 text-sm font-semibold text-stone-100">{value}</p>
    </div>
  );
}
