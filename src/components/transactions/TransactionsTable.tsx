"use client";

import { useCurrency } from "@/components/CurrencyProvider";

import Image from "next/image";
import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/i18n/translations";
import type { Transaction } from "@/components/transactions/transaction-model";
import { formatTransactionCivilDate, localizeTransactionCategory, localizeTransactionOrigin, localizeTransactionPayment } from "@/components/transactions/transaction-presentation";

type TransactionsTableProps = {
  transactions: Transaction[];
  selectedMonth: string;
  page: number;
  onPageChange: (page: number) => void;
  onEdit: (transaction: Transaction, focusCategory?: boolean) => void;
  onDelete: (transaction: Transaction) => void;
  totalItems: number;
  pageSize: number;
};

const columns = "grid-cols-[minmax(0,2.5fr)_minmax(0,1.5fr)_minmax(0,1.45fr)_minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,.75fr)_minmax(0,.55fr)]";
const iconRoot = "/moneypilot/transactions/icons";

export function TransactionsTable({ transactions, selectedMonth, page, onPageChange, onEdit, onDelete, totalItems, pageSize }: TransactionsTableProps) {
  const { language } = useLanguage();
  const t = translations[language].appTransactions;
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const firstItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalItems);
  const [year, monthNumber] = selectedMonth.split("-");
  const periodLabel = `${translations[language].financialFlow.months[Number(monthNumber) - 1]} ${year}`;
  const resultCopy = (totalItems === 1 ? t.resultCountOne : t.resultCountOther).replace("{count}", String(totalItems));
  const showingCopy = (totalItems === 1 ? t.paginationOne : t.paginationOther).replace("{first}", String(firstItem)).replace("{last}", String(lastItem)).replace("{count}", String(totalItems));
  return (
    <section className="grid h-[625px] min-h-[625px] max-h-[625px] min-w-0 max-w-full shrink-0 grid-rows-[22px_minmax(0,1fr)_21.433px] gap-y-[32px] overflow-visible rounded-[16.075px] border border-[var(--border-default)] bg-[var(--background-elevated)] px-[14.289px] py-[9.824px] shadow-[0_3.572px_12.503px_rgba(10,10,10,0.07)] [box-sizing:border-box]">
      <div className="flex h-[22px] items-start justify-between">
        <h2 className="text-[18px] font-semibold leading-[22px]">{t.transactionsInPeriod.replace("{period}", periodLabel)}</h2>
        <span className="w-[225px] text-right text-[10.72px] leading-[13px] text-[var(--text-tertiary)]">{resultCopy}</span>
      </div>
      <div className="min-h-0 min-w-0 max-w-full">
        <div className={`grid h-[27.717px] min-w-0 max-w-full ${columns} items-center rounded-[8.931px] bg-[var(--background-subtle)] px-[7.144px] text-[10.72px] font-semibold text-[var(--text-secondary)]`}>
          {t.columns.map((column, index) => <span key={column} className={`${index > 5 ? "text-center" : ""} min-w-0 truncate`}>{column}</span>)}
        </div>
        <div className="mt-[12px] min-h-[31.257px] min-w-0 max-w-full overflow-visible">
          {transactions.map((item, index) => <TransactionRow key={item.id} item={item} last={index === transactions.length - 1} menuAbove={index >= 5} menuOpen={openMenuId === item.id} onToggleMenu={() => setOpenMenuId((current) => current === item.id ? null : item.id)} onEdit={(focusCategory) => { setOpenMenuId(null); onEdit(item, focusCategory); }} onDelete={() => { setOpenMenuId(null); onDelete(item); }} />)}
          {transactions.length === 0 && <div className="flex h-[31.257px] items-center justify-center text-[10.72px] text-[var(--text-tertiary)]">{t.noTransactionsInPeriod.replace("{period}", periodLabel)}</div>}
        </div>
      </div>
      <div className="mx-auto flex h-[21.433px] w-[82.78%] min-w-0 max-w-full items-center justify-between">
        <span className="text-[7.591px] text-[var(--text-tertiary)]">{showingCopy}</span>
        <div className="flex gap-[5.358px]">
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => <button key={number} type="button" onClick={() => onPageChange(number)} className={`size-[21.433px] rounded-[6.252px] text-[7.591px] font-semibold ${page === number ? "bg-[var(--dashboard-brand-primary)] text-white" : "border border-[var(--border-default)] bg-[var(--background-subtle)] text-[var(--text-secondary)]"}`}>{number}</button>)}
        </div>
      </div>
    </section>
  );
}

