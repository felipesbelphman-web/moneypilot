/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from "node:assert/strict";
import { test } from "node:test";
import { p03cHarness, nodes, text, category } from "./p03c-render-harness.mts";
import { readyStatuses, withStatus, transaction } from "./finance-availability-render-harness.mts";
import { parseTransactionCsv } from "../../src/components/transactions/csv-import.ts";

const csvFile = "src/components/transactions/ImportStatementModal.tsx";
const pdfFile = "src/components/statements/PdfStatementReview.tsx";
const csvDrafts = () => parseTransactionCsv("date,description,amount,type\n2026-09-10,Imported meal,20,expense");
const tick = () => new Promise(resolve => setImmediate(resolve));
const button = (tree: any, label: string) => nodes(tree).find(n => n.type === "button" && (label === "Select valid rows" ? /^Select valid/.test(text(n).trim()) : text(n).trim() === label));
const importButton = (tree: any) => nodes(tree).find(n => n.type === "button" && /^Import \d/.test(text(n).trim()));
const checks = (tree: any) => nodes(tree).filter(n => n.type === "input" && n.props.type === "checkbox");
async function review(kind: "csv" | "pdf", statuses = readyStatuses(), history: any[] = []) {
  const h = p03cHarness(); h.data.resourceStatuses = statuses; h.data.transactions = history;
  h.io.analyseCsvFile = async () => csvDrafts();
  h.io.extractPdfText = async () => [{ pageNumber: 1, lines: ["2026-09-10 Imported meal -20.00"] }];
  const props = () => ({ existingTransactions: h.data.transactions, resourceStatuses: h.data.resourceStatuses, onImport: h.data.importTransactions, onClose() {} });
  const mounted = h.mount(kind === "csv" ? csvFile : pdfFile, kind === "csv" ? "ImportStatementModal" : "PdfStatementReview", props());
  const render = () => mounted.render(props());
  nodes(render()).find(n => n.type === "input" && n.props.type === "file").props.onChange({ target: { files: [{ name: `file.${kind}`, size: 100, type: kind === "csv" ? "text/csv" : "application/pdf" }] } });
  await tick();
  return { ...h, render };
}

