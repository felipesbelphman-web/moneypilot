// Exercise real component handlers and rerenders offline, with persistence spies.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import React from "react";
import ts from "typescript";
import { financeData } from "./finance-availability-render-harness.mts";

const root = fileURLToPath(new URL("../../", import.meta.url));
const require = createRequire(import.meta.url);
export function nodes(node: any): any[] {
  return Array.isArray(node) ? node.flatMap(nodes) : node?.props ? [node, ...nodes(node.props.children)] : [];
}
export function text(node: any): string {
  return Array.isArray(node) ? node.map(text).join(" ") : node?.props ? text(node.props.children) : typeof node === "string" || typeof node === "number" ? String(node) : "";
}
export const category = { id: "cat", userId: "user", name: "Catalogue food", normalizedName: "catalogue food", type: "expense", iconKey: "tag", colorToken: "blue-500", archivedAt: null, createdAt: "2026-01-01", updatedAt: "2026-01-01" };
export function p03cHarness(options: { now?: Date; theme?: "light" | "dark" } = {}) {
  const calls: string[] = [];
  const account = { profile: { has_seen_welcome: false, display_name: "Synthetic" } };
  class FixedDate extends Date { constructor(...args: any[]) { super(options.now?.getTime() ?? Date.now()); if (args.length) return Reflect.construct(Date, args, new.target); } }
  const writes: any[] = [];
  const data: any = Object.assign(financeData(), { categories: [category], activeCategories: [category], investments: [],
    importTransactions: async (rows: any[]) => { writes.push(rows); return rows; },
  });
  for (const name of ["createCategory", "updateCategory", "archiveCategory", "restoreCategory", "createClassifiedTransaction", "updateTransaction", "linkTransactionCategory", "unlinkTransactionCategory"])
    data[name] = async (...args: any[]) => { writes.push({ name, args }); };
  const io: { analyseCsvFile: (...args: any[]) => Promise<any[]>; extractPdfText: (...args: any[]) => Promise<any[]> } = {
    analyseCsvFile: async () => [], extractPdfText: async () => [],
  };
  const cache = new Map<string, any>();
  let current: any;
  function load(path: string): any {
    const file = [path, `${path}.ts`, `${path}.tsx`].find(existsSync);
    if (!file) throw new Error(`Missing module ${path}`);
    if (cache.has(file)) return cache.get(file).exports;
    const mod = { exports: {} }; cache.set(file, mod);
    const hook = (initial: any) => { const i = current.cursor++; if (!(i in current.slots)) current.slots[i] = typeof initial === "function" ? initial() : initial; return i; };
    const react = { ...React,
      useState(initial: any) { const owner = current, i = hook(initial); return [owner.slots[i], (next: any) => { owner.slots[i] = typeof next === "function" ? next(owner.slots[i]) : next; owner.dirty = true; }]; },
      useRef(initial: any) { return current.slots[hook({ current: initial })]; },
      useMemo(fn: () => any, deps?: readonly unknown[]) {
        const i = hook(() => ({ value: fn(), deps })), previous = current.slots[i];
        if (!deps || !previous.deps || deps.some((value, index) => !Object.is(value, previous.deps[index]))) current.slots[i] = { value: fn(), deps };
        return current.slots[i].value;
      }, useCallback(fn: any) { return fn; }, useId() { return "test-id"; },
      useEffect(fn: () => void, deps?: readonly unknown[]) {
        if (!(file.replaceAll("\\", "/").endsWith("app/transactions/page.tsx") && current.componentName === "TransactionsPageContent") && !(file.replaceAll("\\", "/").endsWith("app/dashboard/page.tsx") && current.componentName === "DashboardPage")) return;
        const i = hook(() => ({ deps: undefined })), previous = current.slots[i];
        if (!deps || !previous.deps || deps.some((value, index) => !Object.is(value, previous.deps[index]))) {
          current.effects.push(fn); current.slots[i] = { deps };
        }
      }, useLayoutEffect(fn: () => void) { current.effects.push(fn); },
    };
    const localRequire = (id: string): any => {
      if (id === "react") return react;
      if (id === "react-dom") return { createPortal: (children: any) => children };
      if (id.endsWith(".css")) return { __esModule: true, default: new Proxy({}, { get: (_, key) => key }) };
      if (id === "next/image" || id === "next/link") return { __esModule: true, default: "span" };
      if (id === "next/navigation") return { useSearchParams: () => new URLSearchParams("month=2026-09"), useRouter: () => ({ back() {} }) };
      if (id.endsWith("/AccountProfileProvider")) return { useAccountProfile: () => ({ account }) };
      if (id === "@/app/settings/actions") return { markWelcomeSeen: async () => { calls.push("markWelcomeSeen"); } };
      if (id.endsWith("/FinanceDataProvider")) return { useFinanceData: () => data };
      if (id.endsWith("/LanguageProvider")) return { useLanguage: () => ({ language: "en" }) };
      if (id.endsWith("/CurrencyProvider")) return { useCurrency: () => ({ formatMoney: (n: number) => String(n) }) };
      if (id.endsWith("/ThemeProvider")) return { useTheme: () => ({ theme: options.theme ?? "dark" }) };
      if (id.endsWith("/csv-analysis")) return { analyseCsvFile: (...args: any[]) => io.analyseCsvFile(...args) };
      if (id.endsWith("/pdf-text-extractor")) return { extractPdfText: (...args: any[]) => io.extractPdfText(...args) };
      for (const name of ["AccountAvatar", "ThemeControl", "DashboardToast"]) if (id.endsWith(`/${name}`)) return { [name]: name };
      if (id.startsWith("@/")) return load(resolve(root, "src", id.slice(2)));
      if (id.startsWith(".")) return load(resolve(dirname(file), id));
      return require(id);
    };
    let source = readFileSync(file, "utf8");
    if (file.replaceAll("\\", "/").endsWith("app/transactions/page.tsx")) source += "\nexport { TransactionModal, TransactionsPageContent };";
    if (file.replaceAll("\\", "/").endsWith("app/budgets/page.tsx")) source += "\nexport { BudgetModal, BudgetsPageContent };";
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    runInNewContext(compiled, { exports: mod.exports, module: mod, require: localRequire, console, Set, Map, Date: options.now ? FixedDate : Date, Intl, URL, window: { location: { href: "http://localhost/transactions" }, history: { replaceState() {} } }, URLSearchParams, AbortController, crypto: { randomUUID: () => "test-id" }, document: { body: {} } }, { filename: file });
    for (const name of ["calculateDashboardTransactionSummary", "calculateBudgetProjection", "calculateGoalSavingsCapacity", "calculateNextBestAction", "eventsFromTransactions"]) {
      const fn = (mod.exports as any)[name];
      if (typeof fn === "function") (mod.exports as any)[name] = (...args: any[]) => { calls.push(name); return fn(...args); };
    }
    return mod.exports;
  }
  function mount(file: string, name = "default", initialProps: any = {}) {
    const component = load(resolve(root, file))[name];
    return mountComponent(component, initialProps);
  }
  function mountComponent(component: any, initialProps: any = {}) {
    const owner = { componentName: component.name, slots: [] as any[], cursor: 0, effects: [] as (() => void)[], dirty: false };
    let props = initialProps;
    return { render(nextProps = props) {
      props = nextProps;
      let tree: any;
      for (let attempts = 0; attempts < 10; attempts++) {
        current = owner; owner.cursor = 0; owner.effects = []; owner.dirty = false;
        tree = component(props);
        if (!owner.dirty) { owner.effects.forEach(fn => fn()); return tree; }
      }
      throw new Error("Render loop");
    } };
  }
  return { data, writes, calls, io, mount, mountComponent, load: (file: string) => load(resolve(root, file)) };
}
