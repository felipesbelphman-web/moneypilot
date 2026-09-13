import { OpenAIProvider, Runner } from "@openai/agents";

import { moneyPilotAssistant, type MoneyPilotAgentContext } from "@/ai/agent";

const AI_REQUEST_TIMEOUT_MS = 30_000;

// Server-side boundary for OpenAI agent execution. Financial access belongs to future Tools.
export async function runMoneyPilotAssistant(message: string, userId: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const provider = new OpenAIProvider({ apiKey });
  const runner = new Runner({
    modelProvider: provider,
    tracingDisabled: true,
    traceIncludeSensitiveData: false,
  });
  const context: MoneyPilotAgentContext = { userId };

  try {
    const result = await runner.run(moneyPilotAssistant, message, {
      context,
      maxTurns: 1,
      signal: AbortSignal.timeout(AI_REQUEST_TIMEOUT_MS),
    });

    if (typeof result.finalOutput !== "string" || !result.finalOutput.trim()) {
      throw new Error("AI agent returned an empty response");
    }

    return result.finalOutput.trim();
  } finally {
    await provider.close();
  }
}