"use client";

import Image from "next/image";
import { useState } from "react";

type FinancialTab = "balance" | "income" | "expense";
type FinancialView = "bars" | "donut" | "trend";

const dates = [
    "15 Ago",
    "16 Ago",
    "17 Ago",
    "18 Ago",
    "19 Ago",
    "20 Ago",
    "21 Ago",
];

const financialFlowData = {
    balance: {
        accent: "#3B82F6",
        secondary: "#60A5FA",
        glow: "rgba(59,130,246,0.34)",
        soft: "rgba(59,130,246,0.08)",

        rows: [
            {
                label: "Receitas",
                value: "€3.650,00",
                color: "#22C55E",
                dot: "#22C55E",
            },
            {
                label: "Despesas",
                value: "€2.180,50",
                color: "#F43F5E",
                dot: "#F43F5E",
            },
            {
                label: "Saldo em contas",
                value: "€2.480,75",
                color: "#3B82F6",
                dot: "#3B82F6",
            },
        ],

        comparisonLabel: "vs. período anterior",
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

        donutTitle: "Saldo disponível",
        donutValue: "€2.480,75",
        donutMeta: "5 contas",
        donut: [
            {
                label: "Conta principal",
                value: "€1.120,00",
                percent: 45.1,
                color: "#3B82F6",
            },
            {
                label: "Poupança",
                value: "€780,00",
                percent: 31.4,
                color: "#2563EB",
            },
            {
                label: "Revolut",
                value: "€330,00",
                percent: 13.3,
                color: "#60A5FA",
            },
            {
                label: "Investimentos",
                value: "€200,00",
                percent: 8.1,
                color: "#1D4ED8",
            },
            {
                label: "Carteira",
                value: "€50,75",
                percent: 2.1,
                color: "#93C5FD",
            },
        ],

        totalLabel: "Saldo total",
        total: "€2.480,75",

        trend: {
            label: "Saldo disponível · últimos 7 dias",
            value: "€2.480,75",
            change: "+12,6%",
            delta: "↑ +€630,75 no período",
            values: [1850, 2100, 1980, 2310, 2150, 2280, 2480.75],
            yLabels: ["€2.500", "€2.000", "€1.500", "€1.000"],
        },
    },

    income: {
        accent: "#22C55E",
        secondary: "#14532D",
        glow: "rgba(34,197,94,0.34)",
        soft: "rgba(34,197,94,0.08)",

        rows: [
            {
                label: "Receitas",
                value: "€3.650,00",
                color: "#22C55E",
                dot: "#22C55E",
            },
            {
                label: "Média / dia",
                value: "€521,43",
                color: "#F5F7FA",
                dot: "#15803D",
            },
            {
                label: "Maior entrada",
                value: "€920,00",
                color: "#F5F7FA",
                dot: "#22C55E",
            },
        ],

        comparisonLabel: "vs. mês passado",
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

        donutTitle: "Receitas",
        donutValue: "€3.650,00",
        donutMeta: "5 fontes",
        donut: [
            {
                label: "Salário",
                value: "€2.044,00",
                percent: 56,
                color: "#22C55E",
            },
            {
                label: "Freelance / Projetos",
                value: "€803,00",
                percent: 22,
                color: "#16A34A",
            },
            {
                label: "Investimentos",
                value: "€438,00",
                percent: 12,
                color: "#4ADE80",
            },
            {
                label: "Negócios",
                value: "€219,00",
                percent: 6,
                color: "#15803D",
            },
            {
                label: "Outros",
                value: "€146,00",
                percent: 4,
                color: "#86EFAC",
            },
        ],

        totalLabel: "Total receitas",
        total: "€3.650,00",

        trend: {
            label: "Receitas · últimos 7 dias",
            value: "€3.650,00",
            change: "+12,4%",
            delta: "↑ +€750,00 no período",
            values: [430, 560, 510, 690, 610, 720, 820],
            yLabels: ["€1.000", "€750", "€500", "€250"],
        },
    },

    expense: {
        accent: "#F43F5E",
        secondary: "#9F1239",
        glow: "rgba(244,63,94,0.34)",
        soft: "rgba(244,63,94,0.08)",

        rows: [
            {
                label: "Despesas",
                value: "€2.180,50",
                color: "#F43F5E",
                dot: "#F43F5E",
            },
            {
                label: "Maior categoria",
                value: "Casa · 36%",
                color: "#F5F7FA",
                dot: "#BE123C",
            },
            {
                label: "Categorias",
                value: "5",
                color: "#F5F7FA",
                dot: "#F43F5E",
            },
        ],

        comparisonLabel: "vs. período anterior",
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

        donutTitle: "Total despesas",
        donutValue: "€2.180,50",
        donutMeta: "5 categorias",
        donut: [
            {
                label: "Moradia",
                value: "€784,98",
                percent: 36,
                color: "#F43F5E",
            },
            {
                label: "Alimentação",
                value: "€501,52",
                percent: 23,
                color: "#E11D48",
            },
            {
                label: "Transporte",
                value: "€327,08",
                percent: 15,
                color: "#FB7185",
            },
            {
                label: "Assinaturas",
                value: "€261,66",
                percent: 12,
                color: "#BE123C",
            },
            {
                label: "Lazer",
                value: "€305,26",
                percent: 14,
                color: "#FDA4AF",
            },
        ],

        totalLabel: "Total despesas",
        total: "€2.180,50",

        trend: {
            label: "Despesas · últimos 7 dias",
            value: "€2.180,50",
            change: "-8,7%",
            delta: "↓ -€207,78 vs. período anterior",
            values: [360, 310, 330, 270, 305, 250, 220],
            yLabels: ["€450", "€350", "€250", "€150"],
        },
    },
} as const;

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

