"use client";

import { useCurrency } from "@/components/CurrencyProvider";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useFinanceData } from "@/components/FinanceDataProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/i18n/translations";
import { ThemeControl } from "@/components/navigation/ThemeControl";
import { useAccountProfile } from "@/components/profile/AccountProfileProvider";
import { markWelcomeSeen } from "@/app/settings/actions";
import { getDisplayCategorySpending, SpendingRadialChart } from "@/components/charts/SpendingRadialChart";
import { DashboardKpiCards } from "@/components/dashboard/DashboardKpiCards";
import { DashboardEmptyState, DashboardErrorState, DashboardLoadingState } from "@/components/dashboard/DashboardSystemStates";
import { DashboardToast, type DashboardToastState } from "@/components/dashboard/DashboardToast";
import { DashboardMonthSelector } from "@/components/dashboard/DashboardMonthSelector";
import { calculateDashboardFinancialSummary, getDashboardMonth, type DashboardCategorySpending } from "@/components/dashboard/dashboard-financial-summary";
import { resolveDashboardViewState } from "@/components/dashboard/dashboard-view-state";
import { GoalsStatusCard } from "@/components/dashboard/GoalsStatusCard";
import { MonthlyStatusCard } from "@/components/dashboard/MonthlyStatusCard";
import { NextBestActionCard } from "@/components/dashboard/NextBestActionCard";
import { calculateNextBestAction } from "@/components/dashboard/next-best-action";
import { UpcomingBillsCard } from "@/components/dashboard/UpcomingBillsCard";
import { FinancialFlow } from "@/components/financial-flow/FinancialFlow";

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
    isHydrating,
    hydrationError,
  } = useFinanceData();

  const t = translations[language].appDashboard;

  const [showFinancialValues, setShowFinancialValues] = useState(true);
  const [toast, setToast] = useState<DashboardToastState | null>(null);

  const [hasSeenWelcome] = useState(() => account?.profile.has_seen_welcome ?? null);

  const [now] = useState(() => new Date());
  const [month, setMonth] = useState(() => getDashboardMonth(now));
  const currentMonth = getDashboardMonth(now);

  const selectedPeriodSummary = useMemo(
    () =>
      calculateDashboardFinancialSummary({
        transactions,
        budgets,
        budgetAdjustments,
        goals,
        goalContributionPlans,
        month,
        now,
      }),
    [
      budgetAdjustments,
      budgets,
      goalContributionPlans,
      goals,
      month,
      now,
      transactions,
    ],
  );

  const nextBestAction = useMemo(
    () =>
      calculateNextBestAction({
        selectedMonth: month,
        currentMonth,
        aggregationAvailable: selectedPeriodSummary.aggregationAvailable,
        monthlyStatus: selectedPeriodSummary.monthlyStatus,
        budgetProjection: selectedPeriodSummary.budgetProjection,
        safeSavingsCapacity: selectedPeriodSummary.safeSavingsCapacity,
        netCashFlow: selectedPeriodSummary.netCashFlow,
        primaryGoal: selectedPeriodSummary.primaryGoal,
        goalsAvailable: selectedPeriodSummary.goalsAvailable,
        hasGoals: selectedPeriodSummary.hasGoals,
        activeBudgetAdjustment: budgetAdjustments[month],
        hasTransactions: selectedPeriodSummary.hasTransactions,
      }),
    [
      budgetAdjustments,
      currentMonth,
      month,
      selectedPeriodSummary.budgetProjection,
      selectedPeriodSummary.aggregationAvailable,
      selectedPeriodSummary.hasTransactions,
      selectedPeriodSummary.goalsAvailable,
      selectedPeriodSummary.hasGoals,
      selectedPeriodSummary.monthlyStatus,
      selectedPeriodSummary.netCashFlow,
      selectedPeriodSummary.primaryGoal,
      selectedPeriodSummary.safeSavingsCapacity,
    ],
  );

  const viewState = resolveDashboardViewState({
    isLoading: isHydrating,
    error: hydrationError,
    hasFinancialData: selectedPeriodSummary.hasFinancialData || accountBalanceSettings !== null,
  });

  useEffect(() => {
    if (account && !account.profile.has_seen_welcome) {
      void markWelcomeSeen().catch((error) => {
        console.error("Failed to mark welcome as seen:", error);
      });
    }
  }, [account]);

  const fullName = account?.profile.display_name?.trim() ?? "";

  return (
    <div data-dashboard-page className="dashboard-page-shell">
      <div className="dashboard-shell">
        <main className="dashboard-main">
          <div className="dashboard-theme-row">
            <ThemeControl orientation="horizontal" />
          </div>

          <header className="dashboard-header">
            <div className="dashboard-header__title">
              <span>{hasSeenWelcome === false ? t.welcome : t.welcomeBack}</span>
              <h1>{fullName || "—"}</h1>
            </div>

            <div className="dashboard-header__controls">
              <button type="button" className="dashboard-cta-button">Manual + CSV</button>
              <DashboardMonthSelector
                language={language}
                month={month}
                currentMonth={currentMonth}
                transactionDates={transactions.map((transaction) => transaction.dateISO)}
                onMonthChange={setMonth}
              />
            </div>
          </header>

          {viewState === "loading" ? (
            <DashboardLoadingState />
          ) : viewState === "error" ? (
            hydrationError && <DashboardErrorState error={hydrationError} />
          ) : viewState === "empty" ? (
            <DashboardEmptyState />
          ) : (
            <>
              <DashboardKpiCards
                month={month}
                aggregationAvailable={selectedPeriodSummary.aggregationAvailable}
                income={selectedPeriodSummary.income}
                expenses={selectedPeriodSummary.expenses}
                netCashFlow={selectedPeriodSummary.netCashFlow}
                accountBalance={accountBalance}
                showValues={showFinancialValues}
                onToggleValues={() => setShowFinancialValues((value) => !value)}
              />

               <article className="mobile-app-card">
                  <div className="mobile-app-card__copy">
                    <div className="mobile-app-card__text">

                      <h2>Your MoneyPilot, everywhere.</h2>

                      <p>
                        Your financial assistant is coming to mobile.
                        <br />
                        Track spending, goals, investments and insights wherever you are.
                      </p>
                    </div>

                    <div className="mobile-app-card__store-badges">
                      <Image
                        src="/moneypilot/dashboard/mobile-banner/app-store-badge.svg"
                        alt="Download on the App Store"
                        width={90}
                        height={30}
                      />

                      <Image
                        src="/moneypilot/dashboard/mobile-banner/google-play-badge.svg"
                        alt="Get it on Google Play"
                        width={90}
                        height={30}
                      />
                    </div>
                  </div>

                  <div className="mobile-app-card__phones" aria-hidden="true">
                    <Image
                      className="mobile-app-card__phone-left"
                      src="/moneypilot/dashboard/mobile-banner/iphone-left.png"
                      alt=""
                      width={231}
                      height={231}
                    />

                    <Image
                      className="mobile-app-card__phone-front"
                      src="/moneypilot/dashboard/mobile-banner/iphone-front.png"
                      alt=""
                      width={249}
                      height={249}
                    />
                  </div>

                  <button className="mobile-app-card__cta" type="button">
                    Coming soon
                  </button>
                </article>

              <div className="dashboard-flow-row">
                <FinancialFlow
                  month={month}
                  aggregationAvailable={selectedPeriodSummary.aggregationAvailable}
                  categoryAggregationAvailable={selectedPeriodSummary.categoryAggregationAvailable}
                  transactions={selectedPeriodSummary.monthTransactions}
                  income={selectedPeriodSummary.income}
                  incomeAveragePerDay={selectedPeriodSummary.incomeAveragePerDay}
                  largestIncome={selectedPeriodSummary.largestIncome}
                  expenses={selectedPeriodSummary.expenses}
                  netCashFlow={selectedPeriodSummary.netCashFlow}
                  categorySpending={selectedPeriodSummary.categorySpending}
                  showValues={showFinancialValues}
                />
                <SpendingCategoriesCard data={selectedPeriodSummary.categorySpending} total={selectedPeriodSummary.expenses} showValues={showFinancialValues} />
              </div>

              <div className="dashboard-secondary-row">
                <GoalsStatusCard goal={selectedPeriodSummary.primaryGoal} currentMonth={currentMonth} showValues={showFinancialValues} />
                <NextBestActionCard action={nextBestAction} month={month} currentMonth={currentMonth} />
                <UpcomingBillsCard />
                <MonthlyStatusCard month={month} currentMonth={currentMonth} status={selectedPeriodSummary.monthlyStatus} projection={selectedPeriodSummary.budgetProjection} showValues={showFinancialValues} />
              </div>
            </>
          )}
        </main>
      </div>

      {viewState === "ready" && toast && <DashboardToast toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

function SpendingCategoriesCard({ data, total, showValues }: { data: DashboardCategorySpending[]; total: number | null; showValues: boolean }) {
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
