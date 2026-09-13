"use client";

import Image from "next/image";
import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/i18n/translations";

type FilterOption = { value: string; label: string };

type TransactionFiltersProps = {
  values: [string, string, string, string, string];
  options: [FilterOption[], FilterOption[], FilterOption[], FilterOption[], FilterOption[]];
  onChange: (index: number, value: string) => void;
  mobile?: boolean;
};

export function TransactionFilters({ values, options, onChange, mobile = false }: TransactionFiltersProps) {
  const { language } = useLanguage();
  const filters = translations[language].appTransactions.filters;
  return (
    <div data-transaction-filters={mobile ? "mobile" : "desktop"} className={mobile ? "grid min-w-0 grid-cols-1 gap-3 min-[420px]:grid-cols-2" : "grid h-[34px] min-w-0 max-w-full shrink-0 grid-cols-5 gap-x-[19.665px]"}>
      {filters.map((filter, index) => (
        <label key={filter} className={`relative flex min-w-0 cursor-pointer items-center justify-between rounded-[10.717px] border border-[var(--border-default)] bg-[var(--background-subtle)] px-[11.61px] text-[12px] font-medium text-[var(--text-secondary)] ${mobile ? "h-11" : "h-[33.936px]"}`}>
          <span className="min-w-0 truncate">{options[index].find((option) => option.value === values[index])?.label ?? filter}</span>
          <Image src="/moneypilot/transactions/icons/chevron-down-outline.svg" alt="" width={14} height={14} className="size-[13.396px] shrink-0" />
          <select value={values[index]} onChange={(event) => onChange(index, event.target.value)} aria-label={filter} className="absolute inset-0 cursor-pointer opacity-0">{options[index].map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
        </label>
      ))}
    </div>
  );
}
