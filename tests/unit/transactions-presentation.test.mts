import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { getTransactionSelectionState, toggleAllTransactionSelection, toggleTransactionSelection } from '../../src/components/transactions/transaction-selection.ts';

test('table select all includes filtered rows beyond the visible page', () => {
  const filtered = Array.from({ length: 17 }, (_, i) => String(i));
  const selected = toggleAllTransactionSelection(filtered, new Set());
  assert.equal(selected.size, 17);
  assert.equal(selected.has(filtered[16]), true);
  assert.deepEqual(getTransactionSelectionState(filtered, selected), { allSelected: true, partiallySelected: false });
  assert.equal(toggleAllTransactionSelection(filtered, selected).size, 0);
});

test('row selection is immutable and reports mixed, empty and filtered states', () => {
  const original = new Set(['a', 'outside-filter']);
  const changed = toggleTransactionSelection(original, 'b');
  assert.equal(original.has('b'), false);
  assert.deepEqual(getTransactionSelectionState(['a', 'b'], changed), { allSelected: true, partiallySelected: false });
  assert.deepEqual(getTransactionSelectionState(['a', 'b'], original), { allSelected: false, partiallySelected: true });
  assert.deepEqual(getTransactionSelectionState([], original), { allSelected: false, partiallySelected: false });
  assert.equal(toggleTransactionSelection(changed, 'a').has('a'), false);
});

test('Transactions V3 scope preserves one themed layout and real controls', async () => {
  const css = await readFile('src/app/transactions/transactions.css', 'utf8');
  assert.match(css, /:root\[data-theme="dark"\]:has\(\[data-transactions-page\]\)/);
  assert.match(css, /height: 359px; min-height: 359px/);
  assert.match(css, /height: 116px; min-height: 116px/);
  assert.doesNotMatch(css, /--shell-scale|data-desktop-sidebar|floating-sidebar__tooltip|data-dashboard-page/);
  const page = await readFile('src/app/transactions/page.tsx', 'utf8');
  assert.match(page, /TransactionsMonthSelector month=\{selectedMonth\}/);
  assert.doesNotMatch(page, /type="month"/);
  assert.match(page, /selectableTransactions=\{filteredTransactions\}/);
  assert.match(page, /searchParams.get\("import"\) === "csv"/);
  assert.match(page, /onImport=\{importTransactions\}/);
});
