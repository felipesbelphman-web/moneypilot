"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { IconWallet, IconX } from "@tabler/icons-react";

import { DesktopScaleCanvas } from "@/components/DesktopScaleCanvas";
import { TransactionDecisionCards } from "@/components/transactions/TransactionDecisionCards";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { TransactionsKpiCards } from "@/components/transactions/TransactionsKpiCards";
import { TransactionsTable, type Transaction } from "@/components/transactions/TransactionsTable";

const iconRoot = "/moneypilot/transactions/icons";

const transactions: Transaction[] = [
  { description: "YouTube", category: "Assinaturas", categoryColor: "#8B5CF6", payment: "Cartão", date: "15 Ago 2026", origin: "Extrato", value: "€8,99" },
  { description: "Centra", category: "Supermercado", categoryColor: "#14B8A6", payment: "Cartão", date: "14 Ago 2026", origin: "Extrato", value: "€3,30" },
  { description: "Quick Pick", category: "Café", categoryColor: "#FACC15", payment: "Cartão", date: "14 Ago 2026", origin: "Extrato", value: "€3,30" },
  { description: "Centra", category: "Supermercado", categoryColor: "#14B8A6", payment: "Cartão", date: "15 Ago 2026", origin: "Extrato", value: "€3,45" },
  { description: "Dunnes", category: "Supermercado", categoryColor: "#14B8A6", payment: "Cartão", date: "14 Ago 2026", origin: "Extrato", value: "€2,40" },
  { description: "Centra", category: "Supermercado", categoryColor: "#14B8A6", payment: "Cartão", date: "14 Ago 2026", origin: "Extrato", value: "€3,15" },
  { description: "Centra", category: "Supermercado", categoryColor: "#14B8A6", payment: "Cartão", date: "13 Ago 2026", origin: "Extrato", value: "€12,21" },
];

export default function TransactionsPage() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const visibleTransactions = useMemo(
    () => transactions.filter((item) => `${item.description} ${item.category}`.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  return (
    <div className="relative min-h-screen bg-[#080B0F]">
      <div className="pointer-events-none absolute inset-0 z-0 isolate overflow-hidden">
        <Image src="/moneypilot/dashboard-racing-bg.png" alt="" fill priority className="object-cover" />
        <div className="absolute inset-0 bg-[#0D1117]/50 mix-blend-hard-light" />
      </div>

      <div className="relative z-10">
        <DesktopScaleCanvas>
          <main className="relative h-[1024px] w-[1536px] overflow-hidden text-[#F5F7FA]">
            <section className="absolute left-[231px] top-[107px] h-[810px] w-[1164px] overflow-hidden rounded-[38px] border border-[#28313B]/16 bg-[#0D1117]/50 px-[32px] py-[16px] shadow-[0_22px_42px_rgba(0,0,0,0.45)] backdrop-blur-[20px]">
              <div className="relative h-[776px] w-full overflow-hidden">
                <div className="absolute left-0 top-0 flex h-[38px] w-[1090px] items-center justify-between">
                  <div className="flex items-center gap-[18px]">
                    <div className="h-[37px] w-[37px] overflow-hidden"><Image src="/moneypilot/moneypilot-logo.svg" alt="" width={180} height={40} priority className="h-[37px] w-auto max-w-none" /></div>
                    <span className="font-brand text-[21.44px] font-medium tracking-[0.429px]">MoneyPilot</span>
                  </div>
                  <span className="w-[130px] text-right text-[9px] font-semibold text-[#64707D]">TRANSAÇÕES</span>
                </div>

                <header className="absolute left-0 top-[50px] flex h-[56px] w-[1090px] items-center justify-between py-[2px]">
                  <div className="flex flex-col gap-[8px]">
                    <h1 className="text-[23px] font-semibold leading-none">Transações</h1>
                    <p className="text-[13px] text-[#9CA6B2]">Veja o que mudou e como cada gasto impacta seu mês.</p>
                  </div>
                  <div className="flex w-[581px] items-center justify-end gap-[8px]">
                    <label className="flex h-[36px] w-[267px] items-center gap-[12px] rounded-[19px] border border-[#28313B] bg-[#080B0F]/35 px-[14px] text-[#9CA6B2]">
                      <Image src={`${iconRoot}/search-outline.svg`} alt="" width={20} height={20} className="size-[20px]" />
                      <input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Buscar transação" placeholder="Buscar transação" className="w-full bg-transparent text-[10px] outline-none placeholder:text-[#9CA6B2]" />
                    </label>
                    <button type="button" className="flex h-[36px] w-[103px] items-center justify-center gap-[12px] rounded-[19px] border border-[#28313B] bg-[#080B0F]/35 text-[10px] font-medium text-[#9CA6B2]">
                      <Image src={`${iconRoot}/calendar-outline.svg`} alt="" width={20} height={20} className="size-[20px]" /><span>Mês</span>
                    </button>
                    <button type="button" onClick={() => setModalOpen(true)} className="flex h-[36px] w-[139px] items-center justify-center gap-[10px] rounded-[19px] bg-[#3B82F6] text-[10px] font-semibold">
                      <span>Nova transação</span><Image src={`${iconRoot}/add-circle-outline.svg`} alt="" width={19} height={19} className="size-[19px]" />
                    </button>
                    <Image src="/moneypilot/dashboard-avatar.png" alt="Avatar de Felipe" width={48} height={48} className="size-[48px] rounded-full" />
                  </div>
                </header>

                <TransactionsKpiCards />
                <TransactionFilters />
                <TransactionsTable transactions={visibleTransactions} page={page} onPageChange={setPage} />
                <TransactionDecisionCards onShowRelated={() => setQuery("Supermercado")} />
              </div>
            </section>

            {modalOpen && <TransactionModal onClose={() => setModalOpen(false)} />}
          </main>
        </DesktopScaleCanvas>
      </div>
    </div>
  );
}

function TransactionModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#080B0F]/65 backdrop-blur-sm">
      <div className="relative w-[420px] rounded-[26px] border border-[#28313B] bg-[#0D1117]/95 p-[26px] shadow-2xl">
        <button type="button" onClick={onClose} aria-label="Fechar" className="absolute right-[18px] top-[18px] text-[#9CA6B2]"><IconX size={20} /></button>
        <div className="flex items-center gap-[10px]"><div className="flex size-[34px] items-center justify-center rounded-[10px] bg-[#3B82F6]/20 text-[#60A5FA]"><IconWallet size={20} /></div><h2 className="text-[18px] font-semibold">Nova transação</h2></div>
        <p className="mt-[10px] text-[11px] text-[#9CA6B2]">Adicione uma movimentação manual à sua conta.</p>
        <div className="mt-[20px] grid gap-[10px]">
          <input placeholder="Descrição" className="h-[42px] rounded-[12px] border border-[#28313B] bg-[#080B0F]/60 px-[14px] text-[11px] outline-none" />
          <div className="grid grid-cols-2 gap-[10px]"><input placeholder="Valor" className="h-[42px] rounded-[12px] border border-[#28313B] bg-[#080B0F]/60 px-[14px] text-[11px] outline-none" /><input placeholder="Categoria" className="h-[42px] rounded-[12px] border border-[#28313B] bg-[#080B0F]/60 px-[14px] text-[11px] outline-none" /></div>
          <button type="button" onClick={onClose} className="mt-[6px] h-[42px] rounded-[21px] bg-[#3B82F6] text-[11px] font-semibold">Adicionar transação</button>
        </div>
      </div>
    </div>
  );
}