export function FinancialFlow({ showValues = true }: { showValues?: boolean }) {
    const [financialTab, setFinancialTab] =
        useState<FinancialTab>("balance");

    const [financialView, setFinancialView] =
        useState<FinancialView>("bars");

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
                border-[#28313B]
                bg-[rgba(21,28,38,0.92)]
                px-[10px]
                pb-[8px]
                pt-[9px]
            "
        >
            <p className="text-[11px] font-semibold text-[#F5F7FA]">
                Resumo do período
            </p>

            {current.rows.map((row, index) => (
                <div key={row.label}>
                    {index === 2 && (
                        <div className="mb-[6px] h-px w-[130px] bg-[#28313B]" />
                    )}

                    <div className="flex h-[18px] w-[130px] items-center justify-between">
                        <div className="flex items-center gap-[5px]">
                            <span
                                className="h-[5px] w-[5px] rounded-full"
                                style={{
                                    backgroundColor: row.dot,
                                }}
                            />

                            <span className="text-[8.5px] text-[#9CA6B2]">
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

                <span className="text-[7.5px] text-[#7A8190]">
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
                label: "Visualização em barras",
                icon: "/moneypilot/dashboard-flow-button-bars.svg",
            },
            {
                id: "donut",
                label: "Visualização de distribuição",
                icon: "/moneypilot/dashboard-flow-button-pie.svg",
            },
            {
                id: "trend",
                label: "Visualização de tendência",
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
                                borderColor: active
                                    ? current.accent
                                    : "#28313B",
                                backgroundColor: active
                                    ? "#080B0F"
                                    : "#19212C",
                                boxShadow: active
                                    ? `0 0 6px ${current.glow}`
                                    : "none",
                            }}
                        >
                            <Image
                                src={view.icon}
                                alt=""
                                width={16}
                                height={16}
                                className="h-[16px] w-[16px]"
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
                border-[#28313B]
                bg-[rgba(8,11,15,0.20)]
                shadow-[inset_0_1px_0_rgba(255,255,255,0.025),0_10px_24px_rgba(0,0,0,0.08)]
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
                            bg-[#080B0F]
                        "
                        style={{
                            borderColor: current.accent,
                            boxShadow: `0 0 6px ${current.glow}`,
                        }}
                    >
                        <Image
                            src={currentViewIcon}
                            alt=""
                            width={16}
                            height={16}
                            className="h-[16px] w-[16px]"
                            aria-hidden="true"
                        />
                    </div>

                    <h2 className="text-[21px] font-bold leading-none text-[#F5F7FA]">
                        Seu fluxo financeiro
                    </h2>
                </div>

                {/* SALDO / RECEITAS / DESPESAS */}
                <div className="flex items-center gap-[5px]">
                    {[
                        {
                            id: "balance" as FinancialTab,
                            label: "Saldo",
                        },
                        {
                            id: "income" as FinancialTab,
                            label: "Receitas",
                        },
                        {
                            id: "expense" as FinancialTab,
                            label: "Despesas",
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
                                    h-[30px]
                                    items-center
                                    justify-center
                                    rounded-full
                                    border
                                    px-[13px]
                                    text-[11.5px]
                                    transition-all
                                    duration-200
                                    ${
                                        active
                                            ? "border-transparent font-semibold text-[#F5F7FA]"
                                            : "border-[#28313B] font-medium text-[#9CA6B2]"
                                    }
                                `}
                                style={
                                    active
                                        ? {
                                              backgroundColor:
                                                  tabColor,
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

                        <div className="flex w-full justify-between text-center text-[7px] font-semibold text-[#9CA6B2]">
                            {dates.map((date) => (
                                <span
                                    key={date}
                                    className="w-[40px]"
                                >
                                    {date}
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

                            <div className="absolute h-[72px] w-[72px] rounded-full bg-[#14191F]" />

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
                                    distribuição atual
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex h-[142px] w-[287px] shrink-0 flex-col pt-[3px]">
                        <div className="grid h-[14px] grid-cols-[1fr_70px_40px] text-[7px] text-[#8E96A5]">
                            <span className="pl-[13px]">
                                {financialTab === "balance"
                                    ? "Conta"
                                    : financialTab === "income"
                                      ? "Fonte"
                                      : "Categoria"}
                            </span>

                            <span>Valor</span>
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
                                    {date}
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
                            15–21 Ago
                        </span>
                    </div>

                    {renderViewMenu()}
                </div>
            )}
        </article>
    );
}