for (const kind of ["csv", "pdf"] as const) {
  for (const status of ["loading", "error", "unavailable"] as const) for (const retained of [false, true]) {
    test(`${kind}: ${status}, retained=${retained}, keeps drafts unapproved and blocks forced handlers`, async () => {
      const h = await review(kind, withStatus("transactions", status, retained), retained ? [transaction()] : []);
      let tree = h.render();
      assert.equal(checks(tree).length, 1);
      assert.equal(checks(tree)[0].props.checked, false);
      assert.equal(checks(tree)[0].props.disabled, true);
      assert.equal(importButton(tree).props.disabled, true);
      checks(tree)[0].props.onChange({ target: { checked: true } });
      button(tree, "Select valid rows").props.onClick();
      nodes(tree).find(n => n.type === "input" && n.props.value === "Imported meal").props.onChange({ target: { value: "Edited meal" } });
      tree = h.render();
      assert.equal(checks(tree)[0].props.checked, false);
      await importButton(tree).props.onClick(); await tick();
      assert.equal(h.writes.length, 0);
      assert.ok(text(tree).includes("Edited meal") || nodes(tree).some(n => n.props.value === "Edited meal"));
      assert.ok(nodes(tree).some(n => n.props.role === (status === "loading" ? "status" : "alert")));
    });
  }
  test(`${kind}: ready empty history can import, despite unrelated category failure`, async () => {
    const h = await review(kind, withStatus("categories", "error"));
    button(h.render(), "Select valid rows").props.onClick();
    if (kind === "pdf") checks(h.render()).at(-1).props.onChange({ target: { checked: true } });
    assert.equal(importButton(h.render()).props.disabled, false);
    await importButton(h.render()).props.onClick(); await tick();
    assert.equal(h.writes.length, 1);
    assert.equal(h.writes[0].length, 1);
  });
  test(`${kind}: availability loss invalidates old callbacks and recovery rechecks changed history`, async () => {
    const h = await review(kind);
    button(h.render(), "Select valid rows").props.onClick();
    if (kind === "pdf") checks(h.render()).at(-1).props.onChange({ target: { checked: true } });
    const oldImport = importButton(h.render()).props.onClick;
    const oldSelect = checks(h.render())[0].props.onChange;
    h.data.resourceStatuses = withStatus("transactions", "error", true);
    assert.equal(importButton(h.render()).props.disabled, true);
    oldSelect({ target: { checked: true } }); await oldImport(); await tick();
    assert.equal(h.writes.length, 0);
    h.data.transactions = [transaction({ description: "Imported meal" })]; h.data.resourceStatuses = readyStatuses();
    let tree = h.render();
    assert.equal(checks(tree)[0].props.checked, false);
    assert.equal(importButton(tree).props.disabled, true);
    assert.ok(text(tree).includes("Possible duplicate"));
    button(tree, "Select valid rows").props.onClick();
    assert.equal(checks(h.render())[0].props.checked, false);
    if (kind === "csv") {
      nodes(h.render()).find(n => n.type === "button" && "aria-pressed" in n.props).props.onClick();
      tree = h.render(); assert.equal(checks(tree)[0].props.checked, true);
      await importButton(tree).props.onClick(); await tick(); assert.equal(h.writes.length, 1);
    } else assert.equal(checks(tree)[0].props.disabled, true);
  });
  test(`${kind}: changed ready snapshot also revokes review approval`, async () => {
    const h = await review(kind); button(h.render(), "Select valid rows").props.onClick();
    if (kind === "pdf") checks(h.render()).at(-1).props.onChange({ target: { checked: true } });
    h.data.transactions = [transaction()];
    assert.equal(importButton(h.render()).props.disabled, true);
    assert.equal(checks(h.render())[0].props.checked, false);
  });
  test(`${kind}: async parsing completing after failure cannot approve against captured history`, async () => {
    const h = p03cHarness(); h.data.transactions = [];
    let finish!: (value: any[]) => void;
    const pending = new Promise<any[]>(resolve => { finish = resolve; });
    h.io.analyseCsvFile = () => pending; h.io.extractPdfText = () => pending;
    const props = () => ({ existingTransactions: h.data.transactions, resourceStatuses: h.data.resourceStatuses, onImport: h.data.importTransactions, onClose() {} });
    const m = h.mount(kind === "csv" ? csvFile : pdfFile, kind === "csv" ? "ImportStatementModal" : "PdfStatementReview", props());
    nodes(m.render()).find(n => n.type === "input" && n.props.type === "file").props.onChange({ target: { files: [{ name: `file.${kind}`, size: 100, type: kind === "csv" ? "text/csv" : "application/pdf" }] } });
    h.data.resourceStatuses = withStatus("transactions", "error"); m.render(props());
    finish(kind === "csv" ? csvDrafts() : [{ pageNumber: 1, lines: ["2026-09-10 Imported meal -20.00"] }]); await tick();
    assert.equal(importButton(m.render(props())).props.disabled, true);
    h.data.resourceStatuses = readyStatuses();
    assert.equal(checks(m.render(props()))[0].props.checked, false);
  });
}

for (const status of ["loading", "error", "unavailable"] as const) {
  test(`Investments ${status} does not even inspect unavailable holdings`, () => {
    const h = p03cHarness(); h.data.resourceStatuses = withStatus("investments", status, true);
    h.data.investments = new Proxy([], { get() { throw new Error("Unavailable holdings consumed"); } });
    const tree = h.mount("src/app/investments/page.tsx").render();
    assert.ok(!nodes(tree).some(n => n.type?.name === "InvestmentAssetsList"));
    assert.ok(nodes(tree).some(n => n.props.role === (status === "loading" ? "status" : "alert")));
  });
  test(`Categories ${status} does not inspect unavailable catalogue or show empty counts`, () => {
    const h = p03cHarness(); h.data.resourceStatuses = withStatus("categories", status, true);
    h.data.categories = h.data.activeCategories = new Proxy([], { get() { throw new Error("Unavailable catalogue consumed"); } });
    const tree = h.mount("src/app/categories/page.tsx").render();
    const mobile = nodes(tree).find(n => n.type?.name === "MobileCategories");
    assert.equal(mobile.props.visible, null); assert.equal(mobile.props.activeCount, null);
    const mobileTree = h.mountComponent(mobile.type, mobile.props).render();
    assert.ok(!text(mobileTree).includes("No active categories"));
    assert.ok(nodes(mobileTree).some(n => n.props.role === (status === "loading" ? "status" : "alert")));
  });
}

