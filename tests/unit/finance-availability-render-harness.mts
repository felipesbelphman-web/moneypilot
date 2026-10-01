// Offline rendering of the real pages/components. No repositories or network.
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { createFinanceResourceStatuses, settleFinanceResourceStatuses, type FinanceResourceStatus, type FinanceResourceStatuses } from "../../src/lib/persistence/finance-resource-status.ts";
import { FinanceError } from "../../src/lib/domain/finance-error.ts";
import type { Transaction } from "../../src/components/transactions/transaction-model.ts";
import type { Goal } from "../../src/components/goals/goal-model.ts";
import type { Budget } from "../../src/components/budgets/budget-model.ts";
import type { BudgetAdjustment } from "../../src/components/budgets/budget-model.ts";
import type { GoalContributionPlan } from "../../src/components/goals/goal-contribution-plan.ts";

import type { TransactionPeriodState } from "../../src/lib/persistence/transaction-period-state.ts";
import type { TransactionDateRange } from "../../src/lib/persistence/finance-query-contracts.ts";

export const month = "2026-09";
export const readyStatuses = () => settleFinanceResourceStatuses(createFinanceResourceStatuses(), {});
export function withStatus(resource: keyof FinanceResourceStatuses, status: FinanceResourceStatus["status"], hasSnapshot = false): FinanceResourceStatuses {
  return { ...readyStatuses(), [resource]: status === "ready" ? { status, hasSnapshot: true, error: null } : { status, hasSnapshot, error: status === "error" ? new FinanceError("repository_unavailable") : null } } as FinanceResourceStatuses;
}
export function transaction(overrides: Partial<Transaction> = {}): Transaction {
  return { id: "expense", description: "Trusted grocery", amount: 20, type: "expense", dateISO: `${month}-10`, date: "10 Sep 2026", payment: "Card", origin: "Manual", category: "Food", categoryColor: "#000", classification: { kind: "legacy", categoryId: null, categoryNameSnapshot: "Food", categoryColorSnapshot: "#000", normalizedCategorySnapshot: "food" }, ...overrides };
}
export const goal: Goal = { id: "goal", name: "Independent goal", savedAmount: 100, targetAmount: 1000, targetDate: "2027-09", priority: "primary" };
export function financeData() {
  const data = { periods: new Map<string, TransactionPeriodState>(), period: undefined as TransactionPeriodState | undefined, requests: [] as TransactionDateRange[],
    getTransactionPeriodState: (range: TransactionDateRange): TransactionPeriodState => {
      if (data.periods.has(range.startISO)) return data.periods.get(range.startISO)!;
      if (data.period) return data.period;
      const status = data.resourceStatuses.transactions;
      return status.status === "ready" ? { status: "ready", result: { completeness: "complete", range, items: data.transactions.filter(row => row.dateISO >= range.startISO && row.dateISO < range.endExclusiveISO) } }
        : status.status === "error" ? { status: "error", error: status.error } : status.status === "loading" ? { status: "loading" } : { status: "error", error: new FinanceError("repository_unavailable") };
    },
    ensureTransactionPeriod: async (range: TransactionDateRange) => { data.requests.push(range); },
    transactions: [transaction({ id: "income", type: "income", amount: 100, category: "Salary" }), transaction()], budgets: [{ id: "budget", category: "Food", subtitle: "Food", budget: 200, month, color: "#000" }] as Budget[], budgetAdjustments: {} as Record<string, BudgetAdjustment>, goals: [goal] as Goal[], goalContributionPlans: {} as Record<string, GoalContributionPlan>, resourceStatuses: readyStatuses(), activeCategories: [], isHydrating: false, hydrationError: null as Error | null, mutationState: { status: "idle" } };
  return data;
}

