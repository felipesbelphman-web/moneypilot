import type { RunContext } from "@openai/agents";

import type { MoneyPilotAgentContext } from "@/ai/agent";

export function requireToolUserId(runContext: RunContext<MoneyPilotAgentContext>): string {
  const userId = runContext.context?.userId;
  if (!userId) {
    throw new Error("Authenticated user context is required");
  }

  return userId;
}

export function parseToolInput<T>(input: string, parse: (value: unknown) => T | null): T {
  let value: unknown;
  try {
    value = JSON.parse(input);
  } catch {
    throw new Error("Invalid tool input");
  }

  const parsed = parse(value);
  if (!parsed) {
    throw new Error("Invalid tool input");
  }

  return parsed;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function optionalString(value: Record<string, unknown>, key: string): string | undefined | null {
  if (!(key in value)) return undefined;
  return typeof value[key] === "string" && value[key].trim() ? value[key].trim() : null;
}

export function optionalInteger(value: Record<string, unknown>, key: string, min: number, max: number): number | undefined | null {
  if (!(key in value)) return undefined;
  return typeof value[key] === "number" && Number.isInteger(value[key]) && value[key] >= min && value[key] <= max
    ? value[key]
    : null;
}