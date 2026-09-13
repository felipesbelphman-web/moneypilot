import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { Transaction, TransactionClassification } from "../../src/components/transactions/transaction-model.ts";
import { getInitialTransactionCategoryId, getSelectableTransactionCategories, hasTransactionFieldChanges, resolveTransactionClassificationAction, retainCompatibleCategoryId } from "../../src/components/transactions/transaction-category-form.ts";
import type { Category } from "../../src/lib/domain/category.ts";

const category = (id: string, type: "income" | "expense", archivedAt: string | null = null): Category => ({ id, userId: "owner", name: id === "food" ? "Food" : "Salary", type, normalizedName: id, iconKey: "wallet", colorToken: "blue", archivedAt, createdAt: "2026-09-01T00:00:00Z", updatedAt: "2026-09-01T00:00:00Z" });
const legacy = (name = "Food"): TransactionClassification => ({ kind: "legacy", categoryId: null, categoryNameSnapshot: name, categoryColorSnapshot: "blue", normalizedCategorySnapshot: name.toLocaleLowerCase() });
const transaction = (classification: TransactionClassification = legacy()): Transaction => ({ id: "transaction", description: "Draft", category: classification.categoryNameSnapshot, categoryColor: classification.categoryColorSnapshot, classification, payment: "Card", date: "1 September 2026", dateISO: "2026-09-01", origin: "Manual", type: "expense", amount: 10 });

test("only active categories compatible with the transaction type are selectable", () => {
  const categories = [category("food", "expense"), category("salary", "income"), category("archived", "expense", "2026-09-02T00:00:00Z")];
  assert.deepEqual(getSelectableTransactionCategories(categories, "expense").map((item) => item.id), ["food"]);
  assert.equal(retainCompatibleCategoryId("food", categories, "expense"), "food");
  assert.equal(retainCompatibleCategoryId("food", categories, "income"), "");
  assert.equal(retainCompatibleCategoryId("archived", categories, "expense"), "");
});

test("editing resolves linked selection by id without linking legacy names", () => {
  const linked = transaction({ kind: "linked", categoryId: "food", categoryNameSnapshot: "Historical food", categoryColorSnapshot: "blue", normalizedCategorySnapshot: "historical food" });
  assert.equal(getInitialTransactionCategoryId(linked), "food");
  assert.equal(getInitialTransactionCategoryId(transaction(legacy("Food"))), "");
  assert.deepEqual(resolveTransactionClassificationAction(transaction(legacy("Food")), "", [category("food", "expense")], "expense", false), { kind: "unchanged" });
});

test("reclassification and unlink are explicit typed actions", () => {
  const food = category("food", "expense");
  const salary = category("salary", "income");
  const linked = transaction({ kind: "linked", categoryId: "old", categoryNameSnapshot: "Old", categoryColorSnapshot: "blue", normalizedCategorySnapshot: "old" });
  assert.deepEqual(resolveTransactionClassificationAction(linked, "food", [food], "expense", false), { kind: "link", category: food });
  assert.deepEqual(resolveTransactionClassificationAction(linked, "", [food], "expense", false), { kind: "unlink" });
  assert.deepEqual(resolveTransactionClassificationAction(transaction(), "", [food], "expense", true), { kind: "unlink" });
  assert.deepEqual(resolveTransactionClassificationAction(transaction(), "salary", [salary], "expense", false), { kind: "invalid" });
});

test("archived linked categories keep their id for snapshot presentation but are not selectable", () => {
  const archived = category("food", "expense", "2026-09-02T00:00:00Z");
  const linked = transaction({ kind: "linked", categoryId: archived.id, categoryNameSnapshot: "Food snapshot", categoryColorSnapshot: "blue", normalizedCategorySnapshot: "food snapshot" });
  assert.equal(getInitialTransactionCategoryId(linked), archived.id);
  assert.deepEqual(getSelectableTransactionCategories([archived], "expense"), []);
});

test("financial change detection excludes classification", () => {
  const current = transaction();
  const fields = { id: current.id, description: current.description, payment: current.payment, date: current.date, dateISO: current.dateISO, origin: current.origin, type: current.type, amount: current.amount };
  assert.equal(hasTransactionFieldChanges(current, fields), false);
  assert.equal(hasTransactionFieldChanges(current, { ...fields, amount: 11 }), true);
});

test("the form calls typed mutations and guards duplicate submissions", () => {
  const source = readFileSync(new URL("../../src/app/transactions/page.tsx", import.meta.url), "utf8");
  assert.match(source, /await createClassifiedTransaction\(/);
  assert.match(source, /categoryWrite: \{ kind: "linked", categoryId: category\.id/);
  assert.match(source, /await linkTransactionCategory\(/);
  assert.match(source, /await unlinkTransactionCategory\(/);
  assert.match(source, /if \(hasTransactionFieldChanges\(transaction, fields\)\) await updateTransaction\(fields\)/);
  assert.match(source, /if \(submittingRef\.current\) return/);
  assert.doesNotMatch(source, /categoryId:.*categoryNameSnapshot|categoryWrite:.*normalizedCategorySnapshot/);
});
