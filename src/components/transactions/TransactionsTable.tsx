"use client";

import { useCurrency } from "@/components/CurrencyProvider";

import Image from "next/image";
import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/i18n/translations";
import type { Transaction } from "@/components/transactions/transaction-model";

type TransactionsTableProps = {
  transactions: Transaction[];
  page: number;
  onPageChange: (page: number) => void;
  onEdit: (transaction: Transaction, focusCategory?: boolean) => void;
  onDelete: (transaction: Transaction) => void;
  totalItems: number;
  pageSize: number;
};

const columns = "grid-cols-[283px_159px_155px_117px_94px_91px_74px_30px]";
const iconRoot = "/moneypilot/transactions/icons";

export function TransactionsTable({ transactions, page, onPageChange, onEdit, onDelete, totalItems, pageSize }: TransactionsTableProps) {
  const { language } = useLanguage();
  const t = translations[language].appTransactions;
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const firstItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalItems);
  const resultCopy = ({ en: `${totalItems} transactions found`, pt: `${totalItems} transações encontradas`, es: `${totalItems} transacciones encontradas`, de: `${totalItems} Transaktionen gefunden`, fr: `${totalItems} transactions trouvées`, nl: `${totalItems} transacties gevonden`, it: `${totalItems} transazioni trovate` })[language];
  const showingCopy = ({ en: `Showing ${firstItem}–${lastItem} of ${totalItems} transactions`, pt: `Mostrando ${firstItem}–${lastItem} de ${totalItems} transações`, es: `Mostrando ${firstItem}–${lastItem} de ${totalItems} transacciones`, de: `${firstItem}–${lastItem} von ${totalItems} Transaktionen`, fr: `Affichage de ${firstItem} à ${lastItem} sur ${totalItems} transactions`, nl: `${firstItem}–${lastItem} van ${totalItems} transacties`, it: `Visualizzate ${firstItem}–${lastItem} di ${totalItems} transazioni` })[language];
  return (
    <section className="absolute left-0 top-[300px] h-[359px] w-[1090px] rounded-[18px] border border-[#28313B] bg-[rgba(8,11,15,0.22)] px-[16px] py-[10px] shadow-[0_8px_18px_rgba(0,0,0,0.24)] backdrop-blur-[7px]">
      <div className="flex h-[18px] items-start justify-between">
        <h2 className="text-[15px] font-semibold leading-none">{t.augustTransactions}</h2>
        <span className="w-[188px] text-right text-[9px] text-[#64707D]">{resultCopy}</span>
      </div>
      <div className={`mt-[12px] grid h-[22px] w-[1056px] ${columns} items-center rounded-[8px] bg-[rgba(25,33,44,0.62)] px-[8px] text-[8.5px] font-semibold text-[#7F8996]`}>
        {t.columns.map((column, index) => <span key={column} className={index > 5 ? "text-center" : undefined}>{column}</span>)}
      </div>
      <div className="h-[251px] w-[1056px] overflow-hidden">
        {transactions.map((item, index) => <TransactionRow key={item.id} item={item} last={index === transactions.length - 1} menuAbove={index >= 5} menuOpen={openMenuId === item.id} onToggleMenu={() => setOpenMenuId((current) => current === item.id ? null : item.id)} onEdit={(focusCategory) => { setOpenMenuId(null); onEdit(item, focusCategory); }} onDelete={() => { setOpenMenuId(null); onDelete(item); }} />)}
        {transactions.length === 0 && <div className="flex h-full items-center justify-center text-[11px] text-[#64707D]">{t.empty}</div>}
      </div>
      <div className="mt-[2px] flex h-[24px] w-[1044px] items-center justify-between">
        <span className="text-[8.5px] text-[#64707D]">{showingCopy}</span>
        <div className="flex gap-[6px]">
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => <button key={number} type="button" onClick={() => onPageChange(number)} className={`size-[24px] rounded-[7px] text-[8.5px] font-semibold ${page === number ? "bg-[#3B82F6] text-white" : "border border-[#28313B] bg-[#080B0F]/30 text-[#9CA6B2]"}`}>{number}</button>)}
        </div>
      </div>
    </section>
  );
}

function TransactionRow({ item, last, menuAbove, menuOpen, onToggleMenu, onEdit, onDelete }: { item: Transaction; last: boolean; menuAbove: boolean; menuOpen: boolean; onToggleMenu: () => void; onEdit: (focusCategory?: boolean) => void; onDelete: () => void }) {
  const { language } = useLanguage();
  const { formatMoney: money } = useCurrency();
  const t = translations[language].appTransactions;
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
    <div className={`grid ${last ? "h-[35px]" : "h-[36px] border-b border-[rgba(40,49,59,0.72)]"} ${columns} items-center px-[8px] text-[9px]`}>
      <strong className="text-[9.5px] font-semibold">{item.description}</strong>
      <span className="flex items-center gap-[7px] text-[#9CA6B2]"><i className="size-[5px] rounded-full" style={{ background: item.categoryColor }} />{item.category}</span>
      <span className="flex items-center gap-[6px] text-[#B7BEC8]"><Image src={`${iconRoot}/card-outline.svg`} alt="" width={14} height={14} className="size-[14px]" />{item.payment}</span>
      <span className="text-[#9CA6B2]">{item.date}</span>
      <span className="font-semibold text-[#60A5FA]">{item.origin}</span>
      <strong className="text-[9.5px] font-semibold">{money(item.amount)}</strong>
      <div className="relative flex w-[60px] justify-center justify-self-center">
        <button type="button" onClick={onToggleMenu} aria-label={`${t.actionsFor} ${item.description}`} aria-expanded={menuOpen} className="flex w-[60px] items-center justify-center"><Image src={`${iconRoot}/ellipsis-horizontal-outline.svg`} alt="" width={16} height={16} className="size-[16px]" /></button>
        {menuOpen && <div className={`absolute right-0 z-20 w-[112px] rounded-[8px] border border-[#28313B] bg-[#10151B] p-[4px] text-[8px] shadow-xl ${menuAbove ? "bottom-[20px]" : "top-[20px]"}`}><button type="button" onClick={() => onEdit()} className="h-[24px] w-full rounded-[5px] px-[6px] text-left hover:bg-[#19212C]">{menuCopy.edit}</button><button type="button" onClick={() => onEdit(true)} className="h-[24px] w-full rounded-[5px] px-[6px] text-left hover:bg-[#19212C]">{menuCopy.reclassify}</button></div>}
      </div>
      <button type="button" onClick={onDelete} aria-label={`${t.delete} ${item.description}`} className="flex items-center justify-center"><Image src={`${iconRoot}/trash-outline.svg`} alt="" width={16} height={16} className="size-[16px]" /></button>
    </div>
  );
}
