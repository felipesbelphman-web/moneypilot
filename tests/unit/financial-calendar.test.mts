import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { calendarDays, civilDate, eventsFromTransactions, eventStatus, eventTotal, localDateKey, selectedDayForMonth, shiftDay, shiftMonth, validMonth, type CalendarEvent } from '../../src/components/dashboard/financial-calendar-model.ts';
import type { Transaction } from '../../src/components/transactions/transaction-model.ts';

test('month navigation, validation, leap years and Monday alignment', () => {
  assert.equal(shiftMonth('2026-12', 1), '2027-01');
  assert.equal(shiftMonth('2026-01', -1), '2025-12');
  assert.equal(validMonth('2026-13'), false);
  assert.equal(validMonth('2026-2'), false);
  for (const month of ['2024-02', '2025-02', '2026-08', '2026-09']) {
    const days = calendarDays(month);
    assert.equal(civilDate(days[0]).getDay(), 1);
    assert.equal(days.length % 7, 0);
    assert.equal(new Set(days).size, days.length);
  }
  assert.equal(calendarDays('2024-02').filter(day => day.startsWith('2024-02')).length, 29);
  assert.equal(calendarDays('2025-02').filter(day => day.startsWith('2025-02')).length, 28);
  assert.equal(calendarDays('2026-08').length, 42);
});

test('day selection, adjacent days, today and civil dates survive DST', () => {
  assert.equal(shiftDay('2026-03-31', 1), '2026-04-01');
  assert.equal(shiftDay('2026-03-28', 2), '2026-03-30');
  assert.equal(shiftDay('2026-10-24', 2), '2026-10-26');
  assert.equal(selectedDayForMonth('2026-09', '2026-09-19'), '2026-09-19');
  assert.equal(selectedDayForMonth('2026-08', '2026-09-19'), '2026-08-01');
  assert.equal(localDateKey(new Date(2026, 8, 19, 23, 59)), '2026-09-19');
});

test('statuses distinguish settlement, overdue, next seven days and scheduled', () => {
  const event: CalendarEvent = { id: 'a', title: 'Bill', amount: 10, date: '2026-09-18', settled: false };
  assert.equal(eventStatus(event, '2026-09-19'), 'overdue');
  assert.equal(eventStatus({ ...event, settled: true }, '2026-09-19'), 'paid');
  for (const date of ['2026-09-19', '2026-09-26']) assert.equal(eventStatus({ ...event, date }, '2026-09-19'), 'upcoming');
  assert.equal(eventStatus({ ...event, date: '2026-09-27' }, '2026-09-19'), 'scheduled');
});

test('adapter uses real expenses without fabricating unpaid bills and aggregates safely', () => {
  const transaction: Transaction = { id: 'a', description: 'Rent', payment: 'Cash', date: '', dateISO: '2026-09-01', origin: 'manual', type: 'expense', amount: 100, category: null, categoryColor: null, classification: { kind: 'uncategorized', categoryId: null, categoryNameSnapshot: null, categoryColorSnapshot: null, normalizedCategorySnapshot: null } };
  const events = eventsFromTransactions([transaction, { ...transaction, id: 'b', type: 'income' }, { ...transaction, id: 'c', dateISO: '2026-02-30' }]);
  assert.equal(events.length, 1);
  assert.equal(events[0].settled, true);
  assert.equal(eventTotal(events), 100);
  assert.equal(eventTotal([]), 0);
  assert.equal(eventTotal([{ ...events[0], amount: NaN }]), null);
});

test('calendar has keyboard/grid semantics and responsive token-only styles', async () => {
  const component = await readFile('src/components/dashboard/FinancialCalendar.tsx', 'utf8');
  const css = await readFile('src/components/dashboard/FinancialCalendar.module.css', 'utf8');
  for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown']) assert.ok(component.includes(key));
  for (const attribute of ['role="grid"', 'role="row"', 'role="gridcell"', 'aria-selected', 'aria-current', 'tabIndex', '.focus()']) assert.ok(component.includes(attribute));
  assert.match(css, /max-width: 1000px/);
  assert.match(css, /max-width: 600px/);
  assert.match(css, /repeat\(7, minmax\(0, 1fr\)\)/);
  assert.match(css, /var\(--day-teal, var\(--night-income\)\)/);
  assert.doesNotMatch(css, /#[a-f\d]{3,8}\b|rgba?\(/i);
  assert.match(component, /useCurrency/);
  assert.match(component, /\/budgets\?month=/);
});
