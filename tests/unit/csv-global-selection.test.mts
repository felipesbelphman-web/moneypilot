import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { parseTransactionCsv } from "../../src/components/transactions/csv-import.ts";

// The VM exposes untyped JSX nodes and heterogeneous React hook slots.
// Keep that dynamic boundary confined to this browser-free component harness.
/* eslint-disable @typescript-eslint/no-explicit-any */

import { readyStatuses } from "./finance-availability-render-harness.mts";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../../src/components/transactions/ImportStatementModal.tsx", import.meta.url), "utf8");
const copySource = readFileSync(new URL("../../src/i18n/csv-import-copy.ts", import.meta.url), "utf8");
function compile(source: string) {
  return ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
}
const copyModule = { exports: {} as any };
vm.runInNewContext(compile(copySource), { exports: copyModule.exports });

// Exercise the real component's event handlers and rerenders without a browser.
function setup(invalid = false) {
  const drafts = parseTransactionCsv("date,description,amount,type\n" + Array.from({ length: 521 }, (_, i) => `2026-09-17,Entry ${i},10,expense`).join("\n") + (invalid ? "\n31/02/2026,Invalid,10,expense" : ""));
  let cursor = 0;
  let refCursor = 0;
  const refs: any[] = [];
  const resourceStatuses = readyStatuses();
  const existingTransactions = drafts.filter(d => !d.errors.length);
  const state: any[] = [];
  let imports = 0;
  const react = {
    ...require("react"),
    useEffect() {},
    useLayoutEffect(fn: () => void) { fn(); },
    useRef: (initial: unknown) => { const index = refCursor++; return refs[index] ??= { current: initial }; },
    useId: () => "test-id",
    useMemo: (fn: () => unknown) => fn(),
    useState(initial: unknown) {
      const index = cursor++;
      if (!(index in state)) state[index] = initial;
      return [state[index], (value: any) => { state[index] = typeof value === "function" ? value(state[index]) : value; }];
    },
  };
  const exports: any = {};
  vm.runInNewContext(compile(source), { exports, Set, require(id: string) {
    if (id === "react") return react;
    if (id === "next/image") return { default: "img" };
    if (id === "@tabler/icons-react") return { IconCircleCheck: "i", IconLoader2: "i", IconX: "i" };
    if (id.includes("CurrencyProvider")) return { useCurrency: () => ({ formatMoney: (value: number) => String(value) }) };
    if (id.includes("LanguageProvider")) return { useLanguage: () => ({ language: "en" }) };
    if (id === "@/i18n/translations") return { translations: { en: { financialFlow: { months: [] } } } };
    if (id.includes("csv-import-copy")) return copyModule.exports;
    if (id.includes("finance-resource-status")) return require("../../src/lib/persistence/finance-resource-status.ts");
    if (id === "./transactions-view-state") return require("../../src/components/transactions/transactions-view-state.ts");
    if (id === "./csv-import") return require("../../src/components/transactions/csv-import.ts");
    if (id.includes("financial-input-adapters")) return {};
    if (id === "./csv-analysis") return {};
    if (id.endsWith(".css")) return { default: new Proxy({}, { get: (_, key) => key }) };
    return require(id);
  } });
  function render() {
    cursor = 0; refCursor = 0;
    return exports.ImportStatementModal({ existingTransactions, resourceStatuses, onImport: () => { imports++; return []; }, onClose() {} });
  }
  render();
  state[1] = drafts;
  state[3] = "review";
  function nodes(node: any, result: any[] = []): any[] {
    if (Array.isArray(node)) node.forEach(child => nodes(child, result));
    else if (node && typeof node === "object" && node.props) { result.push(node); nodes(node.props.children, result); }
    return result;
  }
  const text = (node: any): string => Array.isArray(node) ? node.map(text).join("") : node?.props ? text(node.props.children) : node == null || typeof node === "boolean" ? "" : String(node);
  const elements = () => nodes(render());
  const global = () => elements().find(n => n.type === "button" && "aria-pressed" in n.props);
  const clickAll = () => global().props.onClick();
  return { state, drafts, elements, global, clickAll, text, imports: () => imports };
}

