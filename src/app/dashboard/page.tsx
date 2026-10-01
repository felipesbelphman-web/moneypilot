"use client";

import { useCurrency } from "@/components/CurrencyProvider";


import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFinanceData } from "@/components/FinanceDataProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/i18n/translations";
import { ThemeControl } from "@/components/navigation/ThemeControl";
import { AccountAvatar } from "@/components/profile/AccountAvatar";
import { useAccountProfile } from "@/components/profile/AccountProfileProvider";
import { markWelcomeSeen } from "@/app/settings/actions";
import { getDisplayCategorySpending, SpendingRadialChart } from "@/components/charts/SpendingRadialChart";
import { DashboardKpiCards } from "@/components/dashboard/DashboardKpiCards";
import { DashboardEmptyState, DashboardLoadingState, DashboardSectionState } from "@/components/dashboard/DashboardSystemStates";
import { DashboardToast, type DashboardToastState } from "@/components/dashboard/DashboardToast";
import { DashboardMonthSelector } from "@/components/dashboard/DashboardMonthSelector";
import { getDashboardMonth, type DashboardCategorySpending } from "@/components/dashboard/dashboard-financial-summary";
import { dashboardCalendarRange, dashboardFinancialExistence, dashboardFinancialRange, getDashboardFinancialView, getDashboardPeriodCoverage, type DashboardSectionStatus } from "@/components/dashboard/dashboard-view-state";
import { GoalsStatusCard } from "@/components/dashboard/GoalsStatusCard";
import { MonthlyStatusCard } from "@/components/dashboard/MonthlyStatusCard";
import { NextBestActionCard } from "@/components/dashboard/NextBestActionCard";
import { UpcomingBillsCard } from "@/components/dashboard/UpcomingBillsCard";
import { FinancialFlow } from "@/components/financial-flow/FinancialFlow";
import { FinancialCalendar } from "@/components/dashboard/FinancialCalendar";
import { eventsFromTransactions, localDateKey, selectedDayForMonth, validMonth } from "@/components/dashboard/financial-calendar-model";
import { financialCalendarCopy } from "@/i18n/financial-calendar-copy";

const idlePeriod = { status: "idle" as const };

const dashboardHeadings = {
  en: ["Your cash flow", "Goal status", "Monthly status"],
  pt: ["Seu fluxo de caixa", "Status da meta", "Status do mês"],
  es: ["Tu flujo de caja", "Estado de la meta", "Estado del mes"],
  de: ["Dein Cashflow", "Zielstatus", "Monatsstatus"],
  fr: ["Votre trésorerie", "État de l’objectif", "Bilan du mois"],
  nl: ["Je kasstroom", "Doelstatus", "Maandstatus"],
  it: ["Il tuo flusso di cassa", "Stato dell’obiettivo", "Stato del mese"],
} as const;

