/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from "node:assert/strict";
import test from "node:test";
import { getTransactionPeriodView, transactionMonthRange } from "../../src/components/transactions/transactions-view-state.ts";
import { financialMonthRange } from "../../src/lib/dates/financial-month-range.ts";
import { FinanceError } from "../../src/lib/domain/finance-error.ts";
import type { TransactionPeriodState } from "../../src/lib/persistence/transaction-period-state.ts";
import type { Transaction } from "../../src/components/transactions/transaction-model.ts";
import { getTransactionCategoryGroupKey } from "../../src/components/transactions/transaction-model.ts";
import { availabilityHarness, financeData, transaction, withStatus } from "./finance-availability-render-harness.mts";
import { p03cHarness, nodes, text } from "./p03c-render-harness.mts";

const page = "src/app/transactions/page.tsx";
const month = "2026-09", sep = financialMonthRange(month), aug = financialMonthRange("2026-08");
const ready = (range = sep, items: Transaction[] = [transaction()]): TransactionPeriodState => ({ status: "ready", result: { completeness: "complete", range, items } });
const failure = (): TransactionPeriodState => ({ status: "error", error: new FinanceError("repository_unavailable") });
const unavailable = (status: "idle" | "loading" | "error" | "stale" | "refreshing", range = sep): TransactionPeriodState => status === "error" ? { ...failure(), retainedResult: { completeness: "complete", range, items: [transaction({ description: "Retained obsolete row" })] } } as TransactionPeriodState
  : status === "stale" || status === "refreshing" ? { status, retainedResult: { completeness: "complete", range, items: [transaction({ description: "Retained obsolete row" })] } } : { status };
function view(current: TransactionPeriodState, previous: TransactionPeriodState) { return getTransactionPeriodView(month, current, previous, sep, aug); }
function fixture() {
  const data = financeData();
  data.periods.set(sep.startISO, ready(sep, [transaction({ id: "income", type: "income", amount: 100 }), transaction()]));
  data.periods.set(aug.startISO, ready(aug, [transaction({ id: "previous", dateISO: "2026-08-10", amount: 10 })]));
  return data;
}
function mounted() {
  const h = p03cHarness(); Object.assign(h.data, { periods: fixture().periods });
  const m = h.mount(page, "TransactionsPageContent", { initialMonth: month, currentMonth: month, openStatementImport: false });
  return { ...h, render: () => m.render() };
}
const component = (tree: any, name: string) => nodes(tree).find(n => n.type?.name === name);
const table = (tree: any) => component(tree, "TransactionsTable");
const kpis = (tree: any) => nodes(tree).filter(n => n.type?.name === "TransactionsKpiCards");
const ids = (items: Transaction[]) => Array.from(items, row => row.id);

for (const status of ["idle", "loading", "error", "stale", "refreshing"] as const) {
  test(`selected ${status} hides retained rows and invokes no financial aggregate on both layouts`, () => {
    const data = fixture(); data.periods.set(sep.startISO, unavailable(status));
    const h = availabilityHarness(data), html = h.render(page);
    assert.doesNotMatch(html, /Trusted grocery|Retained obsolete row|EUR 20\.00|type="checkbox"|No transactions in/);
    assert.ok(!h.calls.some(name => name.includes("TransactionAggregates") || name === "calculateTransactionKpiAggregates"));
    assert.ok(html.split(status === "error" ? "Unable to load transactions" : "Loading transactions").length >= 11);
    assert.equal(view(unavailable(status), ready(aug, [])).aggregates, null);
  });
  test(`previous ${status} preserves current-only KPIs and never implies zero previous expenses`, () => {
    const data = fixture(); data.periods.set(aug.startISO, unavailable(status, aug));
    const h = availabilityHarness(data), html = h.render(page);
    assert.match(html, /Trusted grocery|EUR 20\.00/);
    assert.match(html, /No previous month comparison/);
    assert.doesNotMatch(html, /Unable to load transactions|Loading transactions/);
    assert.equal(h.calls.filter(n => n === "calculateCurrentTransactionAggregates").length, 1);
    assert.ok(!h.calls.includes("calculateTransactionKpiAggregates"));
    const result = view(ready(), unavailable(status, aug)).aggregates!;
    assert.equal(result.expenses, 20); assert.equal(result.previousExpenses, null);
    assert.equal(result.expenseVariation?.available, false); assert.equal(result.categoryComparisonAvailable, false);
  });
}

