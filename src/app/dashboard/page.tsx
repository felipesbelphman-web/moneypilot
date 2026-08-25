"use client";

import Image from "next/image";
import { useState } from "react";

import { SpendingRadialChart, spendingData } from "@/components/charts/SpendingRadialChart";
import { DashboardKpiCards } from "@/components/dashboard/DashboardKpiCards";
import { GoalsStatusCard } from "@/components/dashboard/GoalsStatusCard";
import { MonthlyStatusCard } from "@/components/dashboard/MonthlyStatusCard";
import { NextBestActionCard } from "@/components/dashboard/NextBestActionCard";
import { UpcomingBillsCard } from "@/components/dashboard/UpcomingBillsCard";
import { DesktopScaleCanvas } from "@/components/DesktopScaleCanvas";
import { FinancialFlow } from "@/components/financial-flow/FinancialFlow";

export default function DashboardPage() {
  const [showFinancialValues, setShowFinancialValues] = useState(true);

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
              <div className="flex w-full flex-col gap-[12px]">
                <header className="flex h-[37px] items-center gap-[18px]">
                  <div className="h-[37px] w-[37px] overflow-hidden">
                    <Image src="/moneypilot/moneypilot-logo.svg" alt="" width={180} height={40} priority className="h-[37px] w-auto max-w-none" />
                  </div>
                  <span className="font-brand text-[21.44px] font-medium tracking-[0.429px] text-white">MoneyPilot</span>
                </header>

                <div className="flex h-[58px] items-center justify-between">
                  <div className="flex flex-col gap-[4px] leading-none">
                    <span className="text-[14.48px] text-[#9CA6B2]">Bem-vindo de volta,</span>
                    <strong className="text-[23.17px] font-semibold text-[#F5F7FA]">Felipe</strong>
                  </div>
                  <div className="flex items-center gap-[24px]">
                    <div className="flex h-[47px] w-[245px] items-center rounded-full border border-[#28313B] bg-[#1A2129] px-[17px]">
                      <button type="button" className="flex h-[38px] flex-1 items-center justify-center text-[12.55px] font-medium">Hoje</button>
                      <button type="button" className="flex h-[38px] w-[83px] items-center justify-center rounded-full bg-[#3B82F6] text-[12.55px] font-semibold">Mês</button>
                      <button type="button" className="flex h-[38px] flex-1 items-center justify-center gap-[4px] text-[12.55px] font-medium">
                        <Image src="/moneypilot/dashboard-date-icon.svg" alt="" width={20} height={20} className="size-[20px]" />
                        Data
                      </button>
                    </div>
                    <div className="relative size-[52px] overflow-hidden rounded-full">
                      <Image src="/moneypilot/dashboard-avatar.png" alt="Foto do perfil" fill sizes="52px" className="object-cover" />
                    </div>
                  </div>
                </div>

                <DashboardKpiCards showValues={showFinancialValues} onToggleValues={() => setShowFinancialValues((value) => !value)} />

                <div className="flex h-[209px] items-start gap-[12px]">
                  <FinancialFlow showValues={showFinancialValues} />
                  <SpendingCategoriesCard showValues={showFinancialValues} />
                </div>

                <div className="flex h-[212px] items-start gap-[12px]">
                  <GoalsStatusCard showValues={showFinancialValues} />
                  <NextBestActionCard />
                  <UpcomingBillsCard showValues={showFinancialValues} />
                  <MonthlyStatusCard />
                </div>
              </div>
            </section>
          </main>
        </DesktopScaleCanvas>
      </div>
    </div>
  );
}

function SpendingCategoriesCard({ showValues }: { showValues: boolean }) {
  return (
    <article className="flex h-[209px] w-[411px] shrink-0 flex-col justify-between overflow-hidden rounded-[19.307px] border border-[#28313B] bg-[rgba(8,11,15,0.20)] p-[12px]">
      <div className="flex items-center gap-[7px]">
        <Image src="/moneypilot/dashboard-spending-title-icon.svg" alt="" width={18} height={18} className="size-[18px]" />
        <h2 className="text-[14px] font-semibold text-[#F5F7FA]">Para onde foi o seu dinheiro?</h2>
      </div>
      <div className="flex items-center gap-[17px]">
        <SpendingRadialChart showValues={showValues} />
        <div className="grid flex-1 grid-cols-[1fr_42px_58px] gap-y-[8px] text-[8.2px]">
          {spendingData.map((item) => (
            <div key={item.category} className="contents">
              <div className="flex items-center gap-[7px] text-[#9CA6B2]"><span className="size-[5px] rounded-full" style={{ backgroundColor: item.color }} />{item.category}</div>
              <span className="text-right text-[#9CA6B2]">{item.percentage.toFixed(1).replace(".", ",")}%</span>
              <span className="text-right text-[#F5F7FA]">{showValues ? item.value : "••••••"}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex h-[34px] w-full items-center gap-[8px] rounded-[8px] border border-[#1E427A]/70 bg-[#0B1323]/85 px-[9px]">
        <Image src="/moneypilot/dashboard-spending-insight-icon.svg" alt="" width={16} height={16} className="size-[16px]" />
        <div className="leading-tight"><p className="text-[9.5px] font-medium text-[#F5F7FA]">Compras merece atenção</p><p className="text-[8.5px] text-[#94A5A5]">É seu maior gasto variável neste mês.</p></div>
      </div>
    </article>
  );
}
