"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { IconFileText, IconX } from "@tabler/icons-react";

import { BudgetDecisionColumn } from "@/components/budgets/BudgetDecisionColumn";
import { BudgetSummaryCards } from "@/components/budgets/BudgetSummaryCards";
import { BudgetTable, type Budget } from "@/components/budgets/BudgetTable";
import { DesktopScaleCanvas } from "@/components/DesktopScaleCanvas";

const iconRoot = "/moneypilot/budgets/icons";

const budgets: Budget[] = [
  { category: "Aluguel", subtitle: "Moradia", budget: 500, spent: 500, color: "#F97316", status: "Dentro do plano" },
  { category: "Supermercado", subtitle: "Alimentação e mercado", budget: 250, spent: 189.97, color: "#22C55E", status: "No controle" },
  { category: "Delivery", subtitle: "Delivery e pedidos", budget: 100, spent: 0, color: "#14B8A6", status: "No controle" },
  { category: "Café", subtitle: "Cafés e refeições rápidas", budget: 100, spent: 98.22, color: "#F97316", status: "Perto do limite" },
  { category: "Energia", subtitle: "Luz, gás e aquecimento", budget: 50, spent: 20, color: "#22C55E", status: "No controle" },
  { category: "Internet", subtitle: "Internet e telefone", budget: 20, spent: 15, color: "#22C55E", status: "No controle" },
  { category: "Compras", subtitle: "Roupas, eletrônicos e outros", budget: 100, spent: 134.6, color: "#F43F5E", status: "Estourado" },
  { category: "Assinaturas", subtitle: "Apps e serviços recorrentes", budget: 50, spent: 40.98, color: "#F59E0B", status: "Atenção" },
];

export default function BudgetsPage() {
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState("2026-08");
  const [modalOpen, setModalOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const visibleBudgets = useMemo(
    () => budgets.filter((item) => `${item.category} ${item.subtitle}`.toLowerCase().includes(query.toLowerCase())),
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
              <div className="relative h-[776px] w-[1090px] overflow-hidden">
                <div className="absolute left-0 top-0 flex h-[38px] w-[1090px] items-center justify-between">
                  <div className="flex items-center gap-[18px]"><div className="h-[37px] w-[37px] overflow-hidden"><Image src="/moneypilot/moneypilot-logo.svg" alt="" width={180} height={40} priority className="h-[37px] w-auto max-w-none" /></div><span className="font-brand text-[21.44px] font-medium tracking-[0.429px]">MoneyPilot</span></div>
                  <span className="w-[130px] text-right text-[9px] font-semibold text-[#64707D]">ORÇAMENTOS</span>
                </div>

                <header className="absolute left-0 top-[50px] h-[56px] w-[1090px] overflow-hidden">
                  <h1 className="absolute left-0 top-[2px] text-[23px] font-semibold leading-none">Orçamentos</h1>
                  <p className="absolute left-0 top-[34px] text-[13px] text-[#9CA6B2]">Acompanhe o ritmo dos gastos e ajuste antes de comprometer suas metas.</p>
                  <div className="absolute left-[509px] top-[4px] flex w-[581px] items-center justify-end gap-[8px]">
                    <label className="flex h-[36px] w-[267px] items-center gap-[12px] rounded-[19px] border border-[#28313B] bg-[#080B0F]/34 px-[14px] text-[#9CA6B2]"><Image src={`${iconRoot}/search.svg`} alt="" width={20} height={20} className="size-[20px]" /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Buscar orçamentos" placeholder="Buscar orçamentos" className="w-full bg-transparent text-[10px] outline-none placeholder:text-[#9CA6B2]" /></label>
                    <label className="relative flex h-[36px] w-[103px] cursor-pointer items-center justify-center gap-[12px] rounded-[19px] border border-[#28313B] bg-[#080B0F]/34 text-[10px] font-medium text-[#9CA6B2]"><Image src={`${iconRoot}/calendar.svg`} alt="" width={20} height={20} className="size-[20px]" /><span>Mês</span><input type="month" value={month} onChange={(event) => setMonth(event.target.value)} aria-label="Selecionar mês" className="absolute inset-0 cursor-pointer opacity-0" /></label>
                    <button type="button" onClick={() => setModalOpen(true)} className="flex h-[36px] w-[139px] items-center justify-center gap-[10px] rounded-[19px] bg-[#3B82F6] text-[10px] font-semibold"><span>Novo orçamento</span><Image src={`${iconRoot}/new-budget.svg`} alt="" width={19} height={19} className="size-[19px]" /></button>
                    <Image src="/moneypilot/dashboard-avatar.png" alt="Avatar de Felipe" width={48} height={48} className="size-[48px] rounded-full" />
                  </div>
                </header>

                <BudgetSummaryCards />
                <div className="absolute left-0 top-[250px] flex h-[516px] w-[1090px] gap-[12px]">
                  <BudgetTable budgets={visibleBudgets} openMenu={openMenu} onToggleMenu={(category) => setOpenMenu(openMenu === category ? null : category)} />
                  <BudgetDecisionColumn />
                </div>
              </div>
            </section>

            {modalOpen && <BudgetModal onClose={() => setModalOpen(false)} />}
          </main>
        </DesktopScaleCanvas>
      </div>
    </div>
  );
}

function BudgetModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#080B0F]/65 backdrop-blur-sm">
      <div className="relative w-[420px] rounded-[26px] border border-[#28313B] bg-[#0D1117]/95 p-[26px] shadow-2xl">
        <button type="button" onClick={onClose} aria-label="Fechar" className="absolute right-[18px] top-[18px] text-[#9CA6B2]"><IconX size={20} /></button>
        <div className="flex items-center gap-[10px]"><div className="flex size-[34px] items-center justify-center rounded-[10px] bg-[#3B82F6]/20 text-[#60A5FA]"><IconFileText size={20} /></div><h2 className="text-[18px] font-semibold">Novo orçamento</h2></div>
        <p className="mt-[10px] text-[11px] text-[#9CA6B2]">Defina um limite mensal para uma categoria.</p>
        <div className="mt-[20px] grid gap-[10px]"><input placeholder="Categoria" className="h-[42px] rounded-[12px] border border-[#28313B] bg-[#080B0F]/60 px-[14px] text-[11px] outline-none" /><input placeholder="Limite mensal" className="h-[42px] rounded-[12px] border border-[#28313B] bg-[#080B0F]/60 px-[14px] text-[11px] outline-none" /><button type="button" onClick={onClose} className="mt-[6px] h-[42px] rounded-[21px] bg-[#3B82F6] text-[11px] font-semibold">Adicionar orçamento</button></div>
      </div>
    </div>
  );
}
