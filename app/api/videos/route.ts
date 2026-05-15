import { NextResponse } from "next/server";
import { createVideoFromQuestion } from "@/lib/videos/create";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { question?: unknown };
    const question = typeof body.question === "string" ? body.question : "";
    const result = await createVideoFromQuestion(question);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate video";
    const status = message.includes("Question") || message.includes("specific") ? 400 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
