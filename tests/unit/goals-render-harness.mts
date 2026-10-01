// Offline component harness: no repositories, authentication or network are loaded.
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import React from "react";
import ts from "typescript";
import type { Goal } from "../../src/components/goals/goal-model.ts";
import type { Budget } from "../../src/components/budgets/budget-model.ts";
import type { GoalContributionPlan } from "../../src/components/goals/goal-contribution-plan.ts";
import type { Language } from "../../src/i18n/config.ts";
import { createFinanceResourceStatuses, beginFinanceResourceHydration, settleFinanceResourceStatuses, type FinanceResourceStatuses } from "../../src/lib/persistence/finance-resource-status.ts";
import type { TransactionPeriodState } from "../../src/lib/persistence/transaction-period-state.ts";
import type { TransactionDateRange } from "../../src/lib/persistence/finance-query-contracts.ts";
import type { Transaction } from "../../src/components/transactions/transaction-model.ts";
import { FinanceError } from "../../src/lib/domain/finance-error.ts";

const root = fileURLToPath(new URL("../../", import.meta.url));
const require = createRequire(import.meta.url);
export type Element = React.ReactElement<Record<string, unknown>>;
export function elements(node: React.ReactNode): Element[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!React.isValidElement<Record<string, unknown>>(node)) return [];
  return [node, ...elements(node.props.children as React.ReactNode)];
}
export function textOf(node: React.ReactNode): string {
  if (Array.isArray(node)) return node.map(textOf).filter(Boolean).join(" ");
  if (React.isValidElement<Record<string, unknown>>(node)) return textOf(node.props.children as React.ReactNode);
  return typeof node === "string" || typeof node === "number" ? String(node) : "";
}
export function goalsHarness({ goals = [], budgets = [], isHydrating = false, hydrationError = null, language = "en", resourceStatuses, period }: { goals?: Goal[]; budgets?: Budget[]; isHydrating?: boolean; hydrationError?: Error | null; language?: Language; resourceStatuses?: FinanceResourceStatuses; period?: TransactionPeriodState } = {}) {
  let clock = Date.now();
  class ControlledDate extends Date { constructor(...args: unknown[]) { super(); return Reflect.construct(Date, args.length ? args : [clock], new.target) as ControlledDate; } }
  const requests: TransactionDateRange[] = [];
  const writes: { type: string; value: unknown }[] = [];
  const data = { goals: [...goals], budgets, transactions: [] as Transaction[], period, budgetAdjustments: {}, goalContributionPlans: {} as Record<string, GoalContributionPlan>, isHydrating, hydrationError,
    resourceStatuses: resourceStatuses ?? (isHydrating ? beginFinanceResourceHydration(createFinanceResourceStatuses()) : settleFinanceResourceStatuses(createFinanceResourceStatuses(), hydrationError ? { transactions: new FinanceError("repository_unavailable") } : {})),
    getTransactionPeriodState: (range: TransactionDateRange): TransactionPeriodState => {
      if (data.period) return data.period;
      const status = data.resourceStatuses.transactions;
      if (status.status === "ready") {
        if (!fallback || fallback.result.range.startISO !== range.startISO) fallback = { status: "ready", result: { completeness: "complete", range, items: data.transactions } };
        return fallback;
      }
      return status.status === "error" ? { status: "error", error: status.error } : { status: status.status === "loading" ? "loading" : "idle" };
    },
    ensureTransactionPeriod: async (range: TransactionDateRange) => { requests.push(range); },
    upsertGoal: async (goal: Goal) => { writes.push({ type: "save", value: goal }); data.goals = [...data.goals.filter(item => item.id !== goal.id), goal]; return goal; },
    deleteGoal: async (id: string) => { writes.push({ type: "delete", value: id }); data.goals = data.goals.filter(item => item.id !== id); },
    upsertGoalContributionPlan: async (plan: GoalContributionPlan) => { writes.push({ type: "plan", value: plan }); data.goalContributionPlans[plan.goalId] = plan; },
  };
  let fallback: Extract<TransactionPeriodState, {status: "ready"}> | undefined;
  let cursor = 0;
  const memoValues: unknown[] = [];
  const memoDeps: (readonly unknown[] | undefined)[] = [];
  const effectDeps: (readonly unknown[] | undefined)[] = [];
  let effects: (() => void)[] = [];
  const hooks = {
    useMemo: (fn: () => unknown, deps?: readonly unknown[]) => { const index = cursor++; const prior = memoDeps[index]; if (!prior || !deps || deps.some((value, i) => !Object.is(value, prior[i]))) { memoValues[index] = fn(); memoDeps[index] = deps; } return memoValues[index]; },
    useRef: (initial: unknown) => { const index = cursor++; if (!(index in state)) state[index] = { current: initial }; return state[index]; },
    useEffect: (fn: () => void, deps?: readonly unknown[]) => { const index = cursor++; const prior = effectDeps[index]; if (!prior || !deps || deps.some((value, i) => !Object.is(value, prior[i]))) { effects.push(fn); effectDeps[index] = deps; } },
    useState: (initial: unknown) => { const index = cursor++; if (!(index in state)) state[index] = typeof initial === "function" ? initial() : initial; return [state[index], (value: unknown) => { state[index] = typeof value === "function" ? value(state[index]) : value; }]; },
  };
  const state: unknown[] = [];
  const cache = new Map<string, { exports: Record<string, unknown> }>();
  const load = (path: string): Record<string, unknown> => {
    const file = [path, `${path}.ts`, `${path}.tsx`].find(existsSync)!;
    const cached = cache.get(file); if (cached) return cached.exports;
    const loadedModule = { exports: {} as Record<string, unknown> }; cache.set(file, loadedModule);
    const page = file.replaceAll("\\", "/").endsWith("/app/goals/page.tsx");
    const localRequire = (id: string): unknown => {
      if (id.endsWith(".css")) return {};
      if (id === "react" && page) return { ...React, ...hooks };
      if (id === "next/image") return { __esModule: true, default: (props: Record<string, unknown>) => React.createElement("img", { ...props, src: props.src }) };
      if (id.endsWith("/FinanceDataProvider")) return { useFinanceData: () => data };
      if (id.endsWith("/LanguageProvider")) return { useLanguage: () => ({ language }) };
      if (id.endsWith("/CurrencyProvider")) return { useCurrency: () => ({ formatMoney: (value: number) => new Intl.NumberFormat(language, { style: "currency", currency: "EUR" }).format(value) }) };
      if (id.endsWith("/AccountAvatar")) return { AccountAvatar: () => React.createElement("span", { "aria-label": "Test account" }, "QA") };
      if (id.endsWith("/GoalsModalLayer")) return { GoalsModalLayer: ({ children }: { children: React.ReactNode }) => React.createElement("div", { className: "goals-modal-layer" }, children) };
      if (id.startsWith("@/")) return load(resolve(root, "src", id.slice(2)));
      if (id.startsWith(".")) return load(resolve(dirname(file), id));
      return require(id);
    };
    const output = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    runInNewContext(output, { exports: loadedModule.exports, module: loadedModule, require: localRequire, crypto: { randomUUID: () => "offline-goal-id" }, console, Date: ControlledDate, Intl }, { filename: file });
    return loadedModule.exports;
  };
  const Page = load(resolve(root, "src/app/goals/page.tsx")).default as () => React.ReactNode;
  return { data, writes, requests, setNow: (date: Date) => { clock = date.getTime(); }, render: () => { cursor = 0; effects = []; const tree = Page(); for (const effect of effects) effect(); return tree; } };
}