test("both verified periods use the existing comparison once, shared across layouts", () => {
  const h = availabilityHarness(fixture()); const html = h.render(page);
  assert.equal(h.calls.filter(n => n === "calculateTransactionKpiAggregates").length, 1);
  assert.match(html, /100% vs previous month/);
  const m = mounted(), cards = kpis(m.render());
  assert.equal(cards.length, 2); assert.equal(cards[0].props.aggregates, cards[1].props.aggregates);
  assert.equal(cards[0].props.aggregates.previousExpenses, 10);
  assert.equal(cards[0].props.aggregates.categoryComparisonAvailable, true);
});
test("ready empty current is a legitimate zero and empty state", () => {
  const data = fixture(); data.periods.set(sep.startISO, ready(sep, []));
  const html = availabilityHarness(data).render(page);
  assert.match(html, /EUR 0\.00/); assert.ok((html.match(/No transactions in/gi) ?? []).length >= 2);
  assert.doesNotMatch(html, /Unable to load transactions|Loading transactions|Trusted grocery/);
});
test("ready empty previous is complete but the existing zero denominator remains unavailable", () => {
  const result = view(ready(), ready(aug, [])).aggregates!;
  assert.equal(result.previousExpenses, 0); assert.equal(result.expenseVariation?.available, false);
  assert.equal(result.categoryComparisonAvailable, true);
});
test("both unavailable yield no rows or totals", () => {
  const result = view(failure(), failure()); assert.equal(result.rows, null); assert.equal(result.aggregates, null);
});
for (const side of ["selected", "previous"] as const) test(`wrong-range ${side} result rejected independently, including empty`, () => {
  for (const rows of [[], [transaction()]]) {
    const result = side === "selected" ? view(ready(aug, rows), ready(aug, [])) : view(ready(), ready(sep, rows));
    if (side === "selected") { assert.equal(result.rows, null); assert.equal(result.aggregates, null); assert.equal(result.status.status, "error"); }
    else { assert.equal(result.aggregates?.expenses, 20); assert.equal(result.aggregates?.previousExpenses, null); }
  }
});
test("current and previous recovery restores rows and then comparisons independently", () => {
  const data = fixture(), h = availabilityHarness(data);
  data.periods.set(sep.startISO, failure()); data.periods.set(aug.startISO, failure());
  assert.doesNotMatch(h.render(page), /EUR 20\.00/);
  data.periods.set(sep.startISO, fixture().periods.get(sep.startISO)!);
  assert.match(h.render(page), /EUR 20\.00/); assert.match(h.render(page), /No previous month comparison/);
  data.periods.set(aug.startISO, fixture().periods.get(aug.startISO)!);
  assert.match(h.render(page), /100% vs previous month/);
});