test("Categories retains ready data despite unrelated failure and rejects already-open mutations after loss", async () => {
  const h = p03cHarness(); h.data.resourceStatuses = withStatus("investments", "error");
  const page = h.mount("src/app/categories/page.tsx");
  const mobile = () => nodes(page.render()).find(n => n.type?.name === "MobileCategories");
  assert.equal(mobile().props.activeCount, 1);
  mobile().props.openEdit(category);
  const oldSubmit = mobile().props.submit;
  h.data.resourceStatuses = withStatus("categories", "error", true); page.render();
  await oldSubmit({ preventDefault() {} }); assert.equal(h.writes.length, 0);
  h.data.resourceStatuses = readyStatuses(); page.render();
  await mobile().props.submit({ preventDefault() {} }); assert.equal(h.writes[0].name, "updateCategory");
  mobile().props.setEditor({ mode: "confirm", category });
  const oldConfirm = mobile().props.confirm;
  h.data.resourceStatuses = withStatus("categories", "loading", true); page.render();
  await oldConfirm(); assert.equal(h.writes.length, 1);
});

test("Transaction classification controls do not infer archived from an unavailable catalogue", async () => {
  const h = p03cHarness();
  const saved = transaction({ classification: { kind: "linked", categoryId: "cat", categoryNameSnapshot: "Historical food", categoryColorSnapshot: "#000", normalizedCategorySnapshot: "historical food" }, category: "Historical food" });
  const props = { transaction: saved, categories: [], resourceStatuses: withStatus("categories", "error", true), focusCategory: false, saving: false, onSubmit: async (input: any) => { h.writes.push(input); }, onClose() {} };
  const form = h.mount("src/app/transactions/page.tsx", "TransactionModal", props);
  const tree = form.render();
  assert.ok(!text(tree).includes("(archived)")); assert.ok(text(tree).includes("Historical food"));
  assert.ok(nodes(tree).find(n => n.type === "select" && n.props.value === "cat").props.disabled);
  assert.equal(nodes(tree).find(n => n.type === "button" && n.props.type === "submit").props.disabled, false);
  await nodes(tree).find(n => n.type === "form").props.onSubmit({ preventDefault() {} });
  assert.equal(h.writes.length, 1); assert.equal(h.writes[0].categoryId, "cat");
});

test("An open transaction form cannot submit a changed classification after catalogue loss", async () => {
  const h = p03cHarness();
  const props = { transaction: transaction(), categories: [category], resourceStatuses: readyStatuses(), focusCategory: false, saving: false, onSubmit: async (input: any) => { h.writes.push(input); }, onClose() {} };
  const form = h.mount("src/app/transactions/page.tsx", "TransactionModal", props);
  nodes(form.render()).find(n => n.type === "select" && n.props.value === "").props.onChange({ target: { value: "cat" } });
  const oldSubmit = nodes(form.render()).find(n => n.type === "form").props.onSubmit;
  const unavailable = { ...props, resourceStatuses: withStatus("categories", "loading", true) };
  assert.equal(nodes(form.render(unavailable)).find(n => n.props.type === "submit").props.disabled, true);
  await oldSubmit({ preventDefault() {} }); assert.equal(h.writes.length, 0);
  await nodes(form.render(props)).find(n => n.type === "form").props.onSubmit({ preventDefault() {} });
  assert.equal(h.writes.length, 1);
});

test("Transaction page guards classified creation and linking even through captured modal callbacks", async () => {
  const h = p03cHarness();
  const page = h.mount("src/app/transactions/page.tsx", "TransactionsPageContent", { initialMonth: "2026-09", currentMonth: "2026-09", openStatementImport: false });
  nodes(page.render()).find(n => n.props.className === "transactions-new").props.onClick();
  const create = nodes(page.render()).find(n => n.type?.name === "TransactionModal").props.onSubmit;
  h.data.resourceStatuses = withStatus("categories", "error", true); page.render();
  const input = { description: "Dinner", amount: 20, categoryId: "cat", removeLegacyClassification: false, type: "expense", dateISO: "2026-09-10", payment: "Not specified" };
  await assert.rejects(create(input)); assert.equal(h.writes.length, 0);
  h.data.resourceStatuses = readyStatuses();
  nodes(page.render()).find(n => n.type?.name === "TransactionsTable").props.onEdit(transaction());
  const edit = nodes(page.render()).find(n => n.type?.name === "TransactionModal").props.onSubmit;
  h.data.resourceStatuses = withStatus("categories", "loading", true); page.render();
  await assert.rejects(edit(input)); assert.equal(h.writes.length, 0);
  await edit({ ...input, categoryId: null });
  assert.ok(h.writes.some(w => w.name === "updateTransaction"));
  assert.ok(!h.writes.some(w => /Category/.test(w.name)));
});

