"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/i18n/translations";
import { useCurrency } from "@/components/CurrencyProvider";
import type { Transaction } from "@/components/transactions/transaction-model";

export function TransactionDecisionCards({ transactions, onShowRelated }: { transactions: Transaction[]; onShowRelated: () => void }) {
  const { language } = useLanguage();
  const { formatMoney: money } = useCurrency();
  const t = translations[language].appTransactions;
  const shoppingTotal = transactions
    .filter((transaction) => transaction.type === "expense" && transaction.category.toLocaleLowerCase(language) === t.shopping.toLocaleLowerCase(language))
    .reduce((total, transaction) => total + transaction.amount, 0);
  const impactCopy = t.impactCopy.replace(/(?:R\$|€|£|\$)\s?[\d.,]+/, money(shoppingTotal));
  return (
    <div className="absolute left-0 top-[680px] flex h-[86px] w-[1090px] justify-between">
      <article className="flex h-[86px] w-[539px] flex-col gap-[5px] rounded-[18px] border border-[#28313B] bg-[rgba(8,11,15,0.22)] px-[14px] pb-[10px] pt-[11px] shadow-[0_8px_18px_rgba(0,0,0,0.24)] backdrop-blur-[7px]">
        <div className="flex h-[18px] w-full items-center justify-between">
          <div className="flex items-center gap-[7px]"><Image src="/moneypilot/transactions/icons/sparkles-outline.svg" alt="" width={16} height={16} className="size-[16px]" /><h2 className="text-[12px] font-semibold">{t.patternDetected}</h2></div>
          <span className="rounded-full bg-[#3B82F6]/12 px-[8px] py-[4px] text-[9px] font-semibold leading-none text-[#3B82F6]">{t.patternBadge}</span>
        </div>
        <p className="text-[10.5px] font-medium">{t.patternCopy}</p>
        <button type="button" onClick={onShowRelated} className="w-fit text-[9.5px] font-medium text-[#3B82F6]">{t.related}</button>
      </article>

      <article className="flex h-[86px] w-[539px] flex-col gap-[5px] rounded-[18px] border border-[#28313B] bg-[rgba(8,11,15,0.22)] px-[14px] pb-[10px] pt-[11px] shadow-[0_8px_18px_rgba(0,0,0,0.24)] backdrop-blur-[7px]">
        <div className="flex h-[18px] w-full items-center justify-between">
          <div className="flex items-center gap-[7px]"><Image src="/moneypilot/transactions/icons/target.svg" alt="" width={16} height={16} className="size-[16px]" /><h2 className="text-[12px] font-semibold">{t.goalImpact}</h2></div>
          <span className="rounded-full bg-[#3B82F6]/12 px-[8px] py-[4px] text-[9px] font-semibold leading-none text-[#3B82F6]">{t.trip}</span>
        </div>
        <p className="text-[10.5px] font-medium">{impactCopy}</p>
        <Link href="/goals" className="w-fit text-[9.5px] font-medium text-[#3B82F6]">{t.viewGoalImpact}</Link>
      </article>
    </div>
  );
}
