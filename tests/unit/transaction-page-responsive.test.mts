import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const page = fs.readFileSync("src/app/transactions/page.tsx", "utf8");
const kpis = fs.readFileSync("src/components/transactions/TransactionsKpiCards.tsx", "utf8");
const filters = fs.readFileSync("src/components/transactions/TransactionFilters.tsx", "utf8");

test("transactions has independent mobile and preserved desktop compositions", () => {
  assert.match(page, /data-transactions-mobile/);
  assert.match(page, /min-\[768px\]:hidden/);
  assert.match(page, /data-transactions-desktop/);
  assert.match(page, /hidden min-\[768px\]:block/);
  assert.match(page, /<TransactionsTable transactions=/);
});

test("mobile uses cards rather than the desktop transaction table", () => {
  const mobileStart = page.indexOf('data-transactions-mobile');
  const desktopStart = page.indexOf('data-transactions-desktop');
  const mobileMarkup = page.slice(mobileStart, desktopStart);
  assert.match(mobileMarkup, /<MobileTransactionCards/);
  assert.doesNotMatch(mobileMarkup, /<TransactionsTable/);
  assert.match(page, /data-mobile-transaction-cards/);
});

test("mobile cards expose all transaction fields and existing actions", () => {
  for (const expression of [
    "item.description", "money(item.amount)", "typeCopy[item.type]",
    "localizeTransactionCategory(item.category, language)", "localizeTransactionPayment(item.payment, language)",
    "formatTransactionCivilDate(item.dateISO, language, item.date)", "localizeTransactionOrigin(item.origin, language)",
    "onEdit(item)", "onDelete(item)",
  ]) assert.ok(page.includes(expression), `missing mobile field/action: ${expression}`);
});

test("mobile controls avoid rigid widths and use touch-sized controls", () => {
  assert.match(page, /overflow-x-hidden/);
  assert.match(page, /min-h-11 w-full/);
  assert.match(kpis, /grid-cols-1 gap-3 min-\[420px\]:grid-cols-2/);
  assert.match(filters, /grid-cols-1 gap-3 min-\[420px\]:grid-cols-2/);
  assert.match(page, /max-h-\[calc\(100dvh-32px\)\]/);
  assert.match(page, /max-w-\[420px\]/);
});

test("transaction handlers use classified creation and minimal financial updates", () => {
  assert.match(page, /await createClassifiedTransaction\(/);
  assert.match(page, /await updateTransaction\(fields\)/);
  assert.match(page, /await deleteTransaction\(id\)/);
  assert.match(page, /onSubmit=\{\(input\) => transactionModal\.mode === "edit"/);
});