export default function DashboardPage() {
  const { language } = useLanguage();

  const { account } = useAccountProfile();

  const {
    accountBalanceSettings,
    accountBalance,
    transactions,
    budgets,
    budgetAdjustments,
    goals,
    goalContributionPlans,
    resourceStatuses,
    getTransactionPeriodState,
    ensureTransactionPeriod,
  } = useFinanceData();

  const t = translations[language].appDashboard;

  const [showFinancialValues, setShowFinancialValues] = useState(true);
  const [toast, setToast] = useState<DashboardToastState | null>(null);

  const [hasSeenWelcome] = useState(() => account?.profile.has_seen_welcome ?? null);

  const [now] = useState(() => new Date());
  const [month, setMonth] = useState(() => getDashboardMonth(now));
  const currentMonth = getDashboardMonth(now);
  const [calendarView, setCalendarView] = useState(false);
  const [selectedDay, setSelectedDay] = useState(() => localDateKey(now));
  const calendarCopy = financialCalendarCopy[language];
  const financialRange = useMemo(() => dashboardFinancialRange(month), [month]);
  const calendarRange = useMemo(() => dashboardCalendarRange(month), [month]);
  const financialPeriod = financialRange ? getTransactionPeriodState(financialRange) : idlePeriod;
  const calendarPeriod = calendarRange ? getTransactionPeriodState(calendarRange) : idlePeriod;
  const requestedFinancial = useRef<string | null>(null);
  const requestedCalendar = useRef<string | null>(null);
  useEffect(() => {
    if (!financialRange) return;
    if (requestedFinancial.current !== month || financialPeriod.status === "idle" || financialPeriod.status === "stale") {
      requestedFinancial.current = month;
      void ensureTransactionPeriod(financialRange);
    }
  }, [month, financialRange, financialPeriod.status, getTransactionPeriodState, ensureTransactionPeriod]);
  useEffect(() => {
    if (!calendarView || !calendarRange) return;
    const key = calendarRange.startISO + "/" + calendarRange.endExclusiveISO;
    if (requestedCalendar.current !== key || calendarPeriod.status === "idle" || calendarPeriod.status === "stale") {
      requestedCalendar.current = key;
      void ensureTransactionPeriod(calendarRange);
    }
  }, [calendarView, calendarRange, calendarPeriod.status, getTransactionPeriodState, ensureTransactionPeriod]);
  const calendarCoverage = useMemo(() => getDashboardPeriodCoverage(calendarPeriod, calendarRange), [calendarPeriod, calendarRange]);
  const calendarEvents = useMemo(() => calendarCoverage.rows === null ? null : eventsFromTransactions(calendarCoverage.rows), [calendarCoverage.rows]);
  function changeMonth(value: string) {
    if (!validMonth(value) || !dashboardFinancialRange(value)) return;
    setMonth(value);
    setSelectedDay(selectedDayForMonth(value, localDateKey()));
  }
  function selectDay(day: string) {
    if (!validMonth(day.slice(0, 7)) || !dashboardFinancialRange(day.slice(0, 7))) return;
    setSelectedDay(day);
    setMonth(day.slice(0, 7));
  }

  const financialView = useMemo(() => getDashboardFinancialView({ period: financialPeriod, resourceStatuses, budgets, budgetAdjustments, goals, goalContributionPlans, month, now }), [financialPeriod, resourceStatuses, budgets, budgetAdjustments, goals, goalContributionPlans, month, now]);
  const selectedPeriodSummary = financialView.metrics;
  const hasFinancialData = dashboardFinancialExistence({ selectedRows: financialView.rows, resourceStatuses, transactions, budgets, goals, accountBalanceSettings });
  const historicalTransactionDates = useMemo(() => resourceStatuses.transactions.status === "ready" ? transactions.map(transaction => transaction.dateISO) : [], [resourceStatuses.transactions.status, transactions]);

  useEffect(() => {
    if (account && !account.profile.has_seen_welcome) {
      void markWelcomeSeen().catch((error) => {
        console.error("Failed to mark welcome as seen:", error);
      });
    }
  }, [account]);

  const fullName = account?.profile.display_name?.trim() ?? "";

  return (
    <div data-dashboard-page data-calendar-view={calendarView} className="dashboard-page-shell">
      <div className="dashboard-shell">
        <div className="dashboard-main">
          <div className="dashboard-theme-row">
            {<div className="dashboard-day-logo" aria-label="MoneyPilot">
              <Image src="/moneypilot/dashboard/day/logomark.svg" alt="" width={37} height={37} />
              <span>MoneyPilot</span>
            </div>}
            <Image className="dashboard-dark-logo" src="/moneypilot/moneypilot-logo-white.svg" alt="MoneyPilot" width={177} height={37} />
            <ThemeControl orientation="horizontal" />
          </div>

          <header className="dashboard-header">
            <div className="dashboard-header__title">
              <span>{calendarView ? calendarCopy.description : hasSeenWelcome === false ? t.welcome : t.welcomeBack}</span>
              <h1>{calendarView ? calendarCopy.title : fullName || "—"}</h1>
            </div>

            <div className="dashboard-header__controls">
              {calendarView ? <button type="button" className="dashboard-cta-button" onClick={() => setCalendarView(false)}>{calendarCopy.back}</button> : <button type="button" className="dashboard-cta-button">Manual + CSV</button>}
              <DashboardMonthSelector
                language={language}
                month={month}
                currentMonth={calendarView ? localDateKey().slice(0, 7) : currentMonth}
                transactionDates={historicalTransactionDates}
                onMonthChange={changeMonth}
                onOpenCalendar={() => setCalendarView(true)}
              />
              <div className="dashboard-dark-avatar"><AccountAvatar size={52} /></div>
            </div>
          </header>

          {calendarView ? (
            calendarEvents !== null ? <FinancialCalendar month={month} today={localDateKey()} selectedDay={selectedDay} events={calendarEvents} onSelectDay={selectDay} /> : calendarCoverage.status === "loading" ? <DashboardLoadingState /> : <DashboardSectionState status="error" />
          ) : hasFinancialData === false && financialView.status === "ready" ? (
            <DashboardEmptyState />
          ) : (
            <>
              <DashboardKpiCards
                month={month}
                aggregationAvailable={selectedPeriodSummary?.aggregationAvailable ?? false}
                income={selectedPeriodSummary?.income ?? null}
                expenses={selectedPeriodSummary?.expenses ?? null}
                netCashFlow={selectedPeriodSummary?.netCashFlow ?? null}
                accountBalance={accountBalance}
                showValues={showFinancialValues}
                onToggleValues={() => setShowFinancialValues((value) => !value)}
              />

              <div className="dashboard-flow-row">
                {selectedPeriodSummary ? <FinancialFlow
                  title={dashboardHeadings[language][0]}
                  month={month}
                  aggregationAvailable={selectedPeriodSummary?.aggregationAvailable ?? false}
                  categoryAggregationAvailable={selectedPeriodSummary.categoryAggregationAvailable}
                  transactions={selectedPeriodSummary.monthTransactions}
                  income={selectedPeriodSummary?.income ?? null}
                  incomeAveragePerDay={selectedPeriodSummary.incomeAveragePerDay}
                  largestIncome={selectedPeriodSummary.largestIncome}
                  expenses={selectedPeriodSummary?.expenses ?? null}
                  netCashFlow={selectedPeriodSummary?.netCashFlow ?? null}
                  categorySpending={selectedPeriodSummary.categorySpending}
                  showValues={showFinancialValues}
                /> : <article className="relative flex h-[209px] w-[677px] shrink-0 flex-col justify-center gap-[10px] overflow-hidden rounded-[19px] border border-[var(--financial-flow-border)] bg-[var(--financial-flow-surface)] shadow-[var(--financial-flow-shadow)] backdrop-blur-[12px] p-[12px]"><h2 className="text-[14px] font-semibold">{dashboardHeadings[language][0]}</h2><DashboardSectionState status={financialView.status === "loading" ? "loading" : "error"} /></article>}
                <SpendingCategoriesCard availability={financialView.status} data={selectedPeriodSummary?.categoryAggregationAvailable ? selectedPeriodSummary.categorySpending : null} total={selectedPeriodSummary?.expenses ?? null} showValues={showFinancialValues} />
              </div>

              <div className="dashboard-secondary-row">
                <GoalsStatusCard title={dashboardHeadings[language][1]} goal={financialView.primaryGoal} availability={financialView.goalsStatus} plansStatus={financialView.plansStatus} planReviewStatus={financialView.planReviewStatus} currentMonth={currentMonth} showValues={showFinancialValues} />
                <NextBestActionCard action={financialView.action} availability={financialView.recommendationStatus} month={month} currentMonth={currentMonth} />
                <UpcomingBillsCard />
                <MonthlyStatusCard presentation="verdict" title={dashboardHeadings[language][2]} month={month} currentMonth={currentMonth} status={financialView.monthlyStatus} projection={financialView.projection} availability={financialView.projectionStatus} showValues={showFinancialValues} />
              </div>
            </>
          )}
        </div>
      </div>

      {hasFinancialData !== false && toast && <DashboardToast toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

function SpendingCategoriesCard({ data, total, showValues, availability }: { availability: DashboardSectionStatus; data: DashboardCategorySpending[] | null; total: number | null; showValues: boolean }) {
  const { language } = useLanguage();
  const { formatMoney: money } = useCurrency();
  const t = translations[language].appDashboard;

  if (!showValues) {
    return (
      <article className="flex h-[209px] w-[411px] shrink-0 flex-col justify-between overflow-hidden rounded-[19.307px] border border-[#28313B] bg-[rgba(8,11,15,0.20)] p-[12px]">
        <div className="flex items-center gap-[7px]">
          <Image src="/moneypilot/dashboard-spending-title-icon.svg" alt="" width={18} height={18} className="size-[18px]" />
          <h2 className="text-[14px] font-semibold text-[#F5F7FA]">{t.spendingTitle}</h2>
        </div>
        <div className="flex h-[142px] w-full shrink-0 items-center justify-center rounded-[14px] border border-[var(--financial-flow-divider)] bg-[var(--financial-summary-surface)] px-[24px] text-center">
          <p className="text-[10px] font-medium text-[var(--financial-flow-muted)]">{t.valuesHidden}</p>
        </div>
      </article>
    );
  }

  if (data === null) return <article className="flex h-[209px] w-[411px] shrink-0 flex-col justify-between overflow-hidden rounded-[19.307px] border border-[#28313B] bg-[rgba(8,11,15,0.20)] p-[12px]">
    <div className="flex items-center gap-[7px]"><Image src="/moneypilot/dashboard-spending-title-icon.svg" alt="" width={18} height={18} className="size-[18px]" /><h2 className="text-[14px] font-semibold text-[#F5F7FA]">{t.spendingTitle}</h2></div>
    <DashboardSectionState status={availability === "loading" ? "loading" : "error"} />
  </article>;
  const displayData = getDisplayCategorySpending(data);
  const topCategory = data[0];
  const topCategoryLabel = topCategory ? (topCategory.localizationKey ? t[topCategory.localizationKey] : topCategory.category) : "";
  return (
    <article className="flex h-[209px] w-[411px] shrink-0 flex-col justify-between overflow-hidden rounded-[19.307px] border border-[#28313B] bg-[rgba(8,11,15,0.20)] p-[12px]">
      <div className="flex items-center gap-[7px]">
        <Image src="/moneypilot/dashboard-spending-title-icon.svg" alt="" width={18} height={18} className="size-[18px]" />
        <h2 className="text-[14px] font-semibold text-[#F5F7FA]">{t.spendingTitle}</h2>
      </div>
      <div className="flex items-center gap-[17px]">
        <SpendingRadialChart data={displayData} total={total} showValues={showValues} />
        <div className="grid flex-1 grid-cols-[1fr_42px_58px] gap-y-[8px] text-[8.2px]">
          {displayData.map((item) => (
            <div key={item.category} className="contents">
              <div className="flex min-w-0 items-center gap-[7px] truncate text-[#9CA6B2]"><span className="size-[5px] shrink-0 rounded-full" style={{ backgroundColor: item.color }} />{item.localizationKey ? t[item.localizationKey] : item.category}</div>
              <span className="numeric-value text-right text-[#9CA6B2]">{(item.percentage * 100).toFixed(1).replace(".", ",")}%</span>
              <span className="numeric-value text-right text-[#F5F7FA]">{showValues ? money(item.amount) : "••••••"}</span>
            </div>
          ))}
          {displayData.length === 0 && <p className="col-span-3 text-center text-[9px] text-[#9CA6B2]">{t.noSpendingThisMonth}</p>}
        </div>
      </div>
      <div className="flex h-[34px] w-full items-center gap-[8px] rounded-[8px] border border-[#1E427A]/70 bg-[#0B1323]/85 px-[9px]">
        <Image src="/moneypilot/dashboard-spending-insight-icon.svg" alt="" width={16} height={16} className="size-[16px]" />
        <div className="leading-tight"><p className="text-[9.5px] font-medium text-[#F5F7FA]">{topCategory ? t.largestExpense.replace("{category}", topCategoryLabel) : t.noSpendingRecorded}</p><p className="text-[8.5px] text-[#94A5A5]">{topCategory ? t.expenseShare.replace("{percentage}", (topCategory.percentage * 100).toFixed(1)) : t.spendingCategoriesPlaceholder}</p></div>
      </div>
    </article>
  );
}
