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
      return "Directing a storyboard, drawing SVG motion, and rendering an MP4 locally...";
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
    <main className="relative min-h-screen overflow-hidden px-6 py-8 text-neutral-950 md:px-10">
      <div className="pointer-events-none absolute inset-x-8 top-8 h-px bg-gradient-to-r from-transparent via-neutral-950/15 to-transparent" />
      <div className="pointer-events-none absolute left-[-8rem] top-24 h-[30rem] w-[30rem] rounded-full bg-white/35 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-10rem] right-[-6rem] h-[34rem] w-[34rem] rounded-full border border-neutral-300/50 bg-neutral-200/40 blur-3xl" />

      <section className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="flex flex-col justify-between rounded-[2rem] bg-white/60 p-7 shadow-[0_24px_90px_rgba(20,20,20,0.10)] backdrop-blur-2xl md:p-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.48em] text-neutral-500">Aster Studio</p>
            <h1 className="mt-7 font-[var(--font-display)] text-5xl leading-[0.92] tracking-[-0.07em] text-neutral-950 md:text-7xl">
              Turn a question into a liquid-glass mini lesson.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-neutral-600">
              Ask anything you are trying to understand. Aster directs a visual storyboard,
              draws safe SVG diagrams, renders a Hyperframes composition, and gives you an MP4.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-10 space-y-5">
            <label htmlFor="question" className="block text-sm font-bold uppercase tracking-[0.24em] text-neutral-500">
              Question
            </label>
            <textarea
              id="question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={5}
              className="w-full resize-none rounded-[1.5rem] border border-neutral-200/90 bg-white/70 p-5 text-lg leading-7 text-neutral-950 shadow-inner shadow-neutral-950/[0.03] outline-none ring-neutral-950/10 transition placeholder:text-neutral-400 focus:border-neutral-950/25 focus:bg-white/90 focus:ring-4"
              placeholder="Why does dividing by a fraction mean multiplying by the reciprocal?"
            />
            <button
              type="submit"
              disabled={state === "generating"}
              className="group w-full rounded-full bg-neutral-950 px-7 py-4 text-base font-black uppercase tracking-[0.2em] text-white shadow-[0_18px_50px_rgba(10,10,10,0.22)] transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {state === "generating" ? "Rendering..." : "Generate lesson video"}
            </button>
            <p className="text-sm text-neutral-500">{statusText}</p>
            {error ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>
            ) : null}
          </form>
        </div>

        <div className="rounded-[2rem] bg-white/45 p-5 shadow-[0_24px_90px_rgba(20,20,20,0.12)] backdrop-blur-2xl md:p-7">
          <div className="flex h-full flex-col">
            <div className="aspect-video overflow-hidden rounded-[1.5rem] border border-neutral-200 bg-neutral-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_24px_80px_rgba(20,20,20,0.16)]">
              {result ? (
                <video
                  key={result.video.publicUrl}
                  src={result.video.publicUrl}
                  controls
                  className="h-full w-full"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_30rem)] p-10 text-center">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.32em] text-neutral-400">Preview</p>
                    <p className="mt-4 max-w-md text-2xl font-semibold leading-snug text-white">
                      Your monochrome liquid-glass lesson will appear here after rendering.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <InfoCard label="Pipeline" value="Storyboard -> SVG motion -> MP4" />
              <InfoCard label="Storage" value={result ? result.video.jobId : "Local generated job"} />
            </div>

            {result ? (
              <div className="mt-6 rounded-[1.5rem] bg-white/55 p-5 shadow-inner shadow-white/50">
                <p className="text-sm font-bold uppercase tracking-[0.28em] text-neutral-500">Rendered Lesson</p>
                <h2 className="mt-4 font-[var(--font-display)] text-4xl leading-none tracking-[-0.05em] text-neutral-950">
                  {result.title}
                </h2>
                <div className="mt-5 flex flex-wrap gap-3">
                  <a
                    href={result.video.publicUrl}
                    download
                    className="rounded-full border border-neutral-950 bg-neutral-950 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-neutral-800"
                  >
                    Download MP4
                  </a>
                  <span className="rounded-full border border-neutral-200 bg-white/50 px-5 py-3 text-sm text-neutral-500">
                    Job {result.video.jobId}
                  </span>
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
    <div className="rounded-3xl bg-white/50 p-5 shadow-inner shadow-white/50">
      <p className="text-xs font-bold uppercase tracking-[0.28em] text-neutral-400">{label}</p>
      <p className="mt-3 text-sm font-semibold text-neutral-900">{value}</p>
    </div>
  );
}