const root = fileURLToPath(new URL("../../", import.meta.url));
const require = createRequire(import.meta.url);
export function availabilityHarness(data = financeData()) {
  const calls: string[] = [];
  let clock = new Date(2026, 8, 15).getTime();
  let cursor = 0;
  const refs: unknown[] = [];
  const memoValues: unknown[] = [];
  const memoDeps: (readonly unknown[] | undefined)[] = [];
  const effectDeps: (readonly unknown[] | undefined)[] = [];
  let effects: (() => void)[] = [];
  const insightHooks = {
    useMemo: (fn: () => unknown, deps?: readonly unknown[]) => { const index = cursor++; const prior = memoDeps[index]; if (!prior || !deps || deps.some((value, i) => !Object.is(value, prior[i]))) { memoValues[index] = fn(); memoDeps[index] = deps; } return memoValues[index]; },
    useRef: (initial: unknown) => { const index = cursor++; if (!(index in refs)) refs[index] = { current: initial }; return refs[index]; },
    useEffect: (fn: () => void, deps?: readonly unknown[]) => { const index = cursor++; const prior = effectDeps[index]; if (!prior || !deps || deps.some((value,i) => !Object.is(value,prior[i]))) { effects.push(fn); effectDeps[index] = deps; } },
  };
  const cache = new Map<string, { exports: Record<string, unknown> }>();
  const tracked = new Set(["calculateCurrentTransactionAggregates", "calculateTransactionKpiAggregates", "calculateDashboardFinancialSummary", "calculateNextBestAction", "calculateBudgetProjection", "calculateGoalSavingsCapacity", "calculateGoal", "selectPrimaryGoal"]);
  const load = (path: string): Record<string, unknown> => {
    const file = [path, `${path}.ts`, `${path}.tsx`].find(existsSync);
    if (!file) throw new Error(`Missing test module: ${path}`);
    const cached = cache.get(file); if (cached) return cached.exports;
    const loaded = { exports: {} as Record<string, unknown> }; cache.set(file, loaded);
    const localRequire = (id: string): unknown => {
      if (id === "react" && ["/app/insights/page.tsx", "/app/transactions/page.tsx"].some(path => file.replaceAll("\\", "/").endsWith(path))) return { ...React, ...insightHooks };
      if (id.endsWith(".css")) return {};
      if (id === "next/image") return { __esModule: true, default: () => null };
      if (id === "next/link") return { __esModule: true, default: ({ children }: { children: React.ReactNode }) => React.createElement("a", null, children) };
      if (id === "next/navigation") return { useSearchParams: () => new URLSearchParams(`month=${month}`) };
      if (id.endsWith("/FinanceDataProvider")) return { useFinanceData: () => data };
      if (id.endsWith("/LanguageProvider")) return { useLanguage: () => ({ language: "en" }) };
      if (id.endsWith("/CurrencyProvider")) return { useCurrency: () => ({ formatMoney: (value: number) => `EUR ${value.toFixed(2)}` }) };
      for (const name of ["AccountAvatar", "ThemeControl", "DashboardToast", "ImportStatementModal"]) if (id.endsWith(`/${name}`)) return { [name]: () => null };
      if (id.endsWith("/InsightsSpendingChart")) return { InsightsSpendingChart: (props: Record<string, unknown>) => React.createElement("div", { "data-chart-available": String(props.available) }, props.available ? `Chart ${props.total}` : String(props.emptyTitle)) };
      if (id.startsWith("@/")) return load(resolve(root, "src", id.slice(2)));
      if (id.startsWith(".")) return load(resolve(dirname(file), id));
      return require(id);
    };
    const output = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    class FixedDate extends Date {
      constructor(...args: unknown[]) { super(clock); if (args.length) return Reflect.construct(Date, args, new.target); }
    }
    runInNewContext(output, { exports: loaded.exports, module: loaded, require: localRequire, console, Date: FixedDate, Intl }, { filename: file });
    for (const name of tracked) {
      const fn = loaded.exports[name];
      if (typeof fn === "function") loaded.exports[name] = (...args: unknown[]) => { calls.push(name); return fn(...args); };
    }
    return loaded.exports;
  };
  return { data, calls, setNow: (date: Date) => { clock = date.getTime(); }, load: (file: string) => load(resolve(root, file)), render: (file: string, name = "default", props: Record<string, unknown> = {}) => {
    calls.length = 0; cursor = 0; effects = [];
    const Component = load(resolve(root, file))[name] as React.ComponentType<Record<string, unknown>>;
    const html = renderToStaticMarkup(React.createElement(Component, props));
    for (const effect of effects) effect();
    return html;
  } };
}
