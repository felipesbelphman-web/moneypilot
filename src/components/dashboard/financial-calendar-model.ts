import type { Transaction } from '../transactions/transaction-model.ts';
import { aggregateMoney } from '../../lib/domain/money-aggregation.ts';

export type CalendarStatus = 'paid' | 'upcoming' | 'overdue' | 'scheduled';
export type CalendarEvent = { id: string; title: string; date: string; amount: number; settled: boolean };
export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
// Date-only financial records are civil dates, never UTC timestamps.
export function civilDate(key: string) { return new Date(`${key}T12:00:00`); }
export function validMonth(month: string) { return /^\d{4}-(0[1-9]|1[0-2])$/.test(month) && Number(month.slice(0, 4)) >= 1000 && Number(month.slice(0, 4)) <= 9998; }
export function shiftDay(key: string, days: number) { const date = civilDate(key); date.setDate(date.getDate() + days); return localDateKey(date); }
export function shiftMonth(month: string, delta: number) { const date = civilDate(`${month}-01`); date.setMonth(date.getMonth() + delta); const result = localDateKey(date).slice(0, 7); return validMonth(result) ? result : month; }
export function selectedDayForMonth(month: string, today: string) { return today.startsWith(month) ? today : `${month}-01`; }
export function calendarDays(month: string) {
  const first = `${month}-01`;
  const offset = (civilDate(first).getDay() + 6) % 7;
  const end = civilDate(first); end.setMonth(end.getMonth() + 1, 0);
  const count = Math.ceil((offset + end.getDate()) / 7) * 7;
  return Array.from({ length: count }, (_, index) => shiftDay(first, index - offset));
}
export function eventStatus(event: CalendarEvent, today: string): CalendarStatus {
  if (event.settled) return 'paid';
  if (event.date < today) return 'overdue';
  return event.date <= shiftDay(today, 7) ? 'upcoming' : 'scheduled';
}
// Transactions are realized ledger entries. No due date or unpaid state exists in this source.
export function eventsFromTransactions(transactions: readonly Transaction[]): CalendarEvent[] {
  return transactions.filter(t => t.type === 'expense' && /^\d{4}-\d{2}-\d{2}$/.test(t.dateISO) && localDateKey(civilDate(t.dateISO)) === t.dateISO)
    .map(t => ({ id: t.id, title: t.description, date: t.dateISO, amount: t.amount, settled: true }))
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}
export function eventTotal(events: readonly CalendarEvent[]) { const result = aggregateMoney(events.map(e => e.amount)); return result.available ? result.value : null; }
