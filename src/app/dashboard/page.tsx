"use client";

import { useCurrency } from "@/components/CurrencyProvider";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useFinanceData } from "@/components/FinanceDataProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/i18n/translations";
import { useTheme } from "@/components/ThemeProvider";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { getSettingsAccount, markWelcomeSeen } from "@/app/settings/actions";
import { getDisplayCategorySpending, SpendingRadialChart } from "@/components/charts/SpendingRadialChart";
import { DashboardKpiCards } from "@/components/dashboard/DashboardKpiCards";
import { DashboardEmptyState, DashboardErrorState, DashboardLoadingState } from "@/components/dashboard/DashboardSystemStates";
import { DashboardToast, type DashboardToastState } from "@/components/dashboard/DashboardToast";
import { calculateDashboardFinancialSummary, getDashboardMonth, type DashboardCategorySpending } from "@/components/dashboard/dashboard-financial-summary";
import { resolveDashboardViewState } from "@/components/dashboard/dashboard-view-state";
import { GoalsStatusCard } from "@/components/dashboard/GoalsStatusCard";
import { MonthlyStatusCard } from "@/components/dashboard/MonthlyStatusCard";
import { NextBestActionCard } from "@/components/dashboard/NextBestActionCard";
import { calculateNextBestAction } from "@/components/dashboard/next-best-action";
import { UpcomingBillsCard } from "@/components/dashboard/UpcomingBillsCard";
import { DesktopScaleCanvas } from "@/components/DesktopScaleCanvas";
import { FinancialFlow } from "@/components/financial-flow/FinancialFlow";

      export default function DashboardPage() {
        const { language } = useLanguage();
        const { theme, setTheme } = useTheme();

        const {
          transactions,
          budgets,
          budgetAdjustments,
          goals,
          goalContributionPlans,
        } = useFinanceData();

        const t = translations[language].appDashboard;

        const [showFinancialValues, setShowFinancialValues] = useState(true);
        const [toast, setToast] = useState<DashboardToastState | null>(null);

        const [accountEmail, setAccountEmail] = useState("");
        const [displayName, setDisplayName] = useState("");
        const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean | null>(null);

        const [now] = useState(() => new Date());
        const month = getDashboardMonth(now);

        const summary = useMemo(
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
              monthlyStatus: summary.monthlyStatus,
              budgetProjection: summary.budgetProjection,
              safeSavingsCapacity: summary.safeSavingsCapacity,
              primaryGoal: summary.primaryGoal,
              hasActiveBudgetAdjustment:
                summary.savingsCapacity.activeAdjustmentTarget !== null,
            }),
          [
            summary.budgetProjection,
            summary.monthlyStatus,
            summary.primaryGoal,
            summary.safeSavingsCapacity,
            summary.savingsCapacity.activeAdjustmentTarget,
          ],
        );

        const isLoading = false;
        const dashboardError: Error | string | null = null;

        const viewState = resolveDashboardViewState({
          isLoading,
          error: dashboardError,
          hasFinancialData: summary.hasFinancialData,
        });

        useEffect(() => {
          let active = true;

          getSettingsAccount()
            .then((account) => {
              if (!active) return;

              setAccountEmail(account.email);
              setDisplayName(account.profile.display_name ?? "");
              setHasSeenWelcome(account.profile.has_seen_welcome);

              if (!account.profile.has_seen_welcome) {
                void markWelcomeSeen().catch((error) => {
                  console.error("Failed to mark welcome as seen:", error);
                });
              }
            })
            .catch((error) => {
              console.error("Failed to load dashboard account:", error);
            });

          return () => {
            active = false;
          };
        }, []);

        const fullName = displayName.trim();

  return (
    <div className="relative min-h-screen bg-[#080B0F]">
      <div className="relative z-10">
        <DesktopScaleCanvas>
          <main className="relative h-[1024px] w-[1536px] overflow-hidden text-[#F5F7FA]">
            <section className="absolute left-[231px] top-[107px] h-[810px] w-[1164px] overflow-hidden rounded-[38px] border border-[#28313B]/16 bg-[#0D1117]/50 px-[32px] py-[16px] shadow-[0_22px_42px_rgba(0,0,0,0.45)] backdrop-blur-[20px]">
              <div className="flex w-full flex-col gap-[12px]">
                <header className="flex h-[37px] items-center gap-[18px]">
                  <div className="h-[37px] w-[37px] overflow-hidden">
                    <Image src="/moneypilot/moneypilot-logo.svg" alt="" width={180} height={40} priority className="h-[37px] w-auto max-w-none" />
                  </div>
                  <span className="money-pilot-wordmark font-brand text-[21.44px] font-medium tracking-[0.429px]">MoneyPilot</span>
                </header>
                {viewState === "loading" ? <DashboardLoadingState /> : viewState === "empty" ? <DashboardEmptyState /> : <>
                <div className="relative flex h-[58px] items-center justify-between">
                  {/* Welcome */}
                  <div className="flex flex-col gap-[4px] leading-none">
                    <span className="text-[14.48px] text-[#9CA6B2]">
                      {hasSeenWelcome === false ? t.welcome : t.welcomeBack}
                    </span>

                    <strong className="text-[23.17px] font-semibold text-[#F5F7FA]">
                      {fullName || "—"}
                    </strong>
                  </div>

                  {/* Data source */}
                  <div className="absolute left-[548px] top-[15px] flex h-[20px] items-center justify-center gap-[6px] rounded-full border border-[rgba(59,130,246,0.22)] bg-[rgba(59,130,246,0.08)] px-[10px] py-[4px]">
                    <span className="size-[6px] shrink-0 rounded-full bg-[#3B82F6]" />

                    <span className="whitespace-nowrap text-[10px] font-medium text-[#525252]">
                      Manual + CSV · Updated today
                    </span>
                  </div>

                  {/* Controls */}
                  <div className="flex h-[54.188px] w-[359.193px] items-center gap-[12px]">

                    {/* Theme toggle */}
                    <div className="relative h-[54.188px] w-[102px] shrink-0">
                      <div className="flex h-full w-full items-center justify-center gap-[19.125px] overflow-hidden rounded-[35.063px] border-[3.188px] border-white bg-[#9CC0FA] p-[12.75px]">

                        {/* Moon */}
                        <button
                          type="button"
                          onClick={() => setTheme("dark")}
                          aria-label="Dark theme"
                          className={`relative size-[28.688px] shrink-0 ${
                            theme === "dark" ? "opacity-100" : "opacity-40"
                          }`}
                        >
                          <Image
                            src="/moneypilot/dashboard-controls/moon-background.svg"
                            alt=""
                            fill
                            sizes="29px"
                          />

                          <Image
                            src="/moneypilot/dashboard-controls/moon.svg"
                            alt=""
                            width={16}
                            height={16}
                            className="absolute left-[6.52px] top-[6.52px] size-[15.648px]"
                          />
                        </button>

                        {/* Sun */}
                        <button
                          type="button"
                          onClick={() => setTheme("light")}
                          aria-label="Light theme"
                          className={`relative size-[28.688px] shrink-0 ${
                            theme === "light" ? "opacity-100" : "opacity-40"
                          }`}
                        >
                          <Image
                            src="/moneypilot/dashboard-controls/sun-background.svg"
                            alt=""
                            fill
                            sizes="29px"
                          />

                          <Image
                            src="/moneypilot/dashboard-controls/sun.svg"
                            alt=""
                            width={16}
                            height={16}
                            className="absolute left-[6.52px] top-[6.52px] size-[15.648px]"
                          />
                        </button>
                      </div>
                    </div>

                    {/* Date filter */}
                    <div className="flex h-[46.336px] w-[245.193px] shrink-0 items-center overflow-hidden rounded-[25px] bg-[rgba(59,130,246,0.50)] px-[17.376px] py-[3.861px]">
                      <div className="flex w-full items-center gap-[19.307px]">

                        <button
                          type="button"
                          className="whitespace-nowrap text-[12.549px] font-medium text-white"
                        >
                          {t.today}
                        </button>

                        <button
                          type="button"
                          className="flex h-[38.613px] w-[83.018px] shrink-0 items-center justify-center rounded-[24.133px] bg-[#3B82F6] text-[12.549px] font-semibold text-white"
                        >
                          {t.month}
                        </button>

                        <button
                          type="button"
                          className="flex h-[23.168px] shrink-0 items-center gap-[3.861px] whitespace-nowrap text-[12.549px] font-medium text-white"
                        >
                          <Image
                            src="/moneypilot/dashboard-controls/calendar.svg"
                            alt=""
                            width={23}
                            height={23}
                            className="size-[23.168px]"
                          />

                          {t.date}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Avatar */}
                  <div className="absolute right-0 top-[-56px]">
                    <UserAvatar
                      name={displayName}
                      email={accountEmail}
                      size={48}
                    />
                  </div>
                </div>

                <DashboardKpiCards income={summary.income} expenses={summary.expenses} netCashFlow={summary.netCashFlow} accountBalance={summary.accountBalance} showValues={showFinancialValues} onToggleValues={() => setShowFinancialValues((value) => !value)} />

                <div className="flex h-[209px] items-start gap-[12px]">
                  <FinancialFlow income={summary.income} expenses={summary.expenses} netCashFlow={summary.netCashFlow} categorySpending={summary.categorySpending} showValues={showFinancialValues} />
                  <SpendingCategoriesCard data={summary.categorySpending} total={summary.expenses} showValues={showFinancialValues} />
                </div>

                <div className="flex h-[212px] items-start gap-[12px]">
                  <GoalsStatusCard goal={summary.primaryGoal} showValues={showFinancialValues} />
                  <NextBestActionCard action={nextBestAction} />
                  <UpcomingBillsCard />
                  <MonthlyStatusCard status={summary.monthlyStatus} projection={summary.budgetProjection} />
                </div>
                </>}
              </div>
              {viewState === "error" && dashboardError && <DashboardErrorState error={dashboardError} />}
              {viewState === "ready" && toast && <DashboardToast toast={toast} onClose={() => setToast(null)} />}
            </section>
          </main>
        </DesktopScaleCanvas>
      </div>
    </div>
  );
}

