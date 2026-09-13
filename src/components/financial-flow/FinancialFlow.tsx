"use client";

import { useCurrency } from "@/components/CurrencyProvider";

import { useState } from "react";
import type { CSSProperties } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/i18n/translations";
import type { AppTranslation } from "@/i18n/app-translations";
import type { DashboardCategorySpending } from "@/components/dashboard/dashboard-financial-summary";
import { getTransactionCategoryGroupKey, type Transaction } from "@/components/transactions/transaction-model";
import { buildFinancialFlowSeries, unavailableFinancialFlowSeries, type FinancialFlowPoint } from "@/components/financial-flow/financial-flow-series";
import { aggregateMoney } from "@/lib/domain/money-aggregation";
import { FinancialFlowAreaChart } from "@/components/financial-flow/FinancialFlowAreaChart";
import { FinancialFlowColumnChart } from "@/components/financial-flow/FinancialFlowColumnChart";
import { ApexDonutChart } from "@/components/charts/ApexDonutChart";

type FinancialTab = "balance" | "income" | "expense";
type FinancialView = "bars" | "donut" | "trend";

type FinancialFlowProps =
    | { demo: true }
    | {
          demo?: false;
          month: string;
          aggregationAvailable: boolean;
          categoryAggregationAvailable: boolean;
          transactions: Transaction[];
          income: number | null;
          incomeAveragePerDay: number | null;
          largestIncome: number | null;
          expenses: number | null;
          netCashFlow: number | null;
          categorySpending: DashboardCategorySpending[];
          showValues?: boolean;
      };

const dates = [15, 16, 17, 18, 19, 20, 21];
const demoTrendDates = dates.map((day) => `2026-08-${String(day).padStart(2, "0")}`);
const categoryColors = ["#F43F5E", "#E11D48", "#FB7185", "#BE123C", "#FDA4AF"];
const incomeCategoryColors = ["#22C55E", "#16A34A", "#4ADE80", "#15803D", "#86EFAC"];

