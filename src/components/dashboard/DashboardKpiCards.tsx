"use client";

import Image from "next/image";
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";

import { IncomeExpenseAreaChart } from "@/components/charts/IncomeExpenseAreaChart";

type DashboardKpiCardsProps = {
  showValues: boolean;
  onToggleValues: () => void;
};

const cardClass =
  "flex h-[195px] w-[255px] shrink-0 flex-col overflow-hidden rounded-[19.307px] border border-[#28313B] bg-[rgba(8,11,15,0.20)] p-[12px]";

export function DashboardKpiCards({
  showValues,
  onToggleValues,
}: DashboardKpiCardsProps) {
  return (
    <div className="flex h-[195px] w-full items-start gap-[12px]">
      <article className={`${cardClass} flex-1 justify-between rounded-[18.264px]`}>
        <div className="flex w-full flex-col gap-[12px]">
          <div className="flex h-[36px] items-center justify-between overflow-hidden">
            <div className="flex items-center gap-[7px]">
              <Image src="/moneypilot/dashboard-safe-to-spend-icon.svg" alt="" width={18} height={18} className="size-[18px]" />
              <h2 className="whitespace-nowrap text-[14px] font-semibold text-[#F5F7FA]">Disponível para gastar</h2>
            </div>
            <span className="rounded-full bg-[#22C55E]/12 px-[8px] py-[4px] text-[9px] font-bold leading-none text-[#22C55E]">SEGURO</span>
          </div>
          <p className="min-w-[150px] text-[30px] font-semibold leading-[36px] text-[#F5F7FA]">{showValues ? "€ 300,00" : "••••••"}</p>
        </div>
        <div className="flex w-full flex-col gap-[12px]">
          <p className="text-[11.5px] leading-[16px] text-[#9CA6B2]">Você pode usar este valor sem comprometer contas e metas.</p>
          <button type="button" className="flex h-[31px] w-full items-center justify-between rounded-[20px] bg-[#3B82F6] px-[12px] text-[10.5px] text-[#F5F7FA]">
            <span className="font-medium">Até 31 Ago</span>
            <span className="font-semibold">Ver cálculo →</span>
          </button>
        </div>
      </article>

      <MetricCard variant="income" showValues={showValues} />
      <MetricCard variant="expense" showValues={showValues} />

      <article className={`${cardClass} justify-between`}>
        <div className="flex flex-col gap-[6px]">
          <div className="flex h-[36px] items-center justify-between">
            <div className="flex items-center gap-[7px]">
              <Image src="/moneypilot/dashboard-balance-icon.svg" alt="" width={20} height={20} className="size-[20px]" />
              <h2 className="text-[14px] font-semibold text-[#F5F7FA]">Saldo em contas</h2>
            </div>
            <button type="button" onClick={onToggleValues} aria-label={showValues ? "Ocultar valores financeiros" : "Mostrar valores financeiros"} aria-pressed={!showValues} className="flex size-[24px] items-center justify-center text-[#9CA6B2] hover:text-[#F5F7FA]">
              {showValues ? <IoEyeOutline size={21} aria-hidden="true" /> : <IoEyeOffOutline size={21} aria-hidden="true" />}
            </button>
          </div>
          <div className="mt-[16px] flex flex-col gap-[7px]">
            <p className="min-w-[170px] text-[27px] font-semibold leading-none text-[#F5F7FA]">{showValues ? "€ 2.480,75" : "••••••"}</p>
            <p className="text-[11.5px] text-[#9CA6B2]">Total conectado</p>
          </div>
        </div>
        <button type="button" className="flex h-[31px] w-full items-center justify-center rounded-[20px] bg-[#3B82F6] text-[10.5px] font-medium text-[#F5F7FA]">Ver contas</button>
      </article>
    </div>
  );
}

function MetricCard({ variant, showValues }: { variant: "income" | "expense"; showValues: boolean }) {
  const income = variant === "income";
  const accent = income ? "#22C55E" : "#F43F5E";

  return (
    <article className={cardClass}>
      <div className="flex h-[128px] w-full flex-col gap-[6px]">
        <div className="flex h-[36px] items-center justify-between">
          <h2 className="text-[15.5px] font-semibold text-[#F5F7FA]">{income ? "Receitas" : "Despesas"}</h2>
          <Image src={income ? "/moneypilot/dashboard-income-icon.svg" : "/moneypilot/dashboard-expense-icon.svg"} alt="" width={22} height={22} className="size-[22px]" />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[4px]" style={{ color: accent }}>
            <span className="text-[12.5px] font-medium">{income ? "12,4%" : "8,7%"}</span>
            {income ? <IconTrendingUp size={18} stroke={1.8} /> : <IconTrendingDown size={18} stroke={1.8} />}
          </div>
          <span className="text-[11.5px] text-[#9CA6B2]">vs mês passado</span>
        </div>
        <div className="flex flex-col">
          <p className="min-w-[165px] text-[26px] font-semibold leading-[37px] text-[#F5F7FA]">{showValues ? (income ? "€ 3.650,00" : "€ 2.180,50") : "••••••"}</p>
          <p className="text-[12.5px] text-[#9CA6B2]">Total este mês</p>
        </div>
      </div>
      <div className="h-[30px] w-full">
        <IncomeExpenseAreaChart variant={variant} />
      </div>
    </article>
  );
}
