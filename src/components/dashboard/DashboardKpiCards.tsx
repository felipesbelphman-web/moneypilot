"use client";

import { useCurrency } from "@/components/CurrencyProvider";

import Image from "next/image";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";

import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/i18n/translations";

type DashboardKpiCardsProps = {
  showValues: boolean;
  onToggleValues: () => void;
  income: number | null;
  expenses: number | null;
  netCashFlow: number | null;
  accountBalance: number | null;
  month: string;
  aggregationAvailable: boolean;
};

const cardClass =
  "flex h-[196px] w-[255px] shrink-0 flex-col overflow-hidden rounded-[19px] border border-[var(--border-default)] bg-[var(--background-card)] p-[12px] shadow-[var(--shadow-card)]";

export function DashboardKpiCards({
  showValues,
  onToggleValues,
  income,
  expenses,
  netCashFlow,
  accountBalance,
  month,
  aggregationAvailable,
}: DashboardKpiCardsProps) {
  const { language } = useLanguage();
  const { formatMoney: money } = useCurrency();
  const t = translations[language].appDashboard;

  const [year, monthNumber] = month.split("-");
  const periodLabel =
    `${translations[language].financialFlow.months[Number(monthNumber) - 1]} ${year}`;
  return (

    <div className="dashboard-kpis flex h-[196px] w-full items-start gap-[24px]">
      <svg width="0" height="0" aria-hidden="true" className="absolute">
        <defs>
          <linearGradient id="dashboard-icon-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3B3B3E" />
            <stop offset="1" stopColor="#252526" />
          </linearGradient>
        </defs>
      </svg>
      <article className={`${cardClass} justify-between rounded-[18.264px]`}>
        <div className="flex min-w-0 w-full flex-col justify-between">
          <div className="flex h-[36px] items-center justify-between overflow-hidden">
            <div className="flex min-w-0 items-center gap-[7px]">
              <Image src="/moneypilot/dashboard-safe-to-spend-icon.svg" alt="" width={18} height={18} className="size-[18px]" />
              <h2 className="truncate whitespace-nowrap text-[14px] font-semibold text-[var(--text-primary)]">{t.netCashFlow}</h2>
            </div>
            <span className="shrink-0 rounded-full bg-[var(--surface-blue-subtle)] px-[8px] py-[4px] text-[9px] font-bold leading-none text-[var(--brand-secondary)]">{periodLabel}</span>
          </div>
          <p className={`numeric-value min-w-0 truncate text-[30px] font-semibold leading-[36px] ${netCashFlow !== null && netCashFlow < 0 ? "text-[#F43F5E]" : "text-[var(--text-primary)]"}`}>{showValues ? aggregationAvailable && netCashFlow !== null ? formatSignedCurrency(netCashFlow, money) : "—" : "••••••"}</p>
        </div>
        <div className="flex min-w-0 w-full flex-col justify-between gap-[12px]">
          <p className="truncate text-[11.5px] leading-[16px] text-[var(--text-tertiary)]">{t.netCashFlowDescription}</p>
          <div className="flex h-[31px] min-w-0 w-full items-center justify-between rounded-[20px] bg-[var(--dashboard-brand-primary-hover)] px-[12px] text-[10.5px] text-white"><span className="truncate font-medium">{periodLabel}</span><span className="truncate font-semibold">{t.monthlyFlow}</span></div>
        </div>
      </article>

      <MetricCard
        variant="income"
        value={income}
        showValues={showValues}
        periodLabel={periodLabel}
        available={aggregationAvailable}
      />
      <MetricCard
        variant="expense"
        value={expenses}
        showValues={showValues}
        periodLabel={periodLabel}
        available={aggregationAvailable}
      />

      <article className={`${cardClass} justify-between`}>
        <div className="flex flex-col justify-between gap-[6px]">
          <div className="flex h-[36px] items-center justify-between">
            <div className="flex min-w-0 items-center gap-[7px]">
              <Image src="/moneypilot/dashboard-balance-icon.svg" alt="" width={20} height={20} className="size-[20px]" />
              <h2 className="truncate text-[14px] font-semibold text-[var(--text-primary)]">{t.accountBalance}</h2>
            </div>
            <button type="button" onClick={onToggleValues} aria-label={showValues ? t.hideValues : t.showValues} aria-pressed={!showValues} className="dashboard-linear-icon flex size-[24px] items-center justify-center">
              {showValues ? <IoEyeOutline size={21} aria-hidden="true" /> : <IoEyeOffOutline size={21} aria-hidden="true" />}
            </button>
          </div>
          <div className="mt-[16px] flex flex-col justify-between gap-[7px]">
            <p aria-label={accountBalance === null ? t.accountBalanceUnavailable : undefined} className="numeric-value min-w-0 truncate text-[27px] font-semibold leading-none text-[var(--text-primary)]">{showValues ? accountBalance === null ? "—" : money(accountBalance) : "••••••"}</p>
            <p className="truncate text-[11.5px] text-[var(--text-tertiary)]">{accountBalance === null ? t.addStartingBalance : t.totalConnected}</p>
          </div>
        </div>
        <div className="flex h-[31px] w-full items-center justify-center rounded-[20px] bg-[var(--dashboard-brand-primary-hover)] text-[10.5px] font-medium text-white">{accountBalance === null ? t.balanceUnavailable : t.viewAccounts}</div>
      </article>
    </div>
  );
}

function MetricCard({
  variant,
  value,
  showValues,
  periodLabel,
  available,
}: {
  variant: "income" | "expense";
  value: number | null;
  showValues: boolean;
  periodLabel: string;
  available: boolean;
}) {
  const { language } = useLanguage();
  const { formatMoney: money } = useCurrency();
  const t = translations[language].appDashboard;
  const income = variant === "income";

  return (
    <article className={cardClass}>
      <div className="flex min-w-0 h-[128px] w-full flex-col justify-between gap-[6px]">
        <div className="flex h-[36px] items-center justify-between">
          <h2 className="truncate text-[15.5px] font-semibold text-[var(--text-primary)]">{income ? t.income : t.expenses}</h2>
          <Image src={income ? "/moneypilot/dashboard-income-icon.svg" : "/moneypilot/dashboard-expense-icon.svg"} alt="" width={22} height={22} className="size-[22px]" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11.5px] text-[var(--text-tertiary)]">{periodLabel}</span>
          <span className="invisible text-[11.5px]" aria-hidden="true">{t.trendUnavailable}</span>
        </div>
        <div className="flex flex-col">
          <p className="numeric-value min-w-0 truncate text-[26px] font-semibold leading-[37px] text-[var(--text-primary)]">{showValues ? available && value !== null ? money(value) : "—" : "••••••"}</p>
        </div>
      </div>
      <div className="flex h-[30px] w-full items-end justify-between gap-[8px]">
        <span className="truncate text-[10px] text-[var(--text-tertiary)]">{t.trendUnavailable}</span>
        <MiniSparkline positive={income || value === 0} />
      </div>
    </article>
  );
}

function MiniSparkline({ positive }: { positive: boolean }) {
  const stroke = positive ? "#0A9396" : "#F43F5E";

  return (
    <svg aria-hidden="true" className="h-[30px] w-[92px] shrink-0" viewBox="0 0 92 30" fill="none" preserveAspectRatio="none">
      <path d="M1 24C10 23 13 17 21 19C29 21 32 24 40 17C48 10 51 15 58 13C66 10 68 4 75 8C82 12 86 5 91 2" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function formatSignedCurrency(value: number, money: (value: number) => string) {
  if (value === 0) return money(0);
  return value > 0 ? `+${money(value)}` : money(value);
}
