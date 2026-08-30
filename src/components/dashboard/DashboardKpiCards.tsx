"use client";

import { useCurrency } from "@/components/CurrencyProvider";

import Image from "next/image";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";

import { IncomeExpenseAreaChart } from "@/components/charts/IncomeExpenseAreaChart";
import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/i18n/translations";

type DashboardKpiCardsProps = {
  showValues: boolean;
  onToggleValues: () => void;
  income: number;
  expenses: number;
  netCashFlow: number;
  accountBalance: number | null;
};

const cardClass =
  "flex h-[195px] w-[255px] shrink-0 flex-col overflow-hidden rounded-[19.307px] border border-[#28313B] bg-[rgba(8,11,15,0.20)] p-[12px]";

export function DashboardKpiCards({
  showValues,
  onToggleValues,
  income,
  expenses,
  netCashFlow,
  accountBalance,
}: DashboardKpiCardsProps) {
  const { language } = useLanguage();
  const { formatMoney: money } = useCurrency();
  const t = translations[language].appDashboard;
  return (
    <div className="flex h-[195px] w-full items-start gap-[12px]">
      <svg width="0" height="0" aria-hidden="true" className="absolute">
        <defs>
          <linearGradient id="dashboard-icon-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3B3B3E" />
            <stop offset="1" stopColor="#252526" />
          </linearGradient>
        </defs>
      </svg>
      <article className={`${cardClass} flex-1 justify-between rounded-[18.264px]`}>
        <div className="flex w-full flex-col gap-[12px]">
          <div className="flex h-[36px] items-center justify-between overflow-hidden">
            <div className="flex items-center gap-[7px]">
              <Image src="/moneypilot/dashboard-safe-to-spend-icon.svg" alt="" width={18} height={18} className="size-[18px]" />
              <h2 className="whitespace-nowrap text-[14px] font-semibold text-[#F5F7FA]">Net cash flow</h2>
            </div>
            <span className="rounded-full bg-[#3B82F6]/12 px-[8px] py-[4px] text-[9px] font-bold leading-none text-[#60A5FA]">THIS MONTH</span>
          </div>
          <p className={`min-w-[150px] text-[30px] font-semibold leading-[36px] ${netCashFlow < 0 ? "text-[#F43F5E]" : "text-[#F5F7FA]"}`}>{showValues ? formatSignedCurrency(netCashFlow, money) : "••••••"}</p>
        </div>
        <div className="flex w-full flex-col gap-[12px]">
          <p className="text-[11.5px] leading-[16px] text-[#9CA6B2]">Income minus expenses for the current month.</p>
          <div className="flex h-[31px] w-full items-center justify-between rounded-[20px] bg-[#3B82F6] px-[12px] text-[10.5px] text-[#F5F7FA]"><span className="font-medium">Current month</span><span className="font-semibold">Monthly flow</span></div>
        </div>
      </article>

      <MetricCard variant="income" value={income} showValues={showValues} />
      <MetricCard variant="expense" value={expenses} showValues={showValues} />

      <article className={`${cardClass} justify-between`}>
        <div className="flex flex-col gap-[6px]">
          <div className="flex h-[36px] items-center justify-between">
            <div className="flex items-center gap-[7px]">
              <Image src="/moneypilot/dashboard-balance-icon.svg" alt="" width={20} height={20} className="size-[20px]" />
              <h2 className="text-[14px] font-semibold text-[#F5F7FA]">{t.accountBalance}</h2>
            </div>
            <button type="button" onClick={onToggleValues} aria-label={showValues ? t.hideValues : t.showValues} aria-pressed={!showValues} className="dashboard-linear-icon flex size-[24px] items-center justify-center">
              {showValues ? <IoEyeOutline size={21} aria-hidden="true" /> : <IoEyeOffOutline size={21} aria-hidden="true" />}
            </button>
          </div>
          <div className="mt-[16px] flex flex-col gap-[7px]">
            <p aria-label={accountBalance === null ? "Account balance unavailable" : undefined} className="min-w-[170px] text-[27px] font-semibold leading-none text-[#F5F7FA]">{showValues ? accountBalance === null ? "—" : money(accountBalance) : "••••••"}</p>
            <p className="text-[11.5px] text-[#9CA6B2]">{accountBalance === null ? "Add a starting balance to see this" : t.totalConnected}</p>
          </div>
        </div>
        <div className="flex h-[31px] w-full items-center justify-center rounded-[20px] bg-[#3B82F6] text-[10.5px] font-medium text-[#F5F7FA]">{accountBalance === null ? "Balance unavailable" : t.viewAccounts}</div>
      </article>
    </div>
  );
}

function MetricCard({ variant, value, showValues }: { variant: "income" | "expense"; value: number; showValues: boolean }) {
  const { language } = useLanguage();
  const { formatMoney: money } = useCurrency();
  const t = translations[language].appDashboard;
  const income = variant === "income";

  return (
    <article className={cardClass}>
      <div className="flex h-[128px] w-full flex-col gap-[6px]">
        <div className="flex h-[36px] items-center justify-between">
          <h2 className="text-[15.5px] font-semibold text-[#F5F7FA]">{income ? t.income : t.expenses}</h2>
          <Image src={income ? "/moneypilot/dashboard-income-icon.svg" : "/moneypilot/dashboard-expense-icon.svg"} alt="" width={22} height={22} className="size-[22px]" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11.5px] text-[#9CA6B2]">Current month</span>
          <span className="invisible text-[11.5px]" aria-hidden="true">Trend unavailable</span>
        </div>
        <div className="flex flex-col">
          <p className="min-w-[165px] text-[26px] font-semibold leading-[37px] text-[#F5F7FA]">{showValues ? money(value) : "••••••"}</p>
          <p className="text-[12.5px] text-[#9CA6B2]">{t.totalThisMonth}</p>
        </div>
      </div>
      <div className="h-[30px] w-full">
        <IncomeExpenseAreaChart variant={variant} />
      </div>
    </article>
  );
}

function formatSignedCurrency(value: number, money: (value: number) => string) {
  if (value === 0) return money(0);
  return value > 0 ? `+${money(value)}` : money(value);
}
