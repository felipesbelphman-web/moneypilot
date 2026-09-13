import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { buildCategoryCreateInput, buildCategoryUpdateInput, getCategoryBenefits, getCategoryColorOptions, getCategoryFutureCopy, getCategoryIconOptions, getCategoryPageCopy } from "../../src/components/categories/category-page-contract.ts";
import { supportedLanguages } from "../../src/i18n/config.ts";

const draft = { name: "  Groceries  ", type: "expense" as const, iconKey: "cart", colorToken: "green-500" };

test("category create payload contains only the four repository-authorized fields", () => {
  const input = buildCategoryCreateInput(draft);
  assert.deepEqual(input, { name: "  Groceries  ", type: "expense", iconKey: "cart", colorToken: "green-500" });
  assert.deepEqual(Object.keys(input).sort(), ["colorToken", "iconKey", "name", "type"]);
});

test("category update payload excludes immutable and database-managed fields", () => {
  const input = buildCategoryUpdateInput(draft);
  assert.deepEqual(input, { name: "  Groceries  ", iconKey: "cart", colorToken: "green-500" });
  assert.deepEqual(Object.keys(input).sort(), ["colorToken", "iconKey", "name"]);
  for (const forbidden of ["type", "userId", "normalizedName", "createdAt", "updatedAt", "archivedAt"]) assert.equal(forbidden in input, false);
});

test("category page operational copy is complete for every supported language", () => {
  const englishKeys = Object.keys(getCategoryPageCopy("en")).sort();
  assert.equal(englishKeys.length, 45);
  for (const { code } of supportedLanguages) {
    const localized = getCategoryPageCopy(code);
    assert.deepEqual(Object.keys(localized).sort(), englishKeys);
    for (const value of Object.values(localized)) assert.ok(value.trim().length > 0);
  }
});

test("additional category translations are explicit and cannot inherit missing English keys", async () => {
  const source = await readFile(new URL("../../src/components/categories/category-page-contract.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /(?:pt|es|de|fr|nl|it):\s*\{\s*\.\.\.en/);
  for (const { code } of supportedLanguages) assert.equal(Object.values(getCategoryPageCopy(code)).some((value) => value.trim() === ""), false);
});

test("friendly selector labels preserve technical token values", () => {
  for (const { code } of supportedLanguages) {
    const icons = getCategoryIconOptions(code);
    const colors = getCategoryColorOptions(code);
    assert.deepEqual(icons.map((option) => option.value), ["tag", "home", "cart", "delivery", "transport", "health", "leisure", "subscription", "shopping", "more"]);
    assert.deepEqual(colors.map((option) => option.value), ["blue-500", "green-500", "amber-500", "violet-500", "teal-500", "rose-500", "slate-400"]);
    assert.ok([...icons, ...colors].every((option) => option.label && option.label !== option.value));
  }
});

test("categories route is wired to provider CRUD and contains no category mock source or delete action", async () => {
  const source = await readFile(new URL("../../src/app/categories/page.tsx", import.meta.url), "utf8");
  assert.match(source, /useFinanceData\(\)/);
  assert.match(source, /finance\.createCategory/);
  assert.match(source, /finance\.updateCategory/);
  assert.match(source, /finance\.archiveCategory/);
  assert.match(source, /finance\.restoreCategory/);
  assert.doesNotMatch(source, /rawCategories/);
  assert.doesNotMatch(source, /deleteCategory/);
  assert.match(source, /value: String\(finance\.activeCategories\.length\)/);
  assert.doesNotMatch(source, /value:\s*["'](?:18|42|92%)["']/);
  assert.doesNotMatch(source, /rawRules|rules\.map\(/);
  for (const merchant of ["LIDL", "Netflix", "Just Eat", "Dunnes", "Centra", "Spotify", "Boots"]) assert.doesNotMatch(source, new RegExp(merchant, "i"));
  assert.match(source, /futureCopy\.comingSoon/);
  assert.match(source, /copy\.rulesEmptyDescription/);
  assert.doesNotMatch(source, /\+ Nova regra|onClick=.*rule/i);
});

test("future category features have explicit localized unavailable states", () => {
  for (const { code } of supportedLanguages) {
    const localized = getCategoryFutureCopy(code);
    assert.deepEqual(Object.keys(localized).sort(), Object.keys(getCategoryFutureCopy("en")).sort());
    for (const value of Object.values(localized)) assert.ok(value.trim().length > 0);
  }
});

test("English category benefits are resolved directly and contain no Portuguese copy", () => {
  const english = getCategoryBenefits("en");
  assert.deepEqual(english.map(({ copy }) => copy), [
    "In the future, rules will be able to organize transactions.",
    "Categories help compare periods.",
    "Future rules will be able to reduce adjustments.",
    "Organized categories help with analysis.",
  ]);
  const serialized = JSON.stringify(english);
  for (const portuguese of ["No futuro", "Categorias ajudam", "Regras futuras", "Categorias organizadas"]) assert.doesNotMatch(serialized, new RegExp(portuguese));
});

test("category action heading is scoped to categories and the idle editor card is absent", async () => {
  assert.equal(getCategoryFutureCopy("en").actions, "Actions");
  assert.equal(getCategoryFutureCopy("pt").actions, "Ações");
  const source = await readFile(new URL("../../src/app/categories/page.tsx", import.meta.url), "utf8");
  assert.match(source, /futureCopy\.actions/);
  assert.doesNotMatch(source, /tr\("Ações"\)|Stocks/);
  assert.match(source, /\{\(editor \|\| feedback\) && <EditorPanel/);
});

test("categories route renders loading, empty, partial-error and duplicate-error feedback", async () => {
  const source = await readFile(new URL("../../src/app/categories/page.tsx", import.meta.url), "utf8");
  assert.match(source, /finance\.isHydrating/);
  assert.match(source, /emptyActive/);
  assert.match(source, /emptyArchived/);
  assert.match(source, /finance\.hydrationError/);
  assert.match(source, /duplicate_record/);
  assert.match(source, /role=\"alert\"/);
});

test("categories mobile composition is fluid and its dialog is viewport bounded", async () => {
  const source = await readFile(new URL("../../src/app/categories/page.tsx", import.meta.url), "utf8");
  assert.match(source, /data-categories-mobile/);
  assert.match(source, /max-w-full overflow-x-hidden/);
  assert.match(source, /min-\[768px\]:hidden/);
  assert.match(source, /w-\[calc\(100vw-32px\)\]/);
  assert.match(source, /max-h-\[calc\(100dvh-32px\)\]/);
  assert.match(source, /overflow-y-auto/);
  assert.doesNotMatch(source.match(/function MobileCategories[\s\S]+$/)?.[0] ?? "", /w-\[1536px\]/);
  assert.doesNotMatch(source, /overflow-x-auto/);
});