const getFinancialFlowData = (t: AppTranslation["financialFlow"], money: (value: number) => string) => ({
    balance: {
        accent: "var(--dashboard-chart-primary)",
        secondary: "var(--dashboard-chart-secondary)",
        glow: "color-mix(in srgb, var(--dashboard-chart-primary) 34%, transparent)",
        soft: "var(--dashboard-brand-soft)",

        rows: [
            {
                label: t.income,
                value: money(3650),
                color: "#22C55E",
                dot: "#22C55E",
            },
            {
                label: t.expenses,
                value: money(2180.5),
                color: "#F43F5E",
                dot: "#F43F5E",
            },
            {
                label: t.labels.accountBalance,
                value: money(2480.75),
                color: "var(--dashboard-chart-primary)",
                dot: "var(--dashboard-chart-primary)",
            },
        ],

        comparisonLabel: t.versusPreviousPeriod,
        comparison: "+12,6%",
        direction: "↗",

        bars: [
            [64, 39],
            [87, 54],
            [50, 31],
            [122, 75],
            [80, 50],
            [98, 61],
            [73, 45],
        ],

        donutTitle: t.availableBalance,
        donutValue: money(2480.75),
        donutMeta: t.labels.accounts,
        donut: [
            {
                label: t.labels.mainAccount,
                value: money(1120),
                percent: 45.1,
                color: "var(--dashboard-chart-primary)",
            },
            {
                label: t.savings,
                value: money(780),
                percent: 31.4,
                color: "var(--dashboard-brand-primary-hover)",
            },
            {
                label: "Revolut",
                value: money(330),
                percent: 13.3,
                color: "var(--dashboard-chart-secondary)",
            },
            {
                label: t.labels.investments,
                value: money(200),
                percent: 8.1,
                color: "var(--dashboard-brand-primary-active)",
            },
            {
                label: t.labels.wallet,
                value: money(50.75),
                percent: 2.1,
                color: "#93C5FD",
            },
        ],

        totalLabel: t.labels.totalBalance,
        total: money(2480.75),

        trend: {
            label: t.lastSevenDaysBalance,
            value: money(2480.75),
            change: "+12,6%",
            delta: `↑ +${money(630.75)} ${t.labels.inPeriod}`,
            values: [1850, 2100, 1980, 2310, 2150, 2280, 2480.75],
            yLabels: [money(2500), money(2000), money(1500), money(1000)],
        },
    },

    income: {
        accent: "#22C55E",
        secondary: "#14532D",
        glow: "rgba(34,197,94,0.34)",
        soft: "rgba(34,197,94,0.08)",

        rows: [
            {
                label: t.income,
                value: money(3650),
                color: "#22C55E",
                dot: "#22C55E",
            },
            {
                label: t.averagePerDay,
                value: money(521.43),
                color: "var(--text-primary)",
                dot: "#15803D",
            },
            {
                label: t.labels.largestIncome,
                value: money(920),
                color: "var(--text-primary)",
                dot: "#22C55E",
            },
        ],

        comparisonLabel: t.versusLastMonth,
        comparison: "+12,4%",
        direction: "↗",

        bars: [
            [64, 39],
            [87, 54],
            [50, 31],
            [122, 75],
            [80, 50],
            [98, 61],
            [73, 45],
        ],

        donutTitle: t.income,
        donutValue: money(3650),
        donutMeta: t.labels.sources,
        donut: [
            {
                label: t.salary,
                value: money(2044),
                percent: 56,
                color: "#22C55E",
            },
            {
                label: t.labels.freelanceProjects,
                value: money(803),
                percent: 22,
                color: "#16A34A",
            },
            {
                label: t.labels.investments,
                value: money(438),
                percent: 12,
                color: "#4ADE80",
            },
            {
                label: t.business,
                value: money(219),
                percent: 6,
                color: "#15803D",
            },
            {
                label: t.labels.other,
                value: money(146),
                percent: 4,
                color: "#86EFAC",
            },
        ],

        totalLabel: t.labels.totalIncome,
        total: money(3650),

        trend: {
            label: t.lastSevenDaysIncome,
            value: money(3650),
            change: "+12,4%",
            delta: `↑ +${money(750)} ${t.labels.inPeriod}`,
            values: [430, 560, 510, 690, 610, 720, 820],
            yLabels: [money(1000), money(750), money(500), money(250)],
        },
    },

    expense: {
        accent: "#F43F5E",
        secondary: "#9F1239",
        glow: "rgba(244,63,94,0.34)",
        soft: "rgba(244,63,94,0.08)",

        rows: [
            {
                label: t.expenses,
                value: money(2180.5),
                color: "#F43F5E",
                dot: "#F43F5E",
            },
            {
                label: t.labels.largestCategory,
                value: t.labels.homeShare,
                color: "#F5F7FA",
                dot: "#BE123C",
            },
            {
                label: t.labels.categories,
                value: "5",
                color: "#F5F7FA",
                dot: "#F43F5E",
            },
        ],

        comparisonLabel: t.versusPreviousPeriod,
        comparison: "-8,7%",
        direction: "↓",

        bars: [
            [76, 84],
            [86, 95],
            [66, 76],
            [111, 116],
            [80, 92],
            [99, 105],
            [72, 78],
        ],

        donutTitle: t.labels.totalExpenses,
        donutValue: money(2180.5),
        donutMeta: t.labels.fiveCategories,
        donut: [
            {
                label: t.labels.housing,
                value: money(784.98),
                percent: 36,
                color: "#F43F5E",
            },
            {
                label: t.food,
                value: money(501.52),
                percent: 23,
                color: "#E11D48",
            },
            {
                label: t.labels.transportation,
                value: money(327.08),
                percent: 15,
                color: "#FB7185",
            },
            {
                label: t.labels.subscriptions,
                value: money(261.66),
                percent: 12,
                color: "#BE123C",
            },
            {
                label: t.labels.leisure,
                value: money(305.26),
                percent: 14,
                color: "#FDA4AF",
            },
        ],

        totalLabel: t.labels.totalExpenses,
        total: money(2180.5),

        trend: {
            label: t.lastSevenDaysExpenses,
            value: money(2180.5),
            change: "-8,7%",
            delta: `↓ ${money(-207.78)} ${t.versusPreviousPeriod}`,
            values: [360, 310, 330, 270, 305, 250, 220],
            yLabels: [money(450), money(350), money(250), money(150)],
        },
    },
});