test("contradictory global current/previous rows cannot enter bounded rows, filters or KPI totals", () => {
  const h = mounted(); h.data.transactions = [transaction({ id: "global", description: "Contradictory global", amount: 900 }), transaction({ dateISO: "2026-08-10", amount: 500 })];
  let tree = h.render();
  assert.deepEqual(ids(table(tree).props.transactions), ["income", "expense"]);
  assert.equal(kpis(tree)[0].props.aggregates.expenses, 20); assert.equal(kpis(tree)[0].props.aggregates.previousExpenses, 10);
  nodes(tree).find(n => n.type === "input" && n.props.value === "").props.onChange({ target: { value: "Contradictory global" } });
  tree = h.render(); assert.equal(table(tree).props.totalItems, 0);
});
test("unavailable global history and categories do not block verified snapshot rows", () => {
  const data = fixture(); data.resourceStatuses = { ...withStatus("transactions", "error", true), categories: withStatus("categories", "error").categories };
  data.transactions = new Proxy([], { get() { throw new Error("Unavailable global history read"); } });
  const html = availabilityHarness(data).render(page);
  assert.match(html, /Trusted grocery/); assert.match(html, /EUR 20\.00/); assert.match(html, /Food/);
  assert.doesNotMatch(html, /Unable to load transactions/);
});
for (const kind of ["search", "category", "payment", "origin"] as const) test(`${kind} filters only selected verified rows`, () => {
  const h = mounted();
  const first = transaction({ id: "selected-a", description: "Unique selected", payment: "Cash", origin: "Selected origin" });
  const second = transaction({ id: "selected-b", description: "Other selected", payment: "Card", origin: "Other origin", category: "Travel", classification: { kind: "linked", categoryId: "travel", categoryNameSnapshot: "Travel", categoryColorSnapshot: "#000", normalizedCategorySnapshot: "travel" } });
  h.data.periods.set(sep.startISO, ready(sep, [first, second]));
  h.data.transactions = [transaction({ ...first, id: "global-only", amount: 999 })];
  let tree = h.render();
  if (kind === "search") nodes(tree).find(n => n.type === "input" && n.props.value === "").props.onChange({ target: { value: "Unique" } });
  else component(tree, "TransactionFilters").props.onChange(kind === "category" ? 1 : kind === "payment" ? 2 : 3, kind === "category" ? getTransactionCategoryGroupKey(first) : kind === "payment" ? "Cash" : "Selected origin");
  tree = h.render(); assert.deepEqual(ids(table(tree).props.transactions), ["selected-a"]);
  assert.equal(table(tree).props.totalItems, 1); assert.equal(kpis(tree)[0].props.aggregates.expenses, 40, "Filters do not change monthly totals");
});
test("local pagination, count, selection inventory and sorting use the complete selected array", () => {
  const h = mounted(); const rows = Array.from({ length: 17 }, (_, i) => transaction({ id: String(i), dateISO: `2026-09-${String(i + 1).padStart(2, "0")}` }));
  h.data.periods.set(sep.startISO, ready(sep, rows)); h.data.transactions = [transaction({ id: "global" })];
  let tree = h.render(), t = table(tree);
  assert.equal(t.props.totalItems, 17); assert.equal(t.props.transactions.length, 7); assert.equal(t.props.selectableTransactions.length, 17);
  assert.equal(t.props.transactions[0].id, "16");
  t.props.onPageChange(3); t = table(h.render()); assert.equal(t.props.transactions.length, 3); assert.equal(t.props.page, 3);
  component(h.render(), "TransactionFilters").props.onChange(4, "oldest"); tree = h.render();
  assert.equal(table(tree).props.page, 1); assert.equal(table(tree).props.transactions[0].id, "0");
  const mobile = component(tree, "MobileTransactionCards");
  assert.deepEqual(ids(mobile.props.transactions), ids(table(tree).props.transactions)); assert.equal(mobile.props.totalItems, 17);
});
test("historical month/category/payment/origin options stay global instead of shrinking to bounded rows", () => {
  const h = mounted(); h.data.transactions = [transaction({ dateISO: "2024-01-01", category: "Historical category", classification: { kind: "linked", categoryId: "historic", categoryNameSnapshot: "Historical category", categoryColorSnapshot: "#000", normalizedCategorySnapshot: "historical category" }, payment: "Historical payment", origin: "Historical origin" })];
  const options = component(h.render(), "TransactionFilters").props.options;
  assert.ok(options[0].some((o: any) => o.value === "2024-01"));
  assert.ok(options[1].some((o: any) => o.value === "linked:historic"));
  assert.ok(options[2].some((o: any) => o.value === "Historical payment"));
  assert.ok(options[3].some((o: any) => o.value === "Historical origin"));
});
test("import modal retains original global array and statuses even when selected coverage is ready", () => {
  const h = mounted(); h.data.resourceStatuses = withStatus("transactions", "error", true); h.data.transactions = [transaction({ id: "global-history" })];
  nodes(h.render()).find(n => n.type === "button" && text(n).trim() === "Import statement").props.onClick();
  const modal = component(h.render(), "ImportStatementModal");
  assert.equal(modal.props.existingTransactions, h.data.transactions); assert.equal(modal.props.resourceStatuses, h.data.resourceStatuses);
  assert.equal(modal.props.resourceStatuses.transactions.status, "error"); assert.equal(table(h.render()).props.status.status, "ready");
});
for (const goalsFail of [false, true]) test(`decision cards: selected-period messaging independent of Goals failure=${goalsFail}`, () => {
  const data = fixture(); data.goals = []; data.resourceStatuses = goalsFail ? withStatus("goals", "error") : withStatus("transactions", "error");
  const h = availabilityHarness(data); let html = h.render(page);
  assert.match(html, /No pattern identified in this period/);
  assert.equal(html.includes("No goals created"), !goalsFail);
  data.periods.set(sep.startISO, failure()); html = h.render(page);
  assert.doesNotMatch(html, /No pattern identified in this period/); assert.equal(html.includes("No goals created"), !goalsFail);
});
test("selection key resets on month/availability changes but not previous-period failure", () => {
  const h = mounted(), original = table(h.render());
  const selected = h.mountComponent(original.type, original.props);
  const checkboxes = () => nodes(selected.render()).filter(n => n.type === "input" && n.props.type === "checkbox");
  checkboxes()[0].props.onChange(); assert.equal(checkboxes()[0].props.checked, true);
  h.data.periods.set(aug.startISO, failure()); assert.equal(table(h.render()).key, original.key);
  h.data.periods.set(sep.startISO, unavailable("stale")); const stale = table(h.render());
  assert.notEqual(stale.key, original.key); assert.equal(stale.props.selectableTransactions, null);
  assert.ok(!nodes(h.mountComponent(stale.type, stale.props).render()).some(n => n.props.type === "checkbox"));
  h.data.periods.set(sep.startISO, ready()); const recovered = table(h.render());
  const fresh = h.mountComponent(recovered.type, recovered.props);
  assert.equal(nodes(fresh.render()).find(n => n.props.type === "checkbox").props.checked, false);
  component(h.render(), "TransactionsMonthSelector").props.onMonthChange("2026-10"); assert.notEqual(table(h.render()).key, recovered.key);
});