function TransactionRow({ item, last, menuAbove, menuOpen, onToggleMenu, onEdit, onDelete }: { item: Transaction; last: boolean; menuAbove: boolean; menuOpen: boolean; onToggleMenu: () => void; onEdit: (focusCategory?: boolean) => void; onDelete: () => void }) {
  const { language } = useLanguage();
  const { formatMoney: money } = useCurrency();
  const t = translations[language].appTransactions;
  const categoryLabel = localizeTransactionCategory(item.category, language);
  const paymentLabel = localizeTransactionPayment(item.payment, language);
  const originLabel = localizeTransactionOrigin(item.origin, language);
  const dateLabel = formatTransactionCivilDate(item.dateISO, language, item.date);
  const menuCopy = language === "pt"
    ? { edit: "Editar transação", reclassify: "Reclassificar" }
    : language === "es"
      ? { edit: "Editar transacción", reclassify: "Reclasificar" }
      : language === "de" ? { edit: "Transaktion bearbeiten", reclassify: "Neu kategorisieren" }
      : language === "fr" ? { edit: "Modifier la transaction", reclassify: "Reclasser" }
      : language === "nl" ? { edit: "Transactie bewerken", reclassify: "Opnieuw indelen" }
      : language === "it" ? { edit: "Modifica transazione", reclassify: "Riclassifica" }
      : { edit: "Edit transaction", reclassify: "Reclassify" };
  return (
    <div className={`grid ${last ? "h-[31.257px]" : "relative h-[56.15px] after:absolute after:left-0 after:right-0 after:top-[43.257px] after:h-[0.893px] after:bg-[var(--border-default)]"} ${columns} items-start px-[7.144px] pt-[8px] text-[10.72px]`}>
      <strong className="min-w-0 truncate text-[10.72px] font-semibold">{item.description}</strong>
      <span className="flex min-w-0 items-center gap-[7.144px] truncate text-[var(--text-secondary)]"><i className="size-[4.465px] shrink-0 rounded-full" style={item.categoryColor === null ? undefined : { background: item.categoryColor }} />{categoryLabel}</span>
      <span className="flex min-w-0 items-center gap-[7.144px] truncate text-[var(--text-secondary)]"><Image src={`${iconRoot}/card-outline.svg`} alt="" width={13} height={13} className="size-[12.503px] shrink-0" />{paymentLabel}</span>
      <span className="min-w-0 truncate text-[var(--text-secondary)]">{dateLabel}</span>
      <span className="min-w-0 truncate font-semibold text-[#60A5FA]">{originLabel}</span>
      <strong className="min-w-0 truncate text-[10.72px] font-semibold">{money(item.amount)}</strong>
      <div className="relative flex min-w-0 justify-center justify-self-stretch">
        <button type="button" onClick={onToggleMenu} aria-label={`${t.actionsFor} ${item.description}`} aria-expanded={menuOpen} className="flex w-[60px] items-center justify-center"><Image src={`${iconRoot}/ellipsis-horizontal-outline.svg`} alt="" width={15} height={15} className="size-[14.289px]" /></button>
        {menuOpen && <div className={`absolute right-0 z-20 w-[112px] rounded-[8px] border border-[#28313B] bg-[#10151B] p-[4px] text-[8px] shadow-xl ${menuAbove ? "bottom-[20px]" : "top-[20px]"}`}><button type="button" onClick={() => onEdit()} className="h-[24px] w-full rounded-[5px] px-[6px] text-left hover:bg-[#19212C]">{menuCopy.edit}</button><button type="button" onClick={() => onEdit(true)} className="h-[24px] w-full rounded-[5px] px-[6px] text-left hover:bg-[#19212C]">{menuCopy.reclassify}</button></div>}
      </div>
      <button type="button" onClick={onDelete} aria-label={`${t.delete} ${item.description}`} className="flex items-center justify-center"><Image src={`${iconRoot}/trash-outline.svg`} alt="" width={15} height={15} className="size-[14.289px]" /></button>
    </div>
  );
}
