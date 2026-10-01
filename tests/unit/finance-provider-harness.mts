// Runs the real provider lifecycle with offline repositories and controlled promises.
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import React from "react";
import ts from "typescript";
import type { useFinanceData } from "../../src/components/FinanceDataProvider.tsx";
import type { FinanceLoadResult } from "../../src/lib/persistence/finance-persistence-model.ts";
import type { GoalContributionPlan } from "../../src/components/goals/goal-contribution-plan.ts";
import type { Transaction } from "../../src/components/transactions/transaction-model.ts";

import type { CompletePeriodResult, TransactionDateRange } from "../../src/lib/persistence/finance-query-contracts.ts";
type Context = ReturnType<typeof useFinanceData>;
const root = fileURLToPath(new URL("../../", import.meta.url));
const require = createRequire(import.meta.url);

export function financeProviderHarness({ authFails = false, categoriesFail = false } = {}) {
  const loads: { userId: string; resolve: (result: FinanceLoadResult) => void; reject: (error: unknown) => void }[] = [];
  const plans: GoalContributionPlan[] = [];
  const periods: { userId: string; range: TransactionDateRange; resolve: (result: CompletePeriodResult<Transaction>) => void; reject: (error: unknown) => void }[] = [];
  const writes: { operation: string; userId: string; input: unknown; resolve: (result: unknown) => void; reject: (error: unknown) => void }[] = [];
  let controlledWrites = false;
  function write(operation: string, userId: string, input: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => writes.push({ operation, userId, input, resolve, reject }));
  }
  let authListener: (event: string, session: { user: { id: string } } | null) => void = () => {};
  const client = { auth: {
    getUser: async () => ({ data: { user: { id: "user-a" } }, error: authFails ? new Error("private auth error") : null }),
    onAuthStateChange: (listener: typeof authListener) => { authListener = listener; return { data: { subscription: { unsubscribe() {} } } }; },
  } };
  class Repository {
    loadFinanceData(userId: string) { return new Promise<FinanceLoadResult>((resolve, reject) => loads.push({ userId, resolve, reject })); }
    async upsertGoalContributionPlan(_userId: string, plan: GoalContributionPlan) { plans.push(plan); return plan; }
    listTransactionsForPeriod(userId: string, range: TransactionDateRange) { return new Promise<CompletePeriodResult<Transaction>>((resolve, reject) => periods.push({ userId, range, resolve, reject })); }
    async createTransaction(userId: string, transaction: Transaction) { return controlledWrites ? write("create", userId, transaction) : transaction; }
    createTransactions(userId: string, input: unknown) { return write("import", userId, input); }
    updateTransaction(userId: string, input: unknown) { return write("update", userId, input); }
    updateTransactionClassification(userId: string, input: unknown) { return write("classify", userId, input); }
    deleteTransaction(userId: string, input: unknown) { return write("delete", userId, input); }
  }
  class CategoryRepository {
    async listAllCategories() { if (categoriesFail) throw new TypeError("private network error"); return []; }
  }
  let cursor = 0;
  const state: unknown[] = [];
  let effect: (() => void | (() => void)) | undefined;
  let mounted = false;
  const cache = new Map<string, { exports: Record<string, unknown> }>();
  const load = (path: string): Record<string, unknown> => {
    const file = [path, `${path}.ts`, `${path}.tsx`].find(existsSync)!;
    const cached = cache.get(file); if (cached) return cached.exports;
    const loadedModule = { exports: {} as Record<string, unknown> }; cache.set(file, loadedModule);
    const localRequire = (id: string): unknown => {
      if (id === "react") return { ...React,
        useState: (initial: unknown) => {
          const index = cursor++;
          if (!(index in state)) state[index] = typeof initial === "function" ? initial() : initial;
          return [state[index], (value: unknown) => { state[index] = typeof value === "function" ? value(state[index]) : value; }];
        },
        useRef: (initial: unknown) => { const index = cursor++; if (!(index in state)) state[index] = { current: initial }; return state[index]; },
        useMemo: (fn: () => unknown) => fn(),
        useCallback: (fn: unknown) => fn,
        useEffect: (fn: typeof effect) => { if (!mounted) effect = fn; },
      };
      if (id.endsWith("/supabase/client")) return { createClient: () => client };
      if (id.endsWith("/supabase-finance-repository")) return { SupabaseFinanceRepository: Repository };
      if (id.endsWith("/supabase-category-repository")) return { SupabaseCategoryRepository: CategoryRepository };
      if (id.startsWith("@/")) return load(resolve(root, "src", id.slice(2)));
      if (id.startsWith(".")) return load(resolve(dirname(file), id));
      return require(id);
    };
    const output = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    runInNewContext(output, { exports: loadedModule.exports, module: loadedModule, require: localRequire, console, Date, Intl, queueMicrotask }, { filename: file });
    return loadedModule.exports;
  };
  const Provider = load(resolve(root, "src/components/FinanceDataProvider.tsx")).FinanceDataProvider as (props: { children: null }) => React.ReactElement<{ value: Context }>;
  const render = () => { cursor = 0; return Provider({ children: null }).props.value; };
  render(); mounted = true;
  const cleanup = effect?.();
  return {
    loads, plans, periods, writes, render,
    controlWrites: () => { controlledWrites = true; },
    auth: (userId: string | null) => authListener("SIGNED_IN", userId ? { user: { id: userId } } : null),
    flush: async () => { await new Promise<void>(resolve => setImmediate(resolve)); return render(); },
    dispose: () => cleanup?.(),
  };
}