test("Budget suggestions retain historical names, omit unavailable catalogue, and preserve free text", () => {
  const h = p03cHarness(); h.data.resourceStatuses = withStatus("categories", "error", true);
  h.data.activeCategories = new Proxy([], { get() { throw new Error("Unavailable suggestions consumed"); } });
  const page = h.mount("src/app/budgets/page.tsx", "BudgetsPageContent", { initialMonth: "2026-09", currentMonth: "2026-09" });
  nodes(page.render()).find(n => n.props.className === "budgets-new").props.onClick();
  const modal = nodes(page.render()).find(n => n.type?.name === "BudgetModal");
  assert.deepEqual(Array.from(modal.props.categories, (item: any) => item.category), ["Food"]);
  const form = h.mountComponent(modal.type, { ...modal.props, onSubmit: (budget: any) => h.writes.push(budget) });
  const inputs = nodes(form.render()).filter(n => n.type === "input");
  inputs[0].props.onChange({ target: { value: "Independent custom category" } });
  inputs[1].props.onChange({ target: { value: "100" } });
  nodes(form.render()).find(n => n.type === "form").props.onSubmit({ preventDefault() {} });
  assert.equal(h.writes[0].category, "Independent custom category");
  h.data.activeCategories = [category]; h.data.resourceStatuses = readyStatuses();
  assert.equal(nodes(page.render()).find(n => n.type?.name === "BudgetModal").props.categories.length, 2);
});

test("Successful empty Investments and Categories remain valid empty states; unrelated errors do not block", () => {
  const h = p03cHarness(); h.data.resourceStatuses = withStatus("transactions", "error");
  h.data.hydrationError = new Error("unrelated"); h.data.categories = []; h.data.activeCategories = [];
  const investments = h.mount("src/app/investments/page.tsx").render();
  const list = nodes(investments).find(n => n.type?.name === "InvestmentAssetsList");
  assert.equal(list.props.investments.length, 0);
  const categories = h.mount("src/app/categories/page.tsx").render();
  const mobile = nodes(categories).find(n => n.type?.name === "MobileCategories");
  assert.equal(mobile.props.visible.length, 0); assert.equal(mobile.props.activeCount, 0);
  assert.equal(mobile.props.hasLoadError, false);
});

test("Classification is rechecked after an awaited financial-field update", async () => {
  const h = p03cHarness();
  let finish!: () => void;
  h.data.updateTransaction = () => new Promise<void>(resolve => { finish = resolve; });
  const page = h.mount("src/app/transactions/page.tsx", "TransactionsPageContent", { initialMonth: "2026-09", currentMonth: "2026-09", openStatementImport: false });
  nodes(page.render()).find(n => n.type?.name === "TransactionsTable").props.onEdit(transaction());
  const edit = nodes(page.render()).find(n => n.type?.name === "TransactionModal").props.onSubmit;
  const saving = edit({ description: "Changed meal", amount: 20, categoryId: "cat", removeLegacyClassification: false, type: "expense", dateISO: "2026-09-10", payment: "Not specified" });
  h.data.resourceStatuses = withStatus("categories", "error", true); page.render();
  finish(); await assert.rejects(saving);
  assert.equal(h.writes.length, 0);
});

for (const kind of ["csv", "pdf"] as const) test(`${kind}: unavailable history is never passed to duplicate signatures`, async () => {
  const history = new Proxy([], { get() { throw new Error("Unavailable history consumed"); } });
  const h = await review(kind, withStatus("transactions", "error", true), history);
  assert.equal(importButton(h.render()).props.disabled, true);
  assert.equal(h.writes.length, 0);
});

test("PDF final guard rejects a duplicate even if its disabled selection handler is invoked", async () => {
  const h = await review("pdf", readyStatuses(), [transaction({ description: "Imported meal" })]);
  checks(h.render())[0].props.onChange({ target: { checked: true } });
  checks(h.render()).at(-1).props.onChange({ target: { checked: true } });
  await importButton(h.render()).props.onClick(); await tick();
  assert.equal(h.writes.length, 0);
});