function buildDistribution(items: { label: string; amount: number }[], total: number, colors: string[], money: (value: number) => string) {
    const sorted = items.filter((item) => item.amount > 0).sort((left, right) => right.amount - left.amount);
    const overflow = aggregateMoney(sorted.slice(4).map((item) => item.amount));
    if (!overflow.available) return [];
    const visible = sorted.length <= 5 ? sorted.map((item) => ({ ...item, composition: undefined as string[] | undefined })) : [
        ...sorted.slice(0, 4).map((item) => ({ ...item, composition: undefined as string[] | undefined })),
        { label: "", amount: overflow.value, composition: sorted.slice(4).map((item) => item.label) },
    ];
    return visible.map((item, index) => ({ ...item, value: money(item.amount), percent: total > 0 ? (item.amount / total) * 100 : 0, color: colors[index % colors.length] }));
}

export function FinancialFlow(props: FinancialFlowProps) {
    const { language } = useLanguage();
  const { formatMoney: money } = useCurrency();
    const appT = translations[language];
    const t = appT.financialFlow;
    const dashboardT = appT.appDashboard;
    const demo = props.demo === true;
    const showValues = demo ? true : (props.showValues ?? true);
    const [financialTab, setFinancialTab] =
        useState<FinancialTab>("balance");

    const [financialView, setFinancialView] =
        useState<FinancialView>("bars");

    const financialFlowData = getFinancialFlowData(t, money);
    let dailySeries: FinancialFlowPoint[] = [];
    let seriesAvailable = true;
    if (!demo) {
        const { month, transactions, aggregationAvailable, categoryAggregationAvailable, income, incomeAveragePerDay, largestIncome, expenses, netCashFlow, categorySpending } = props;
        const [year, monthNumber] = month.split("-");
        const periodLabel = `${t.months[Number(monthNumber) - 1]} ${year}`;
        const series = aggregationAvailable && income !== null && expenses !== null && netCashFlow !== null
            ? buildFinancialFlowSeries({ month, transactions, expectedTotals: { income, expenses, netCashFlow } })
            : unavailableFinancialFlowSeries("invalid_operand");
        dailySeries = series.points;
        seriesAvailable = series.available;
        financialFlowData.balance.rows[0].value = aggregationAvailable && income !== null ? money(income) : "—";
        financialFlowData.balance.rows[1].value = aggregationAvailable && expenses !== null ? money(expenses) : "—";
        financialFlowData.balance.rows[2].label = dashboardT.netCashFlow;
        financialFlowData.balance.rows[2].value = aggregationAvailable && netCashFlow !== null ? money(netCashFlow) : "—";
        financialFlowData.income.rows[0].value = aggregationAvailable && income !== null ? money(income) : "—";
        financialFlowData.income.rows[1].value = incomeAveragePerDay === null ? dashboardT.incomeIndicatorUnavailable : money(incomeAveragePerDay);
        financialFlowData.income.rows[2].value = largestIncome === null ? dashboardT.noIncomeRecorded : money(largestIncome);
        financialFlowData.expense.rows[0].value = aggregationAvailable && expenses !== null ? money(expenses) : "—";
        financialFlowData.expense.rows[1].value = categoryAggregationAvailable && categorySpending[0] ? `${categorySpending[0].localizationKey ? dashboardT[categorySpending[0].localizationKey] : categorySpending[0].category} · ${(categorySpending[0].percentage * 100).toFixed(1)}%` : "—";
        financialFlowData.expense.rows[2].value = categoryAggregationAvailable ? String(categorySpending.length) : "—";
        financialFlowData.expense.rows[1].color = "var(--text-primary)";
        financialFlowData.expense.rows[2].color = "var(--text-primary)";
        for (const tab of ["balance", "income", "expense"] as const) {
            const value = tab === "balance" ? netCashFlow : tab === "income" ? income : expenses;
            financialFlowData[tab].bars = [];
            financialFlowData[tab].comparisonLabel = periodLabel;
            financialFlowData[tab].comparison = "";
            financialFlowData[tab].direction = "•";
            financialFlowData[tab].donutTitle = tab === "balance" ? dashboardT.netCashFlow : tab === "income" ? t.income : t.expenses;
            financialFlowData[tab].donutValue = aggregationAvailable && value !== null ? money(value) : "—";
            financialFlowData[tab].donutMeta = periodLabel;
            financialFlowData[tab].donut = [];
            financialFlowData[tab].total = aggregationAvailable && value !== null ? money(value) : "—";
            financialFlowData[tab].trend.value = aggregationAvailable && value !== null ? money(value) : "—";
            financialFlowData[tab].trend.change = "";
            financialFlowData[tab].trend.delta = dashboardT.historicalSeriesUnavailable;
            financialFlowData[tab].trend.values = [];
            financialFlowData[tab].trend.yLabels = [];
        }

        if (categoryAggregationAvailable && expenses !== null && expenses > 0) {
            const expenseItems = categorySpending
                .filter((item) => item.amount > 0 && item.percentage > 0)
                .map((item) => ({
                    label: item.localizationKey ? dashboardT[item.localizationKey] : item.category,
                    amount: item.amount,
                }));
            const expenseDistribution = buildDistribution(expenseItems, expenses, categoryColors, money).map((item) => item.label ? item : { ...item, label: dashboardT.other });
            const distributionPercent = expenseDistribution.reduce((total, item) => total + item.percent, 0);
            if (Math.abs(distributionPercent - 100) < 0.01) {
                financialFlowData.expense.donut = expenseDistribution;
            }
        }

        if (categoryAggregationAvailable && income !== null && income > 0) {
            const categories = new Map<string, { label: string; amounts: number[] }>();
            for (const transaction of transactions) {
                if (transaction.type !== "income") continue;
                const category = transaction.category;
                const key = getTransactionCategoryGroupKey(transaction);
                const currentCategory = categories.get(key);
                categories.set(key, {
                    label: currentCategory?.label ?? (category ?? dashboardT.uncategorized),
                    amounts: [...(currentCategory?.amounts ?? []), transaction.amount],
                });
            }
            const incomeItems: { label: string; amount: number }[] = [];
            let incomeDistributionAvailable = true;
            for (const item of categories.values()) {
                const total = aggregateMoney(item.amounts);
                if (!total.available) { incomeDistributionAvailable = false; break; }
                incomeItems.push({ label: item.label, amount: total.value });
            }
            if (incomeDistributionAvailable) financialFlowData.income.donut = buildDistribution(incomeItems, income, incomeCategoryColors, money).map((item) => item.label ? item : { ...item, label: dashboardT.other });
        }
    }
    const current = financialFlowData[financialTab];
    const hasHistoricalSeries = demo || (!demo && seriesAvailable && props.transactions.length > 0);
    const hasDistribution = current.donut.length > 0;

    const barValues = demo
        ? []
        : dailySeries.map((point) => financialTab === "balance" ? point.net : financialTab === "income" ? point.income : point.expense);
    const trendValues = demo
        ? current.trend.values
        : dailySeries.map((point) => financialTab === "balance" ? point.cumulativeNet : financialTab === "income" ? point.cumulativeIncome : point.cumulativeExpense);
    const chartLabel = financialTab === "balance"
        ? dashboardT.dailyNetFlow
        : financialTab === "income"
          ? dashboardT.dailyIncome
          : dashboardT.dailyExpenses;
    const trendLabel = financialTab === "balance"
        ? dashboardT.cumulativeNetFlow
        : financialTab === "income"
          ? dashboardT.cumulativeIncome
          : dashboardT.cumulativeExpenses;

    const currentViewIcon =
        financialView === "bars"
            ? "/moneypilot/dashboard-flow-button-bars.svg"
            : financialView === "donut"
              ? "/moneypilot/dashboard-flow-button-pie.svg"
              : "/moneypilot/dashboard-flow-button-timeline.svg";

    const changeTab = (tab: FinancialTab) => {
        setFinancialTab(tab);
    };

    const renderUnavailable = (message: string) => (
        <div className="flex h-[142px] w-[415px] shrink-0 items-center justify-center rounded-[14px] border border-[var(--financial-flow-divider)] bg-[var(--financial-summary-surface)] px-[24px] text-center">
            <p className="text-[10px] font-medium text-[var(--financial-flow-muted)]">{message}</p>
        </div>
    );

    const renderSummary = () => (
        <div
            className="
                flex
                h-[148px]
                w-[150px]
                shrink-0
                flex-col
                justify-center
                gap-[6px]
                overflow-hidden
                rounded-[16px]
                border
                border-[var(--financial-flow-summary-border)]
                bg-[var(--financial-summary-surface)]
                px-[10px]
                pb-[8px]
                pt-[9px]
            "
        >
            <p className="text-[11px] font-semibold text-[var(--text-primary)]">
                {t.periodSummary}
            </p>

            {current.rows.map((row, index) => (
                <div key={row.label}>
                    {index === 2 && (
                        <div className="mb-[6px] h-px w-[130px] bg-[var(--financial-flow-divider)]" />
                    )}

                    <div className="flex h-[18px] w-[130px] items-center justify-between">
                        <div className="flex items-center gap-[5px]">
                            <span
                                className="h-[5px] w-[5px] rounded-full"
                                style={{
                                    backgroundColor: row.dot,
                                }}
                            />

                            <span
                                className="text-[8.5px] text-[var(--financial-flow-muted)]"
                                title={financialTab === "income" && index === 1 ? dashboardT.incomeAveragePerDayHelp : undefined}
                            >
                                {row.label}
                            </span>
                        </div>

                        <strong
                            className="numeric-value text-[10px] font-semibold"
                            style={{
                                color: row.color,
                            }}
                        >
                            {showValues ? row.value : "••••"}
                        </strong>
                    </div>
                </div>
            ))}

            <div
                className="
                    flex
                    h-[20px]
                    w-[130px]
                    items-center
                    justify-center
                    gap-[4px]
                    rounded-[10px]
                "
                style={{
                    backgroundColor: current.soft,
                }}
            >
                <span
                    className="text-[9px] font-semibold"
                    style={{ color: current.accent }}
                >
                    {current.direction}
                </span>

                <span className="text-[7.5px] text-[var(--financial-flow-comparison)]">
                    {current.comparisonLabel}
                </span>

                <strong
                    className="numeric-value text-[8px] font-semibold"
                    style={{ color: current.accent }}
                >
                    {current.comparison}
                </strong>
            </div>
        </div>
    );

    const renderViewMenu = () => {
        const views: {
            id: FinancialView;
            label: string;
            icon: string;
        }[] = [
            {
                id: "bars",
                label: t.barView,
                icon: "/moneypilot/dashboard-flow-button-bars.svg",
            },
            {
                id: "donut",
                label: t.distributionView,
                icon: "/moneypilot/dashboard-flow-button-pie.svg",
            },
            {
                id: "trend",
                label: t.trendView,
                icon: "/moneypilot/dashboard-flow-button-timeline.svg",
            },
        ];

        return (
    <div className="absolute bottom-[12px] right-[12px] flex h-[148px] w-[42px] flex-col items-center justify-center gap-[7px]">
                {views.map((view) => {
                    const active = financialView === view.id;

                    return (
                        <button
                            key={view.id}
                            type="button"
                            aria-label={view.label}
                            onClick={() =>
                                setFinancialView(view.id)
                            }
                            className="
                                flex
                                h-[29px]
                                w-[29px]
                                items-center
                                justify-center
                                rounded-full
                                border
                                transition-all
                                duration-200
                            "
                            style={{
                                borderColor: current.accent,
                                backgroundColor: active
                                    ? `${current.accent}4D`
                                    : current.soft,
                                boxShadow: active
                                    ? `0 0 6px ${current.glow}`
                                    : "none",
                            }}
                        >
                            <span
                                className="financial-flow-icon-mask"
                                style={{
                                    "--financial-flow-icon": `url("${view.icon}")`,
                                    "--financial-flow-icon-color": current.accent,
                                } as CSSProperties}
                                aria-hidden="true"
                            />
                        </button>
                    );
                })}
            </div>
        );
    };

    return (
        <article
            className="
                relative
                flex
                h-[209px]
                w-[677px]
                shrink-0
                flex-col
                justify-center
                gap-[10px]
                overflow-hidden
                rounded-[19px]
                border
                border-[var(--financial-flow-border)]
                bg-[var(--financial-flow-surface)]
                shadow-[var(--financial-flow-shadow)]
                backdrop-blur-[12px]
                p-[12px]
            "
        >
            {/* HEADER */}
            <div className="flex h-[34px] w-full items-center justify-between">
                <div className="flex items-center gap-[12px]">
                    <div
                        className="
                            flex
                            h-[29px]
                            w-[29px]
                            shrink-0
                            items-center
                            justify-center
                            rounded-full
                            border
                            bg-[var(--background-card)]
                        "
                        style={{
                            borderColor: current.accent,
                            backgroundColor: `${current.accent}4D`,
                            boxShadow: `0 0 6px ${current.glow}`,
                        }}
                    >
                        <span
                            className="financial-flow-icon-mask"
                            style={{
                                "--financial-flow-icon": `url("${currentViewIcon}")`,
                                "--financial-flow-icon-color": current.accent,
                            } as CSSProperties}
                            aria-hidden="true"
                        />
                    </div>

                    <h2 className="text-[21px] font-bold leading-none text-[var(--text-primary)]">
                        {t.title}
                    </h2>
                </div>

                {/* SALDO / RECEITAS / DESPESAS */}
                <div className="flex h-[27px] w-[272px] items-center justify-center gap-[24px] rounded-full border border-[var(--financial-flow-tab-border)] bg-[var(--financial-flow-tab-surface)] py-[10px] pl-[2px] pr-[12px]">
                    {[
                        {
                            id: "balance" as FinancialTab,
                            label: t.balance,
                        },
                        {
                            id: "income" as FinancialTab,
                            label: t.income,
                        },
                        {
                            id: "expense" as FinancialTab,
                            label: t.expenses,
                        },
                    ].map((tab) => {
                        const active =
                            financialTab === tab.id;

                        const tabColor =
                            tab.id === "balance"
                                ? "var(--dashboard-chart-primary)"
                                : tab.id === "income"
                                  ? "#22C55E"
                                  : "#F43F5E";

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() =>
                                    changeTab(tab.id)
                                }
                                className={`
                                    flex
                                    h-[21px]
                                    items-center
                                    justify-center
                                    rounded-full
                                    border
                                    text-[12px]
                                    transition-all
                                    duration-200
                                    ${
                                        active
                                            ? "border-transparent font-semibold text-[var(--primary-button-text)]"
                                            : "border-transparent bg-transparent font-semibold text-[var(--text-primary)]"
                                    }
                                `}
                                style={
                                    active
                                        ? {
                                              backgroundColor:
                                                  tabColor,
                                              minWidth: "99px",
                                          }
                                        : undefined
                                }
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {!showValues ? (
                <div className="flex h-[148px] w-full items-center gap-[24px]">
                    <div className="w-[150px] shrink-0" />
                    {renderUnavailable(dashboardT.valuesHidden)}
                    {renderViewMenu()}
                </div>
            ) : <>
            {/* BARRAS */}
            {financialView === "bars" && (
                <div className="flex h-[148px] w-full items-center gap-[24px]">
                    {renderSummary()}

                    {hasHistoricalSeries ? <div className="h-[142px] w-[415px] shrink-0 overflow-visible" aria-label={chartLabel}>
                        <FinancialFlowColumnChart color={current.accent} datesISO={demo ? demoTrendDates : dailySeries.map((point) => point.dateISO)} label={chartLabel} resetKey={`${demo ? "demo" : props.month}-${financialTab}`} secondaryColor={demo ? current.secondary : undefined} secondaryValues={demo ? current.bars.map(([, secondary]) => secondary) : undefined} tooltipEnabled={!demo} values={demo ? current.bars.map(([primary]) => primary) : barValues} />
                    </div> : renderUnavailable(dashboardT.noMovementsInPeriod)}

                    {renderViewMenu()}
                </div>
            )}

            {/* DONUT */}
            {financialView === "donut" && (
                <div className="flex h-[148px] w-full items-center gap-[24px]">
                    {renderSummary()}

                    {hasDistribution && showValues ? <div className="flex h-[142px] w-[415px] shrink-0 items-center overflow-hidden">
                    <div className="flex h-[142px] w-[128px] shrink-0 items-center justify-center">
                        <ApexDonutChart items={current.donut.map((item) => ({ label: item.label, value: item.percent, valueLabel: item.value, percent: item.percent, color: item.color, composition: (item as typeof item & { composition?: string[] }).composition }))} totalLabel={current.donutTitle} totalValue={current.donutValue} size={120} />
                    </div>

                    <div className="flex h-[142px] w-[287px] shrink-0 flex-col pt-[3px]">
                        <div className="grid h-[14px] grid-cols-[1fr_70px_40px] text-[7px] text-[#8E96A5]">
                            <span className="pl-[13px]">
                                {financialTab === "balance"
                                    ? t.account
                                    : financialTab === "income"
                                      ? t.labels.sources.replace("5 ", "")
                                      : t.category}
                            </span>

                            <span>{appT.appTransactions.value}</span>
                            <span>%</span>
                        </div>

                        {current.donut.map((item) => (
                            <div
                                key={item.label}
                                className="grid h-[18px] grid-cols-[1fr_70px_40px] items-center text-[8px]"
                            >
                                <div className="flex items-center gap-[6px] pl-[2px]">
                                    <span
                                        className="h-[5px] w-[5px] shrink-0 rounded-full"
                                        style={{
                                            backgroundColor:
                                                item.color,
                                        }}
                                    />

                                    <span className="text-[#C7CCD6]">
                                        {item.label}
                                    </span>
                                </div>

                                <span className="numeric-value text-[#F5F7FA]">
                                    {showValues ? item.value : "••••••"}
                                </span>

                                <span className="numeric-value text-[#9CA6B2]">
                                    {item.percent.toFixed(1).replace(".", ",")}%
                                </span>
                            </div>
                        ))}

                        <div className="h-px w-full bg-[#28313B]" />

                        <div
                            className="
                                mt-[1px]
                                grid
                                h-[20px]
                                grid-cols-[1fr_70px_40px]
                                items-center
                                rounded-[6px]
                                px-[2px]
                                text-[8.5px]
                            "
                            style={{
                                backgroundColor:
                                    current.soft,
                            }}
                        >
                            <strong className="pl-[11px] text-[#F5F7FA]">
                                {current.totalLabel}
                            </strong>

                            <strong className="numeric-value text-[#F5F7FA]">
                                {showValues ? current.total : "••••••"}
                            </strong>

                            <span className="numeric-value text-[#9CA6B2]">
                                100%
                            </span>
                        </div>
                    </div>
                    </div> : renderUnavailable(hasHistoricalSeries ? dashboardT.distributionUnavailable : dashboardT.noMovementsInPeriod)}

                    {renderViewMenu()}
                </div>
            )}

            {/* LINHA */}
            {financialView === "trend" && (
                <div className="flex h-[148px] w-full items-center gap-[24px]">
                    {renderSummary()}

                    {hasHistoricalSeries ? <div className="h-[142px] w-[415px] shrink-0 overflow-visible" aria-label={demo ? current.trend.label : trendLabel}>
                        <FinancialFlowAreaChart
                            color={current.accent}
                            datesISO={demo ? demoTrendDates : dailySeries.map((point) => point.dateISO)}
                            label={demo ? current.trend.label : trendLabel}
                            resetKey={`${demo ? "demo" : props.month}-${financialTab}`}
                            values={trendValues}
                        />
                    </div> : renderUnavailable(dashboardT.noMovementsInPeriod)}

                    {renderViewMenu()}
                </div>
            )}
            </>}
        </article>
    );
}
