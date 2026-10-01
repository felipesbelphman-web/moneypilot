"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Language } from "@/components/LanguageProvider";

const yearCopy: Record<Language, readonly [string, string]> = {
  en: ["Previous year", "Next year"], pt: ["Ano anterior", "Próximo ano"],
  es: ["Año anterior", "Año siguiente"], de: ["Vorheriges Jahr", "Nächstes Jahr"],
  fr: ["Année précédente", "Année suivante"], nl: ["Vorig jaar", "Volgend jaar"],
  it: ["Anno precedente", "Anno successivo"],
};

export function TransactionsMonthSelector({ month, language, label, onMonthChange, mobile = false, appearance = "transactions" }: {
  month: string; language: Language; label: string; onMonthChange: (value: string) => void; mobile?: boolean; appearance?: "transactions" | "budgets";
}) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(Number(month.slice(0, 4)));
  const format = (value: string, long = false) => new Intl.DateTimeFormat(language, {
    month: long ? "long" : "short", year: "numeric", timeZone: "UTC",
  }).format(new Date(`${value}-01T12:00:00Z`));

  const position = () => {
    const button = trigger.current?.getBoundingClientRect();
    const menu = popup.current;
    if (!button || !menu) return;
    const width = Math.min(336, window.innerWidth - 24);
    menu.style.width = `${width}px`;
    menu.style.left = `${Math.max(12, Math.min(button.right - width, window.innerWidth - width - 12))}px`;
    menu.style.top = `${button.bottom + 8}px`;
    menu.style.maxHeight = `${Math.max(120, window.innerHeight - button.bottom - 20)}px`;
  };

  useEffect(() => {
    if (!open) return;
    // The shell can animate its scale/position without firing resize or scroll.
    let frame = 0;
    const followTrigger = () => {
      position();
      frame = requestAnimationFrame(followTrigger);
    };
    frame = requestAnimationFrame(followTrigger);
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const close = () => { popup.current?.hidePopover(); trigger.current?.focus(); };
  const navigate = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const next = event.key === "ArrowRight" ? index + 1 : event.key === "ArrowLeft" ? index - 1
      : event.key === "ArrowDown" ? index + 3 : event.key === "ArrowUp" ? index - 3
      : event.key === "Home" ? 0 : event.key === "End" ? 11 : null;
    if (next === null) return;
    event.preventDefault();
    popup.current?.querySelectorAll<HTMLButtonElement>("[data-month-value]")[(next + 12) % 12]?.focus();
  };

  return <>
    <button ref={trigger} type="button" className={`transactions-month${mobile ? " transactions-month--mobile" : ""}${appearance === "budgets" ? " budgets-month" : ""}`}
      aria-label={`${label}: ${format(month, true)}`} aria-haspopup="dialog" aria-expanded={open} aria-controls={mounted ? id : undefined}
      onClick={() => {
        if (open) { close(); return; }
        setYear(Number(month.slice(0, 4)));
        setMounted(true);
        // Wait for the portal and the selected year's buttons to commit.
        requestAnimationFrame(() => {
          position(); popup.current?.showPopover();
          popup.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus();
        });
      }}>
      <span className="transactions-month__icon" aria-hidden="true" /><span>{format(month)}</span>
    </button>
    {mounted && createPortal(<div ref={popup} id={id} popover="auto" role="dialog" aria-label={label}
      className={`transactions-month-popover${appearance === "budgets" ? " budgets-month-popover" : ""}`} onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); } }}
      onToggle={(event) => setOpen(event.newState === "open")}>
      <div className="transactions-month-popover__year">
        <button type="button" aria-label={yearCopy[language][0]} disabled={year <= 1} onClick={() => setYear(year - 1)}><ChevronLeft size={20} /></button>
        <strong aria-live="polite">{year}</strong>
        <button type="button" aria-label={yearCopy[language][1]} disabled={year >= 9999} onClick={() => setYear(year + 1)}><ChevronRight size={20} /></button>
      </div>
      <div className="transactions-month-popover__grid">
        {Array.from({ length: 12 }, (_, index) => {
          const value = `${String(year).padStart(4, "0")}-${String(index + 1).padStart(2, "0")}`;
          return <button key={value} type="button" data-month-value={value} aria-label={format(value, true)} aria-pressed={value === month}
            onKeyDown={(event) => navigate(event, index)} onClick={() => { onMonthChange(value); close(); }}>
            {new Intl.DateTimeFormat(language, { month: "short", timeZone: "UTC" }).format(new Date(`${value}-01T12:00:00Z`))}
          </button>;
        })}
      </div>
    </div>, document.body)}
  </>;
}
