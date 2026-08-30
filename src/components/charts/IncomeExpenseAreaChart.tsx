"use client";

import { useCurrency } from "@/components/CurrencyProvider";

import {
    Area,
    AreaChart,
    ResponsiveContainer,
    Tooltip,
    YAxis,
} from "recharts";

type ChartVariant = "income" | "expense";

type IncomeExpenseAreaChartProps = {
    variant: ChartVariant;
};

const incomeData = [
    { value: 510 },
    { value: 535 },
    { value: 560 },
    { value: 620 },
    { value: 690 },
    { value: 640 },
    { value: 760 },
    { value: 730 },
    { value: 850 },
    { value: 890 },
    { value: 1010 },
    { value: 1120 },
    { value: 1080 },
    { value: 1210 },
];

const expenseData = [
    { value: 390 },
    { value: 420 },
    { value: 450 },
    { value: 430 },
    { value: 500 },
    { value: 470 },
    { value: 570 },
    { value: 530 },
    { value: 650 },
    { value: 590 },
    { value: 710 },
    { value: 640 },
    { value: 760 },
    { value: 850 },
];

export function IncomeExpenseAreaChart({
    variant,
}: IncomeExpenseAreaChartProps) {
    const { formatMoney: money } = useCurrency();
    const isIncome = variant === "income";

    const data = isIncome ? incomeData : expenseData;

    const accent = isIncome ? "#22C55E" : "#F43F5E";

    const gradientId = isIncome
        ? "incomeAreaGradient"
        : "expenseAreaGradient";

    return (
        <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{
                        top: 4,
                        right: 1,
                        bottom: 0,
                        left: 1,
                    }}
                >
                    <defs>
                        <linearGradient
                            id={gradientId}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop
                                offset="0%"
                                stopColor={accent}
                                stopOpacity={0.38}
                            />

                            <stop
                                offset="55%"
                                stopColor={accent}
                                stopOpacity={0.14}
                            />

                            <stop
                                offset="100%"
                                stopColor={accent}
                                stopOpacity={0}
                            />
                        </linearGradient>
                    </defs>

                    <YAxis
                        hide
                        domain={["dataMin - 100", "dataMax + 100"]}
                    />

                    <Tooltip
                        cursor={false}
                        content={({ active, payload }) => {
                            if (!active || !payload?.length) {
                                return null;
                            }

                            const value = Number(
                                payload[0]?.value ?? 0,
                            );

                            return (
                                <div
                                    className="
                                        rounded-[7px]
                                        border
                                        border-[#28313B]
                                        bg-[#10151B]
                                        px-[8px]
                                        py-[5px]
                                        shadow-[0_6px_18px_rgba(0,0,0,0.35)]
                                    "
                                >
                                    <span
                                        className="text-[8px] font-semibold"
                                        style={{
                                            color: accent,
                                        }}
                                    >
                                        {money(value)}
                                    </span>
                                </div>
                            );
                        }}
                    />

                    <Area
                        type="natural"
                        dataKey="value"
                        stroke={accent}
                        strokeWidth={2}
                        fill={`url(#${gradientId})`}
                        fillOpacity={1}
                        dot={false}
                        activeDot={{
                            r: 3,
                            fill: "#F5F7FA",
                            stroke: accent,
                            strokeWidth: 2,
                        }}
                        isAnimationActive
                        animationDuration={700}
                        animationEasing="ease-out"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
