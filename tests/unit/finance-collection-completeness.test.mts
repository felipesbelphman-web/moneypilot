import assert from "node:assert/strict";
import test from "node:test";
import { requireCompleteCollection } from "../../src/lib/persistence/finance-collection-completeness.ts";
import { FinanceError, mapFinanceRepositoryError } from "../../src/lib/domain/finance-error.ts";

for (const count of [null, undefined, NaN, -1, 0.5, Infinity, Number.MAX_SAFE_INTEGER + 1, 0, 2]) {
  test(`rejects invalid or mismatched count ${String(count)}`, () => {
    assert.throws(() => requireCompleteCollection([{ privateValue: "never expose" }], count), error => {
      assert.ok(error instanceof FinanceError);
      assert.equal(error.code, "repository_unavailable");
      assert.equal(error.message, "repository_unavailable");
      assert.deepEqual(error.details, { reason: "incomplete_collection" });
      assert.equal(mapFinanceRepositoryError(error), error);
      return true;
    });
  });
}

for (const data of [null, undefined, {}, "", 0]) {
  test(`rejects non-array data ${JSON.stringify(data)} even with zero count`, () => {
    assert.throws(() => requireCompleteCollection(data as unknown[] | null | undefined, 0), FinanceError);
  });
}

test("returns the original complete array, including successful empty", () => {
  for (const rows of [[], [{ id: "synthetic" }]]) assert.equal(requireCompleteCollection(rows, rows.length), rows);
});
