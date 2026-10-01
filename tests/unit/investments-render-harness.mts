// Offline UI harness. The real domain calculations run; persistence stays in memory.
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import React from "react";
import ts from "typescript";
import type { Investment } from "../../src/components/investments/investment-model.ts";
import type { Language } from "../../src/i18n/config.ts";

import { readyStatuses, withStatus } from "./finance-availability-render-harness.mts";

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
export function investmentsHarness({ investments = [], language = "en", isHydrating = false, hydrationError = null, failSave = false, theme = "light" }: { investments?: Investment[]; language?: Language; isHydrating?: boolean; hydrationError?: Error | null; failSave?: boolean; theme?: string } = {}) {
  const writes: Investment[] = [];
  const data = { resourceStatuses: isHydrating ? withStatus("investments", "loading") : readyStatuses(), investments: [...investments], isHydrating, hydrationError,
    upsertInvestment: async (investment: Investment) => {
      if (failSave) throw new Error("private database detail");
      writes.push(investment); data.investments = [...data.investments.filter(item => item.id !== investment.id), investment]; return investment;
    },
  };
  const cache = new Map<string, { exports: Record<string, unknown> }>();
  const load = (path: string): Record<string, unknown> => {
    const file = [path, `${path}.ts`, `${path}.tsx`].find(existsSync)!;
    const cached = cache.get(file); if (cached) return cached.exports;
    const loadedModule = { exports: {} as Record<string, unknown> }; cache.set(file, loadedModule);
    const state: unknown[] = []; let cursor = 0;
    const useState = (initial: unknown) => { const index = cursor++; if (!(index in state)) state[index] = initial; return [state[index], (value: unknown) => { state[index] = value; }]; };
    const localRequire = (id: string): unknown => {
      if (id.endsWith(".css")) return {};
      if (id === "react") return { ...React, useState, useRef: (initial: unknown) => useState({ current: initial })[0], useEffect: () => {} };
      if (id === "react-dom") return { createPortal: (children: React.ReactNode) => children };
      if (id === "next/image") return { __esModule: true, default: (props: Record<string, unknown>) => React.createElement("img", props) };
      if (id.endsWith("/FinanceDataProvider")) return { useFinanceData: () => data };
      if (id.endsWith("/LanguageProvider")) return { useLanguage: () => ({ language }) };
      if (id.endsWith("/ThemeProvider")) return { useTheme: () => ({ theme }) };
      if (id.endsWith("/AccountAvatar")) return { AccountAvatar: () => React.createElement("span", { "aria-label": "Offline test account" }, "QA") };
      if (id.startsWith("@/")) return load(resolve(root, "src", id.slice(2)));
      if (id.startsWith(".")) return load(resolve(dirname(file), id));
      return require(id);
    };
    const output = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    runInNewContext(output, { exports: loadedModule.exports, module: loadedModule, require: localRequire, document: { body: {} }, crypto: { randomUUID: () => "offline-investment-id" }, console, Date, Intl }, { filename: file });
    if (file.endsWith(".tsx")) for (const [name, value] of Object.entries(loadedModule.exports)) {
      if (typeof value !== "function") continue;
      const component = (props: unknown) => { cursor = 0; return value(props); };
      Object.defineProperty(component, "name", { value: name === "default" ? "InvestmentsPage" : name });
      loadedModule.exports[name] = component;
    }
    return loadedModule.exports;
  };
  const Page = load(resolve(root, "src/app/investments/page.tsx")).default as () => React.ReactNode;
  return { data, writes, render: Page, expand: (element: Element) => (element.type as (props: unknown) => React.ReactNode)(element.props) };
}
