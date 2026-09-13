import type { FunctionTool } from "@openai/agents";

import type { MoneyPilotAgentContext } from "@/ai/agent";
import { loadAuthenticatedFinancialData } from "@/ai/services/financial-data";
import { parseToolInput, requireToolUserId } from "@/ai/tools/tool-utils";
import type { Goal } from "@/components/goals/goal-model";

function parseInput(value: unknown): Record<string, never> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value) || Object.keys(value).length > 0) return null;
  return {};
}

export const getGoals: FunctionTool<MoneyPilotAgentContext, undefined, Goal[]> = {
  type: "function",
  name: "get_goals",
  description: "Read the authenticated user's official financial goals.",
  parameters: { type: "object", properties: {}, required: [], additionalProperties: false },
  strict: true,
  needsApproval: async () => false,
  isEnabled: async () => true,
  errorFunction: async () => "Unable to access goals.",
  invoke: async (runContext, input) => {
    parseToolInput(input, parseInput);
    const userId = requireToolUserId(runContext);
    const data = await loadAuthenticatedFinancialData(userId);
    return data.goals;
  },
};