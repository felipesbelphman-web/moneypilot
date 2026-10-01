import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const statements = await readFile(new URL("../../src/app/statements/page.tsx", import.meta.url), "utf8");
const transactions = await readFile(new URL("../../src/app/transactions/page.tsx", import.meta.url), "utf8");

test("statements route launches the real reviewed CSV import flow", () => {
  assert.match(statements, /href="\/transactions\?import=1"/);
  assert.match(transactions, /searchParams\.get\("import"\) === "1"/);
  assert.match(transactions, /useState\(openStatementImport\)/);
});

test("statements route describes local review, atomic persistence and explicit PDF status", () => {
  assert.match(statements, /parsed locally/);
  assert.match(statements, /Atomic account import/);
  assert.match(statements, /PDF support is the next statement format planned/);
  assert.doesNotMatch(statements, /PDF statement import is not available yet/);
});