test("global selection includes all 521 duplicate rows across 11 pages and deselects all", () => {
  const h = setup();
  h.clickAll();
  assert.equal(h.state[6].size, 521);
  assert.equal(h.global().props["aria-pressed"], true);
  assert.match(h.text(h.global()), /Deselect all/);
  assert.ok(h.elements().some(n => h.text(n) === "Possible duplicate"));
  h.clickAll();
  assert.equal(h.state[6].size, 0);
  assert.equal(h.global().props["aria-pressed"], false);
});

test("invalid rows stay unselected while selectable duplicates are included", () => {
  const h = setup(true);
  h.clickAll();
  assert.equal(h.state[6].size, 521);
  assert.equal(h.state[6].has(h.drafts[521].id), false);
  assert.equal(h.global().props["aria-pressed"], true);
});

test("Selected and final import CTA immediately reflect the global count without importing", () => {
  const h = setup(); h.clickAll();
  assert.ok(h.elements().some(n => n.props.role === "status" && /521.*Selected/i.test(h.text(n))));
  assert.ok(h.elements().some(n => n.type === "button" && h.text(n) === "Import 521 transactions"));
  assert.equal(h.imports(), 0);
});

test("page navigation preserves global selection and duplicate statuses", () => {
  const h = setup(); h.clickAll();
  h.elements().find(n => n.type === "button" && n.props["aria-label"] === "Next").props.onClick();
  assert.equal(h.state[9], 1);
  assert.equal(h.state[6].size, 521);
  const boxes = h.elements().filter(n => n.type === "input" && n.props.type === "checkbox");
  assert.equal(boxes.length, 50);
  assert.ok(boxes.every(n => n.props.checked));
  assert.equal(h.imports(), 0);
});

test("partial selection exposes mixed state and selecting all fills remaining pages", () => {
  const h = setup();
  const box = h.elements().find(n => n.type === "input" && n.props.type === "checkbox");
  box.props.onChange({ target: { checked: true } });
  assert.equal(h.global().props["aria-pressed"], "mixed");
  assert.match(h.text(h.global()), /Select all/);
  assert.ok(h.elements().some(n => n.props.role === "status" && /Partial selection/.test(h.text(n))));
  assert.equal(h.global().type, "button");
  assert.equal(h.global().props.type, "button");
  h.clickAll(); assert.equal(h.state[6].size, 521);
});

test("global selection is disabled while importing or when no rows are selectable", () => {
  const h = setup(); h.state[8] = true;
  assert.equal(h.global().props.disabled, true);
  h.state[8] = false; h.state[1] = [];
  assert.equal(h.global().props.disabled, true);
  assert.equal(h.global().props["aria-pressed"], false);
});

test("editing an invalid row uses existing selection rules without clearing other pages", () => {
  const h = setup(true); h.clickAll();
  h.state[9] = 10;
  const dates = h.elements().filter(n => n.type === "input" && n.props.type === "date");
  dates.at(-1).props.onChange({ target: { value: "2026-09-17" } });
  assert.equal(h.state[6].size, 522);
  assert.equal(h.global().props["aria-pressed"], true);
  assert.equal(h.imports(), 0);
});

test("global control reuses existing theme styles and all seven translated labels", () => {
  const css = readFileSync(new URL("../../src/components/transactions/ImportStatementModal.module.css", import.meta.url), "utf8");
  assert.match(source, /className=\{styles.selection\}>\s*<button type="button"/);
  assert.match(css, /\.selection button/);
  assert.match(css, /background: var\(--background-control\)/);
  assert.match(css, /border: 1px solid var\(--border-default\)/);
  for (const language of ["en", "pt", "es", "de", "fr", "nl", "it"]) {
    for (const key of ["selectAll", "deselectAll", "allSelected", "partialSelection"]) {
      assert.ok(copyModule.exports.csvImportLabels[language][key]);
    }
  }
});
