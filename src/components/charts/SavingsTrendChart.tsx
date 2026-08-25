"use client";

import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

const savingsData = [
    { x: 0.00, value: 430 },
    { x: 0.12, value: 470 },
    { x: 0.24, value: 455 },
    { x: 0.40, value: 500 },
    { x: 0.58, value: 525 },

    { x: 0.82, value: 610 },
    { x: 1.00, value: 680 },
    { x: 1.18, value: 655 },
    { x: 1.36, value: 715 },
    { x: 1.58, value: 690 },

    { x: 1.82, value: 720 },
    { x: 2.00, value: 665 },
    { x: 2.18, value: 610 },
    { x: 2.36, value: 430 },
    { x: 2.55, value: 425 },

    { x: 2.72, value: 760 },
    { x: 2.90, value: 745 },
    { x: 3.08, value: 800 },
    { x: 3.28, value: 770 },
    { x: 3.48, value: 850 },

    { x: 3.70, value: 875 },
    { x: 3.92, value: 720 },
    { x: 4.12, value: 650 },
    { x: 4.34, value: 735 },
    { x: 4.55, value: 715 },

    { x: 4.78, value: 685 },
    { x: 5.00, value: 660 },
    { x: 5.22, value: 635 },
    { x: 5.46, value: 675 },
    { x: 5.68, value: 720 },

    { x: 5.90, value: 755 },
    { x: 6.00, value: 682 },
];

const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
type SavingsXAxisTickProps = {
    x?: number;
    y?: number;
    payload?: {
        value: number;
    };
};

function SavingsXAxisTick({
    x = 0,
    y = 0,
    payload,
}: SavingsXAxisTickProps) {
    const index = payload?.value ?? 0;

    const textAnchor =
        index === 0
            ? "start"
            : index === 6
              ? "end"
              : "middle";

    return (
        <text
            x={index === 0 ? 2 : x}
            y={y + 10}
            fill="#8D96A3"
            fontSize={7}
            textAnchor={textAnchor}
        >
            {days[index] ?? ""}
        </text>
    );
}

export function SavingsTrendChart() {
    return (
        <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={savingsData}
                    margin={{
                    top: 4,
                    right: 0,
                    bottom: 0,
                    left: 0,
                }}
                                >
                    <defs>
                        <linearGradient
                            id="savingsAreaGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop
                                offset="0%"
                                stopColor="#B7BEC7"
                                stopOpacity={0.42}
                            />

                            <stop
                                offset="65%"
                                stopColor="#7D8793"
                                stopOpacity={0.18}
                            />

                            <stop
                                offset="100%"
                                stopColor="#59636F"
                                stopOpacity={0.05}
                            />
                        </linearGradient>
                    </defs>

                    <CartesianGrid
                        stroke="#28313B"
                        strokeOpacity={0.55}
                        vertical
                        horizontal
                    />

                    <XAxis
                        type="number"
                        dataKey="x"
                        domain={[0, 6]}
                        ticks={[0, 1, 2, 3, 4, 5, 6]}
                        interval={0}
                        minTickGap={0}
                        axisLine={false}
                        tickLine={false}
                        tick={<SavingsXAxisTick />}
                    />

                    <YAxis
                        hide
                        domain={[350, 950]}
                    />

                    <Tooltip
                        cursor={{
                            stroke: "#6B7280",
                            strokeWidth: 1,
                            strokeDasharray: "3 3",
                        }}
                        contentStyle={{
                            background: "#10151B",
                            border: "1px solid #28313B",
                            borderRadius: "8px",
                            fontSize: "9px",
                            color: "#F5F7FA",
                        }}
                        labelStyle={{
                            display: "none",
                        }}
                        formatter={(value) => [
                            `€${Number(value).toFixed(2)}`,
                            "Economia",
                        ]}
                    />

                    <Area
                        type="linear"
                        dataKey="value"
                        stroke="#C7CDD5"
                        strokeWidth={1.5}
                        fill="url(#savingsAreaGradient)"
                        fillOpacity={1}
                        dot={false}
                        activeDot={{
                            r: 3.5,
                            fill: "#F5F7FA",
                            stroke: "#9CA6B2",
                            strokeWidth: 1.5,
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