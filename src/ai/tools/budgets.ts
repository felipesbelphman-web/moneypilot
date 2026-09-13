import type { FunctionTool } from "@openai/agents";

import type { MoneyPilotAgentContext } from "@/ai/agent";
import { loadAuthenticatedFinancialData } from "@/ai/services/financial-data";
import { isRecord, optionalString, parseToolInput, requireToolUserId } from "@/ai/tools/tool-utils";
import type { Budget } from "@/components/budgets/budget-model";

function parseInput(value: unknown): { month?: string } | null {
  if (!isRecord(value)) return null;
  const month = optionalString(value, "month");
  if (month === null || (month && !/^\d{4}-(0[1-9]|1[0-2])$/.test(month))) return null;
  return month ? { month } : {};
}

export const getBudgets: FunctionTool<MoneyPilotAgentContext, undefined, Budget[]> = {
  type: "function",
  name: "get_budgets",
  description: "Read the authenticated user's official budgets.",
  parameters: {
    type: "object",
    properties: { month: { type: "string", description: "Optional budget month in YYYY-MM format." } },
    required: [],
    additionalProperties: false,
  },
  strict: true,
  needsApproval: async () => false,
  isEnabled: async () => true,
  errorFunction: async () => "Unable to access budgets.",
  invoke: async (runContext, input) => {
    const userId = requireToolUserId(runContext);
    const { month } = parseToolInput(input, parseInput);
    const data = await loadAuthenticatedFinancialData(userId);
    return data.budgets.filter((budget) => !month || budget.month === month);
  },
};