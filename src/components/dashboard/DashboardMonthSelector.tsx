"use client";

import Image from "next/image";
import { ChevronDown, ChevronLeft, ChevronRight, CornerUpLeft } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Language } from "@/components/LanguageProvider";

type MonthSelectorCopy = {
  current: string;
  selectMonth: string;
  previousYear: string;
  nextYear: string;
  hasTransactions: string;
};

const copyByLanguage: Record<Language, MonthSelectorCopy> = {
  en: { current: "Current", selectMonth: "Select month", previousYear: "Previous year", nextYear: "Next year", hasTransactions: "Has transactions" },
  pt: { current: "Atual", selectMonth: "Selecionar mês", previousYear: "Ano anterior", nextYear: "Próximo ano", hasTransactions: "Possui transações" },
  es: { current: "Actual", selectMonth: "Seleccionar mes", previousYear: "Año anterior", nextYear: "Año siguiente", hasTransactions: "Tiene transacciones" },
  de: { current: "Aktuell", selectMonth: "Monat auswählen", previousYear: "Vorheriges Jahr", nextYear: "Nächstes Jahr", hasTransactions: "Enthält Transaktionen" },
  fr: { current: "Actuel", selectMonth: "Sélectionner un mois", previousYear: "Année précédente", nextYear: "Année suivante", hasTransactions: "Contient des transactions" },
  nl: { current: "Huidig", selectMonth: "Maand selecteren", previousYear: "Vorig jaar", nextYear: "Volgend jaar", hasTransactions: "Bevat transacties" },
  it: { current: "Attuale", selectMonth: "Seleziona mese", previousYear: "Anno precedente", nextYear: "Anno successivo", hasTransactions: "Contiene transazioni" },
};

const localeByLanguage: Record<Language, string> = {
  en: "en-GB", pt: "pt-PT", es: "es-ES", de: "de-DE", fr: "fr-FR", nl: "nl-NL", it: "it-IT",
};

type DashboardMonthSelectorProps = {
  language: Language;
  month: string;
  currentMonth: string;
  transactionDates: string[];
  onMonthChange: (month: string) => void;
};

export function DashboardMonthSelector({ language, month, currentMonth, transactionDates, onMonthChange }: DashboardMonthSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [visibleYear, setVisibleYear] = useState(() => Number(month.slice(0, 4)));
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedMonthRef = useRef<HTMLButtonElement>(null);
  const copy = copyByLanguage[language];
  const locale = localeByLanguage[language];
  const isCurrentMonth = month === currentMonth;
  const transactionMonths = useMemo(
    () => new Set(transactionDates.map((date) => date.match(/^\d{4}-(0[1-9]|1[0-2])-/)?.[0].slice(0, 7)).filter((value): value is string => Boolean(value))),
    [transactionDates],
  );

  const formatMonth = (value: string, style: "short" | "long" = "short") => {
    const [year, monthNumber] = value.split("-").map(Number);
    return new Intl.DateTimeFormat(locale, { month: style, year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, monthNumber - 1, 1)));
  };

  const toggleMonthSelector = () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    setVisibleYear(Number(month.slice(0, 4)));
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return;
    requestAnimationFrame(() => selectedMonthRef.current?.focus());

    const close = (event: KeyboardEvent | PointerEvent) => {
      if (event instanceof KeyboardEvent && event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      } else if (event instanceof PointerEvent && !rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", close);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("pointerdown", close);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className="relative z-40 shrink-0">
      <div className="flex items-center gap-[12px] rounded-[25px] bg-[var(--dashboard-brand-accent)] py-[2px] pl-[2px] pr-[12px]">
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-label={`${copy.selectMonth}: ${formatMonth(month, "long")}`}
          onClick={toggleMonthSelector}
          className="flex h-[42px] w-[130px] items-center justify-between rounded-[24px] bg-gradient-to-l from-[#3B3B3E] to-[#252526] px-[10px] text-[12.55px] font-semibold text-white"
        >
          <Image src="/moneypilot/dashboard-controls/calendar.svg" alt="" width={24} height={24} className="size-[24px] shrink-0" />
          <span className="min-w-0 truncate capitalize">{formatMonth(month)}</span>
          <ChevronDown aria-hidden="true" className={`size-[15px] shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} strokeWidth={2} />
        </button>

        <button
          type="button"
          disabled={isCurrentMonth}
          onClick={() => onMonthChange(currentMonth)}
          className="flex items-center gap-[6px] whitespace-nowrap text-[12.55px] font-medium text-white transition-opacity disabled:cursor-default disabled:opacity-45"
        >
          <CornerUpLeft aria-hidden="true" className="size-[16px]" strokeWidth={2} />
          {copy.current}
        </button>
      </div>

      {isOpen && (
        <div role="dialog" aria-label={copy.selectMonth} className="absolute right-0 top-[52px] z-50 w-[270px] rounded-[20px] border border-[var(--dashboard-brand-border)] bg-[#17181B] p-[14px] text-white shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
          <div className="mb-[12px] flex items-center justify-between">
            <button type="button" aria-label={copy.previousYear} onClick={() => setVisibleYear((year) => year - 1)} className="flex size-[30px] items-center justify-center rounded-full hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dashboard-focus)]"><ChevronLeft className="size-[17px]" /></button>
            <strong className="text-[13px] font-semibold">{visibleYear}</strong>
            <button type="button" aria-label={copy.nextYear} onClick={() => setVisibleYear((year) => year + 1)} className="flex size-[30px] items-center justify-center rounded-full hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dashboard-focus)]"><ChevronRight className="size-[17px]" /></button>
          </div>
          <div className="grid grid-cols-3 gap-[7px]">
            {Array.from({ length: 12 }, (_, index) => {
              const value = `${visibleYear}-${String(index + 1).padStart(2, "0")}`;
              const isSelected = value === month;
              const hasTransactions = transactionMonths.has(value);
              return (
                <button
                  key={value}
                  ref={isSelected ? selectedMonthRef : undefined}
                  type="button"
                  aria-label={`${formatMonth(value, "long")}${hasTransactions ? `, ${copy.hasTransactions}` : ""}`}
                  aria-pressed={isSelected}
                  onClick={() => { onMonthChange(value); setIsOpen(false); triggerRef.current?.focus(); }}
                  className={`relative h-[36px] rounded-[12px] text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dashboard-focus)] ${isSelected ? "bg-[var(--dashboard-brand-primary)] text-[var(--dashboard-brand-deepest)]" : "bg-white/[0.05] text-[#E5E7EB] hover:bg-white/10"}`}
                >
                  <span className="capitalize">{new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(visibleYear, index, 1)))}</span>
                  {hasTransactions && <span aria-hidden="true" className={`absolute bottom-[4px] left-1/2 size-[3px] -translate-x-1/2 rounded-full ${isSelected ? "bg-[var(--dashboard-brand-deepest)]" : "bg-[var(--dashboard-brand-accent)]"}`} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