test("initial requests use exact current/previous ranges; rerenders and persistent errors do not loop", () => {
  const h = mounted(); h.data.periods.set(sep.startISO, failure()); h.data.periods.set(aug.startISO, failure());
  h.render(); assert.deepEqual(structuredClone(h.data.requests), [sep, aug]);
  h.render(); h.render(); assert.equal(h.data.requests.length, 2);
});
test("month changes update both ranges and reuse September as October's previous range", () => {
  const h = mounted(); h.render(); component(h.render(), "TransactionsMonthSelector").props.onMonthChange("2026-10"); h.render();
  assert.deepEqual(structuredClone(h.data.requests), [sep, aug, financialMonthRange("2026-10"), sep]);
});
for (const side of ["selected", "previous"] as const) test(`stale ${side} requests again independently`, () => {
  const h = mounted(); h.render(); h.data.periods.set(side === "selected" ? sep.startISO : aug.startISO, unavailable("stale", side === "selected" ? sep : aug));
  h.render(); assert.equal(h.data.requests.length, 3);
  assert.deepEqual(structuredClone(h.data.requests[2]), side === "selected" ? sep : aug);
  h.render(); assert.equal(h.data.requests.length, 3);
});
test("shared range derivation preserves year rollover and rejects unsupported boundaries safely", () => {
  const h = mounted(); component(h.render(), "TransactionsMonthSelector").props.onMonthChange("2026-01"); h.render();
  assert.deepEqual(structuredClone(h.data.requests.slice(-2)), [financialMonthRange("2026-01"), financialMonthRange("2025-12")]);
  for (const value of ["garbage", "2026-13", "0001-01", "9998-12"]) assert.equal(transactionMonthRange(value), null);
  component(h.render(), "TransactionsMonthSelector").props.onMonthChange("9998-12"); const tree = h.render();
  assert.equal(table(tree).props.status.status, "error"); assert.equal(table(tree).props.transactions, null);
});
