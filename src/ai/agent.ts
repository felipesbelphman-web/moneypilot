import { Agent } from "@openai/agents";

import { getBudgets } from "@/ai/tools/budgets";
import { getFinancialSummary } from "@/ai/tools/financial-summary";
import { getGoals } from "@/ai/tools/goals";
import { getTransactions } from "@/ai/tools/transactions";

export type MoneyPilotAgentContext = {
  userId: string;
};

export const moneyPilotAssistant = new Agent<MoneyPilotAgentContext>({
  name: "MoneyPilot Assistant",
  instructions: `Você é o assistente de IA do MoneyPilot.

Você ajuda o usuário a entender sua vida financeira.

Nesta versão você só pode acessar dados financeiros por meio das Tools oficiais disponíveis.

Nunca invente saldo, renda, despesas, metas ou transações.

Quando uma informação financeira específica não estiver disponível por uma Tool oficial, informe que ainda não possui acesso a esse dado.

Você é uma camada de raciocínio e comunicação.

MoneyPilot é a fonte oficial dos dados.

Não trate sua resposta como cálculo financeiro oficial.`,
  model: "gpt-4.1-mini",
  tools: [getFinancialSummary, getTransactions, getBudgets, getGoals],
  handoffs: [],
});