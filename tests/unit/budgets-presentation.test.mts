import assert from 'node:assert/strict';
import test from 'node:test';
import { getBudgetProgress, budgetUiCopy } from '../../src/components/budgets/budget-presentation.ts';

test('budget presentation handles zero, missing and invalid operands honestly', () => {
  for (const [limit, spent] of [[0, 0], [0, 20], [-1, 5], [100, null], [Infinity, 4], [100, NaN], [100, -1]] as const) {
    assert.deepEqual(getBudgetProgress(limit, spent), { percent: null, width: 0 });
  }
  assert.deepEqual(getBudgetProgress(100, 0), { percent: 0, width: 0 });
});

test('budget progress preserves overspending text while bounding only its bar', () => {
  assert.deepEqual(getBudgetProgress(100, 135), { percent: 135, width: 100 });
  assert.deepEqual(getBudgetProgress(250, 189.97), { percent: 76, width: 76 });
  assert.deepEqual(getBudgetProgress(Number.MIN_VALUE, Number.MAX_VALUE), { percent: null, width: 0 });
});

test('budget unavailable, loading, error and filtered-empty messages cover every app language', () => {
  assert.deepEqual(Object.keys(budgetUiCopy).sort(), ['de', 'en', 'es', 'fr', 'it', 'nl', 'pt']);
  for (const copy of Object.values(budgetUiCopy)) for (const message of Object.values(copy)) assert.ok(message.trim().length > 0);
});
