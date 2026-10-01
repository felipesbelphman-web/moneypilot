"use client";

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useCurrency } from '@/components/CurrencyProvider';
import { useLanguage } from '@/components/LanguageProvider';
import { languageLocales } from '@/i18n/config';
import { financialCalendarCopy } from '@/i18n/financial-calendar-copy';
import { calendarDays, civilDate, eventStatus, eventTotal, shiftDay, shiftMonth, type CalendarEvent, type CalendarStatus } from './financial-calendar-model';
import styles from './FinancialCalendar.module.css';

const statuses: CalendarStatus[] = ['paid', 'upcoming', 'overdue', 'scheduled'];
type Props = { month: string; today: string; selectedDay: string; events: CalendarEvent[]; onSelectDay: (day: string) => void };

export function FinancialCalendar({ month, today, selectedDay, events, onSelectDay }: Props) {
  const { language } = useLanguage();
  const { formatMoney } = useCurrency();
  const copy = financialCalendarCopy[language];
  const period = events.filter(event => event.date.startsWith(month));
  const daily = events.filter(event => event.date === selectedDay);
  const pending = period.filter(event => !event.settled);
  const paid = period.filter(event => event.settled);
  const total = eventTotal(paid);
  const dateLabel = (date: string) => new Intl.DateTimeFormat(languageLocales[language], { dateStyle: 'long' }).format(civilDate(date));
  return <section className={styles.calendar} aria-label={copy.title}>
    <p className={styles.note}>{copy.source}</p>
    <div className={styles.kpis}>
      <Summary label={copy.due} value="—" />
      <Summary label={copy.paidMonth} value={total === null ? '—' : formatMoney(total)} />
      <Summary label={copy.next} value={pending[0] ? dateLabel(pending[0].date) : '—'} />
    </div>
    <div className={styles.columns}>
      <div className={styles.panel}>
        <CalendarGrid month={month} today={today} selectedDay={selectedDay} events={events} onSelectDay={onSelectDay} />
        <ul className={styles.legend}>{statuses.map(status => <li key={status}><span className={styles.dot} data-status={status} />{copy[status]}</li>)}</ul>
      </div>
      <aside className={styles.panel} aria-live="polite">
        <h2>{copy.daily}</h2><p className={styles.note}>{dateLabel(selectedDay)}</p>
        <EventList events={daily} today={today} empty={copy.emptyDay} />
        <div className={styles.total}><span>{copy.total}</span><strong>{eventTotal(daily) === null ? '—' : formatMoney(eventTotal(daily)!)}</strong></div>
      </aside>
    </div>
    <div className={styles.columns}>
      <section className={styles.panel}><h2>{copy.upcomingTitle}</h2><EventList events={pending} today={today} empty={copy.emptyUpcoming} /></section>
      <section className={`${styles.panel} ${styles.insight}`}><h2>MoneyPilot IA</h2><p>{copy.insight.replace('{amount}', total === null ? '—' : formatMoney(total))}</p><Link className={styles.cta} href={`/budgets?month=${month}`}>{copy.impact} <span aria-hidden="true">↗</span></Link></section>
    </div>
  </section>;
}

function Summary({ label, value }: { label: string; value: string }) { return <article className={styles.panel}><h2>{label}</h2><p className={styles.value}>{value}</p></article>; }

function EventList({ events, today, empty }: { events: CalendarEvent[]; today: string; empty: string }) {
  const { language } = useLanguage();
  const { formatMoney } = useCurrency();
  return events.length ? <ul className={styles.events}>{events.map(event => <li key={event.id}><span><strong>{event.title}</strong><small><span className={styles.dot} data-status={eventStatus(event, today)} />{financialCalendarCopy[language][eventStatus(event, today)]} · {new Intl.DateTimeFormat(languageLocales[language], { day: 'numeric', month: 'short' }).format(civilDate(event.date))}</small></span><strong>{formatMoney(event.amount)}</strong></li>)}</ul> : <p className={styles.empty}>{empty}</p>;
}

function CalendarGrid({ month, today, selectedDay, events, onSelectDay }: Props) {
  const { language } = useLanguage();
  const copy = financialCalendarCopy[language];
  const locale = languageLocales[language];
  const days = calendarDays(month);
  const grid = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef(false);
  useEffect(() => { if (restoreFocus.current) { grid.current?.querySelector<HTMLButtonElement>('[tabindex="0"]')?.focus(); restoreFocus.current = false; } }, [selectedDay]);
  const label = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(civilDate(`${month}-01`));
  return <>
    <div className={styles.monthHeading}><button type="button" aria-label={copy.previous} disabled={shiftMonth(month, -1) === month} onClick={() => onSelectDay(`${shiftMonth(month, -1)}-01`)}>‹</button><h2 aria-live="polite">{label}</h2><button type="button" aria-label={copy.following} disabled={shiftMonth(month, 1) === month} onClick={() => onSelectDay(`${shiftMonth(month, 1)}-01`)}>›</button></div>
    <div role="grid" aria-label={label} className={styles.grid} ref={grid}>
      <div role="row" className={styles.week}>{days.slice(0, 7).map(day => <span role="columnheader" key={day} aria-label={new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(civilDate(day))}>{new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(civilDate(day))}</span>)}</div>
      {Array.from({ length: days.length / 7 }, (_, week) => <div role="row" className={styles.week} key={week}>{days.slice(week * 7, week * 7 + 7).map(day => {
        const dayStatuses = statuses.filter(status => events.some(event => event.date === day && eventStatus(event, today) === status));
        return <div role="gridcell" aria-selected={day === selectedDay} key={day}><button type="button" tabIndex={day === selectedDay ? 0 : -1} aria-current={day === today ? 'date' : undefined} data-adjacent={!day.startsWith(month)} data-selected={day === selectedDay} aria-label={`${new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(civilDate(day))}${dayStatuses.map(status => `, ${copy[status]}`).join('')}`} onClick={() => onSelectDay(day)} onKeyDown={event => {
          const offsets: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, Home: -(civilDate(day).getDay() + 6) % 7, End: 6 - (civilDate(day).getDay() + 6) % 7 };
          let next: string | undefined;
          if (event.key in offsets) next = shiftDay(day, offsets[event.key]);
          if (event.key === 'PageUp' || event.key === 'PageDown') next = `${shiftMonth(month, event.key === 'PageUp' ? -1 : 1)}-01`;
          if (next) { event.preventDefault(); restoreFocus.current = true; onSelectDay(next); }
        }}><span>{civilDate(day).getDate()}</span><span className={styles.dots} aria-hidden="true">{dayStatuses.map(status => <span key={status} className={styles.dot} data-status={status} />)}</span></button></div>;
      })}</div>)}
    </div>
  </>;
}
