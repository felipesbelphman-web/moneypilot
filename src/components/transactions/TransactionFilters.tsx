"use client";

import Image from "next/image";
import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/i18n/translations";

type FilterOption = { value: string; label: string };

type TransactionFiltersProps = {
  values: [string, string, string, string, string];
  options: [FilterOption[], FilterOption[], FilterOption[], FilterOption[], FilterOption[]];
  onChange: (index: number, value: string) => void;
};

export function TransactionFilters({ values, options, onChange }: TransactionFiltersProps) {
  const { language } = useLanguage();
  const filters = translations[language].appTransactions.filters.map((label, index) => ({ label, width: [198, 198, 202, 198, 266][index] }));
  return (
    <div className="absolute left-0 top-[250px] flex h-[38px] w-[1090px] gap-[7px]">
      {filters.map((filter, index) => (
        <label key={filter.label} style={{ width: filter.width }} className="relative flex h-[38px] shrink-0 cursor-pointer items-center justify-between rounded-[12px] border border-[#28313B] bg-[#080B0F]/35 px-[14px] text-[9.5px] font-medium text-[#9CA6B2]">
          <span>{options[index].find((option) => option.value === values[index])?.label ?? filter.label}</span>
          <Image src="/moneypilot/transactions/icons/chevron-down-outline.svg" alt="" width={15} height={15} className="size-[15px]" />
          <select value={values[index]} onChange={(event) => onChange(index, event.target.value)} aria-label={filter.label} className="absolute inset-0 cursor-pointer opacity-0">{options[index].map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
        </label>
      ))}
    </div>
  );
}
