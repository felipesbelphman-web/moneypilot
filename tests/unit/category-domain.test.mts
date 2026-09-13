import assert from "node:assert/strict";
import { test } from "node:test";
import {
  categoryArchiveUpdate,
  categoryRestoreUpdate,
  parseCategoryType,
  validateAndNormalizeCategoryCreate,
  validateAndNormalizeCategoryUpdate,
  type CategoryCreateInput,
} from "../../src/lib/domain/category.ts";
import { FinanceError } from "../../src/lib/domain/finance-error.ts";

const validCategory: CategoryCreateInput = {
  id: "category-1",
  userId: "user-1",
  name: "Groceries",
  type: "expense",
  iconKey: "shopping_cart",
  colorToken: "green-500",
};

function expectValidationError(action: () => unknown, field: string, reason: string) {
  assert.throws(action, (error) => error instanceof FinanceError
    && error.code === "validation_error"
    && error.details?.field === field
    && error.details.reason === reason);
}

test("accepts valid income and expense categories", () => {
  assert.equal(validateAndNormalizeCategoryCreate({ ...validCategory, type: "income" }).type, "income");
  assert.equal(validateAndNormalizeCategoryCreate(validCategory).type, "expense");
});

test("rejects an invalid category type at the runtime boundary", () => {
  expectValidationError(() => parseCategoryType("transfer"), "type", "allowed_value");
});

test("normalizes category name outer whitespace", () => {
  assert.equal(validateAndNormalizeCategoryCreate({ ...validCategory, name: "  Groceries  " }).name, "Groceries");
});

test("rejects an empty or whitespace-only name", () => {
  expectValidationError(() => validateAndNormalizeCategoryCreate({ ...validCategory, name: "" }), "name", "required");
  expectValidationError(() => validateAndNormalizeCategoryCreate({ ...validCategory, name: "   " }), "name", "required");
});

test("rejects a category name above 100 characters", () => {
  expectValidationError(() => validateAndNormalizeCategoryCreate({ ...validCategory, name: "a".repeat(101) }), "name", "allowed_value");
});

test("rejects invalid icon and color tokens", () => {
  expectValidationError(() => validateAndNormalizeCategoryCreate({ ...validCategory, iconKey: "Shopping Cart" }), "iconKey", "invalid_format");
  expectValidationError(() => validateAndNormalizeCategoryCreate({ ...validCategory, colorToken: "500-green" }), "colorToken", "invalid_format");
});

test("accepts valid tokens at the 64-character limit", () => {
  const token = `a${"1".repeat(63)}`;
  const result = validateAndNormalizeCategoryCreate({ ...validCategory, iconKey: token, colorToken: token });
  assert.equal(result.iconKey.length, 64);
  assert.equal(result.colorToken.length, 64);
});

test("rejects tokens above the 64-character limit", () => {
  expectValidationError(() => validateAndNormalizeCategoryCreate({ ...validCategory, iconKey: `a${"1".repeat(64)}` }), "iconKey", "allowed_value");
  expectValidationError(() => validateAndNormalizeCategoryCreate({ ...validCategory, colorToken: `a${"1".repeat(64)}` }), "colorToken", "allowed_value");
});

test("create output contains no generated fields", () => {
  const output = validateAndNormalizeCategoryCreate(validCategory);
  assert.deepEqual(Object.keys(output).sort(), ["colorToken", "iconKey", "id", "name", "type", "userId"]);
  assert.equal("normalizedName" in output, false);
  assert.equal("createdAt" in output, false);
  assert.equal("updatedAt" in output, false);
});

test("update output contains only mutable category fields", () => {
  const output = validateAndNormalizeCategoryUpdate({
    name: "Food",
    iconKey: "food",
    colorToken: "green-600",
    archivedAt: null,
  });
  assert.deepEqual(Object.keys(output).sort(), ["archivedAt", "colorToken", "iconKey", "name"]);
  for (const forbidden of ["id", "userId", "type", "normalizedName", "createdAt", "updatedAt"]) {
    assert.equal(forbidden in output, false);
  }
});

test("archive uses a valid timestamp and restore uses null", () => {
  assert.deepEqual(categoryArchiveUpdate("2026-09-11T12:00:00.000Z"), { archivedAt: "2026-09-11T12:00:00.000Z" });
  assert.deepEqual(categoryRestoreUpdate(), { archivedAt: null });
  expectValidationError(() => categoryArchiveUpdate("not-a-date"), "archivedAt", "invalid_date");
});

test("the category domain exposes no physical deletion API", async () => {
  const categoryDomain = await import("../../src/lib/domain/category.ts");
  assert.equal("deleteCategory" in categoryDomain, false);
  assert.equal("removeCategory" in categoryDomain, false);
});