function SpendingCategoriesCard({ data, total, showValues }: { data: DashboardCategorySpending[]; total: number; showValues: boolean }) {
  const { language } = useLanguage();
  const { formatMoney: money } = useCurrency();
  const t = translations[language].appDashboard;
  const displayData = getDisplayCategorySpending(data);
  const topCategory = data[0];
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
              <div className="flex min-w-0 items-center gap-[7px] truncate text-[#9CA6B2]"><span className="size-[5px] shrink-0 rounded-full" style={{ backgroundColor: item.color }} />{item.category}</div>
              <span className="text-right text-[#9CA6B2]">{(item.percentage * 100).toFixed(1).replace(".", ",")}%</span>
              <span className="text-right text-[#F5F7FA]">{showValues ? money(item.amount) : "••••••"}</span>
            </div>
          ))}
          {displayData.length === 0 && <p className="col-span-3 text-center text-[9px] text-[#9CA6B2]">No spending data this month</p>}
        </div>
      </div>
      <div className="flex h-[34px] w-full items-center gap-[8px] rounded-[8px] border border-[#1E427A]/70 bg-[#0B1323]/85 px-[9px]">
        <Image src="/moneypilot/dashboard-spending-insight-icon.svg" alt="" width={16} height={16} className="size-[16px]" />
        <div className="leading-tight"><p className="text-[9.5px] font-medium text-[#F5F7FA]">{topCategory ? `${topCategory.category} is your largest expense` : "No spending recorded"}</p><p className="text-[8.5px] text-[#94A5A5]">{topCategory ? `${(topCategory.percentage * 100).toFixed(1)}% of this month's expenses.` : "Expense categories will appear here."}</p></div>
      </div>
    </article>
  );
}
