import { Agent, CursorAgentError } from "@cursor/sdk";

export type CursorAgentResult = {
  text: string;
  runId: string;
};

export function requireCursorApiKey(): string {
  const key = process.env.CURSOR_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "CURSOR_API_KEY is required for the autonomous loop. Set it in .env (see .env.example).",
    );
  }
  return key;
}

/**
 * One-shot local Cursor agent. Returns final assistant text.
 */
export async function runCursorAgent(
  prompt: string,
  options: { model?: string; cwd?: string } = {},
): Promise<CursorAgentResult> {
  const apiKey = requireCursorApiKey();
  const model = options.model ?? process.env.CURSOR_AGENT_MODEL ?? "composer-2";
  const cwd = options.cwd ?? process.cwd();

  try {
    const result = await Agent.prompt(prompt, {
      apiKey,
      model: { id: model },
      local: { cwd },
    });

    if (result.status === "error") {
      throw new Error(`Cursor agent run failed (run id: ${result.id ?? "unknown"})`);
    }

    return {
      text: result.result?.trim() ?? "",
      runId: result.id ?? "unknown",
    };
  } catch (error: unknown) {
    if (error instanceof CursorAgentError) {
      throw new Error(`Cursor agent startup failed: ${error.message}`);
    }
    throw error;
  }
}
