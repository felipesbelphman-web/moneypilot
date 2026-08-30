"use client";

import { useCurrency } from "@/components/CurrencyProvider";

import { useState } from "react";
import type { CSSProperties } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/i18n/translations";
import type { AppTranslation } from "@/i18n/app-translations";
import type { DashboardCategorySpending } from "@/components/dashboard/dashboard-financial-summary";

type FinancialTab = "balance" | "income" | "expense";
type FinancialView = "bars" | "donut" | "trend";

const dates = [15, 16, 17, 18, 19, 20, 21];

const getFinancialFlowData = (t: AppTranslation["financialFlow"], money: (value: number) => string) => ({
    balance: {
        accent: "#3B82F6",
        secondary: "#60A5FA",
        glow: "rgba(59,130,246,0.34)",
        soft: "rgba(59,130,246,0.08)",

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
                color: "#3B82F6",
                dot: "#3B82F6",
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
                color: "#3B82F6",
            },
            {
                label: t.savings,
                value: money(780),
                percent: 31.4,
                color: "#2563EB",
            },
            {
                label: "Revolut",
                value: money(330),
                percent: 13.3,
                color: "#60A5FA",
            },
            {
                label: t.labels.investments,
                value: money(200),
                percent: 8.1,
                color: "#1D4ED8",
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
                color: "#F5F7FA",
                dot: "#15803D",
            },
            {
                label: t.labels.largestIncome,
                value: money(920),
                color: "#F5F7FA",
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

function buildDonutBackground(
    items: readonly {
        percent: number;
        color: string;
    }[],
) {
    let start = 0;

    const sections = items.map((item) => {
        const end = start + item.percent;
        const result = `${item.color} ${start}% ${end}%`;
        start = end;
        return result;
    });

    return `conic-gradient(${sections.join(", ")})`;
}

export function FinancialFlow({ income, expenses, netCashFlow, categorySpending, showValues = true }: { income?: number; expenses?: number; netCashFlow?: number; categorySpending?: DashboardCategorySpending[]; showValues?: boolean }) {
    const { language } = useLanguage();
  const { formatMoney: money } = useCurrency();
    const appT = translations[language];
    const t = appT.financialFlow;
    const [financialTab, setFinancialTab] =
        useState<FinancialTab>("balance");

    const [financialView, setFinancialView] =
        useState<FinancialView>("bars");

    const financialFlowData = getFinancialFlowData(t, money);
    if (income !== undefined && expenses !== undefined && netCashFlow !== undefined) {
        financialFlowData.balance.rows[0].value = money(income);
        financialFlowData.balance.rows[1].value = money(expenses);
        financialFlowData.balance.rows[2].label = "Net cash flow";
        financialFlowData.balance.rows[2].value = money(netCashFlow);
        financialFlowData.income.rows[0].value = money(income);
        financialFlowData.income.rows[1].value = "—";
        financialFlowData.income.rows[2].value = "—";
        financialFlowData.expense.rows[0].value = money(expenses);
        financialFlowData.expense.rows[1].value = categorySpending?.[0] ? `${categorySpending[0].category} · ${(categorySpending[0].percentage * 100).toFixed(1)}%` : "—";
        financialFlowData.expense.rows[2].value = String(categorySpending?.length ?? 0);
        for (const tab of ["balance", "income", "expense"] as const) {
            const value = tab === "balance" ? netCashFlow : tab === "income" ? income : expenses;
            financialFlowData[tab].bars = dates.map(() => [0, 0]);
            financialFlowData[tab].comparisonLabel = "Current month";
            financialFlowData[tab].comparison = "";
            financialFlowData[tab].direction = "•";
            financialFlowData[tab].donutTitle = tab === "balance" ? "Net cash flow" : tab === "income" ? t.income : t.expenses;
            financialFlowData[tab].donutValue = money(value);
            financialFlowData[tab].donutMeta = "Current month";
            financialFlowData[tab].donut = [{ label: financialFlowData[tab].donutTitle, value: money(value), percent: 100, color: financialFlowData[tab].accent }];
            financialFlowData[tab].total = money(value);
            financialFlowData[tab].trend.value = money(value);
            financialFlowData[tab].trend.change = "";
            financialFlowData[tab].trend.delta = "Historical series unavailable";
            financialFlowData[tab].trend.values = dates.map(() => 0);
            financialFlowData[tab].trend.yLabels = ["", "", "", ""];
        }
    }
    const current = financialFlowData[financialTab];

    const donutBackground = buildDonutBackground(current.donut);

    const trendMin = Math.min(...current.trend.values);
    const trendMax = Math.max(...current.trend.values);
    const trendRange = trendMax - trendMin || 1;

    const trendPoints = current.trend.values
        .map((value, index) => {
            const x =
                (index / (current.trend.values.length - 1)) * 384;

            const y =
                79 -
                ((value - trendMin) / trendRange) * 60;

            return `${x},${y}`;
        })
        .join(" ");

    const trendAreaPoints = `0,88 ${trendPoints} 384,88`;

    const currentViewIcon =
        financialView === "bars"
            ? "/moneypilot/dashboard-flow-button-bars.svg"
            : financialView === "donut"
              ? "/moneypilot/dashboard-flow-button-pie.svg"
              : "/moneypilot/dashboard-flow-button-timeline.svg";

    const changeTab = (tab: FinancialTab) => {
        setFinancialTab(tab);
    };

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

                            <span className="text-[8.5px] text-[var(--financial-flow-muted)]">
                                {row.label}
                            </span>
                        </div>

                        <strong
                            className="text-[10px] font-semibold"
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
                    className="text-[8px] font-semibold"
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
                                ? "#3B82F6"
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

            {/* BARRAS */}
            {financialView === "bars" && (
                <div className="flex h-[148px] w-full items-center gap-[24px]">
                    {renderSummary()}

                    <div className="flex h-[142px] w-[415px] flex-col justify-between">
                        <div className="flex h-[124px] items-end justify-between">
                            {current.bars.map(
                                ([primary, secondary], index) => (
                                    <div
                                        key={dates[index]}
                                        className="flex h-full w-[40px] items-end justify-center"
                                    >
                                        <div className="flex items-end gap-[3px]">
                                            <div
                                                className="w-[15px] rounded-[7px] transition-all duration-300"
                                                style={{
                                                    height: `${primary}px`,
                                                    backgroundColor:
                                                        current.accent,
                                                }}
                                            />

                                            <div
                                                className="w-[15px] rounded-[7px] transition-all duration-300"
                                                style={{
                                                    height: `${secondary}px`,
                                                    backgroundColor:
                                                        current.secondary,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ),
                            )}
                        </div>

                        <div className="flex w-full justify-between text-center text-[7px] font-semibold text-[var(--financial-flow-muted)]">
                            {dates.map((date) => (
                                <span
                                    key={date}
                                    className="w-[40px]"
                                >
                                    {date} {t.months[7]}
                                </span>
                            ))}
                        </div>
                    </div>

                    {renderViewMenu()}
                </div>
            )}

            {/* DONUT */}
            {financialView === "donut" && (
                <div className="flex h-[148px] w-full items-center gap-[24px]">
                    {renderSummary()}

                    <div className="flex h-[142px] w-[415px] shrink-0 items-center overflow-hidden">
                    <div className="flex h-[142px] w-[128px] shrink-0 items-center justify-center">
                        <div className="relative flex h-[120px] w-[120px] items-center justify-center">
                            <div
                                className="absolute inset-0 rounded-full"
                                style={{
                                    background:
                                        donutBackground,
                                }}
                            />

                            <div className="absolute h-[72px] w-[72px] rounded-full bg-[var(--background-card)]" />

                            <div className="relative z-10 flex flex-col items-center justify-center text-center">
                                <span className="text-[6.5px] text-[#9CA6B2]">
                                    {current.donutTitle}
                                </span>

                                <strong className="mt-[2px] text-[10px] font-semibold text-[#F5F7FA]">
                                    {showValues ? current.donutValue : "••••••"}
                                </strong>

                                <span
                                    className="mt-[2px] text-[7px] font-semibold"
                                    style={{
                                        color: current.accent,
                                    }}
                                >
                                    {current.donutMeta}
                                </span>

                                <span className="mt-[1px] text-[5.5px] text-[#778190]">
                                    {t.currentDistribution}
                                </span>
                            </div>
                        </div>
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

                                <span className="text-[#F5F7FA]">
                                    {showValues ? item.value : "••••••"}
                                </span>

                                <span className="text-[#9CA6B2]">
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

                            <strong className="text-[#F5F7FA]">
                                {showValues ? current.total : "••••••"}
                            </strong>

                            <span className="text-[#9CA6B2]">
                                100%
                            </span>
                        </div>
                    </div>
                    </div>

                    {renderViewMenu()}
                </div>
            )}

            {/* LINHA */}
            {financialView === "trend" && (
                <div className="flex h-[148px] w-full items-center gap-[24px]">
                    {renderSummary()}

                    <div className="relative h-[142px] w-[415px] shrink-0 overflow-hidden">
                        {/* Header gráfico */}
                        <div className="absolute left-[8px] top-0 flex items-center gap-[5px]">
                            <span
                                className="h-[6px] w-[6px] rounded-full"
                                style={{
                                    backgroundColor:
                                        current.accent,
                                }}
                            />

                            <span className="text-[8.5px] font-medium text-[#A9B2BE]">
                                {current.trend.label}
                            </span>
                        </div>

                        <div className="absolute right-[8px] top-0 flex items-center gap-[8px]">
                            <strong className="text-[10px] font-semibold text-[#F5F7FA]">
                                {showValues ? current.trend.value : "••••••"}
                            </strong>

                            <strong
                                className="text-[8.5px] font-semibold"
                                style={{
                                    color: current.accent,
                                }}
                            >
                                {current.trend.change}
                            </strong>
                        </div>

                        {/* Grid */}
                        {[21, 50, 79, 108].map(
                            (top) => (
                                <div
                                    key={top}
                                    className="absolute left-[8px] h-px w-[384px] bg-[rgba(91,104,120,0.20)]"
                                    style={{ top }}
                                />
                            ),
                        )}

                        {/* SVG */}
                        <svg
                            viewBox="0 0 384 88"
                            preserveAspectRatio="none"
                            className="absolute left-[8px] top-[21px] h-[88px] w-[384px] overflow-visible"
                            aria-hidden="true"
                        >
                            <polygon
                                points={trendAreaPoints}
                                fill={current.accent}
                                opacity="0.08"
                            />

                            <polyline
                                points={trendPoints}
                                fill="none"
                                stroke={current.accent}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />

                            {current.trend.values.map(
                                (value, index) => {
                                    const x =
                                        (index /
                                            (current.trend
                                                .values.length -
                                                1)) *
                                        384;

                                    const y =
                                        79 -
                                        ((value - trendMin) /
                                            trendRange) *
                                            60;

                                    return (
                                        <circle
                                            key={index}
                                            cx={x}
                                            cy={y}
                                            r={
                                                index ===
                                                current.trend
                                                    .values
                                                    .length -
                                                    1
                                                    ? 3.5
                                                    : 2.5
                                            }
                                            fill="#F5F7FA"
                                            stroke={
                                                current.accent
                                            }
                                            strokeWidth="2"
                                        />
                                    );
                                },
                            )}
                        </svg>

                        {/* Valores eixo Y */}
                        {current.trend.yLabels.map(
                            (label, index) => (
                                <span
                                    key={label}
                                    className="absolute right-[1px] text-[6.8px] text-[#7A8190]"
                                    style={{
                                        top:
                                            18 +
                                            index * 29,
                                    }}
                                >
                                    {showValues ? label : "••••••"}
                                </span>
                            ),
                        )}

                        {/* Datas */}
                        <div className="absolute left-[2px] top-[117px] flex w-[390px] justify-between">
                            {dates.map((date) => (
                                <span
                                    key={date}
                                    className="w-[40px] text-center text-[6.5px] text-[#8993A1]"
                                >
                                    {date} {t.months[7]}
                                </span>
                            ))}
                        </div>

                        <span
                            className="absolute left-[8px] top-[132px] text-[6.7px] font-medium"
                            style={{
                                color: current.accent,
                            }}
                        >
                            {showValues ? current.trend.delta : "••••••"}
                        </span>

                        <span className="absolute right-[8px] top-[132px] text-[6.7px] text-[#6F7987]">
                            15–21 {t.months[7]}
                        </span>
                    </div>

                    {renderViewMenu()}
                </div>
            )}
        </article>
    );
}
