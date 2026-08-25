"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type InvestmentRange = "7D" | "1M" | "3M" | "1A";

const portfolioHistory: Record<InvestmentRange, { label: string; value: number }[]> = {
  "7D": [{ label: "7 Ago", value: 12420 }, { label: "8 Ago", value: 12510 }, { label: "9 Ago", value: 12480 }, { label: "10 Ago", value: 12630 }, { label: "11 Ago", value: 12710 }, { label: "12 Ago", value: 12765 }, { label: "Hoje", value: 12840.5 }],
  "1M": [{ label: "18 Jul", value: 12220.1 }, { label: "23 Jul", value: 12305 }, { label: "28 Jul", value: 12270 }, { label: "2 Ago", value: 12460 }, { label: "7 Ago", value: 12530 }, { label: "12 Ago", value: 12720 }, { label: "Hoje", value: 12840.5 }],
  "3M": [{ label: "18 Mai", value: 11390 }, { label: "1 Jun", value: 11620 }, { label: "18 Jun", value: 11530 }, { label: "1 Jul", value: 12010 }, { label: "18 Jul", value: 12220 }, { label: "1 Ago", value: 12510 }, { label: "Hoje", value: 12840.5 }],
  "1A": [{ label: "Ago 25", value: 9780 }, { label: "Out", value: 10140 }, { label: "Dez", value: 10820 }, { label: "Fev", value: 11040 }, { label: "Abr", value: 11790 }, { label: "Jun", value: 11620 }, { label: "Hoje", value: 12840.5 }],
};

export function InvestmentPerformanceChart({ range }: { range: InvestmentRange }) {
  return <div className="h-[104px] w-[653px]" aria-label={`Evolução da carteira em ${range}`}><ResponsiveContainer width="100%" height="100%"><LineChart data={portfolioHistory[range]} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}><CartesianGrid vertical={false} stroke="#28313B" strokeOpacity={0.65} /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#64707D", fontSize: 7 }} interval={0} /><YAxis hide domain={["dataMin - 120", "dataMax + 120"]} /><Tooltip contentStyle={{ background: "#10151B", border: "1px solid #28313B", borderRadius: 8, fontSize: 8 }} labelStyle={{ color: "#9CA6B2" }} formatter={(value) => [`€${Number(value).toLocaleString("pt-PT", { minimumFractionDigits: 2 })}`, "Carteira"]} /><Line type="linear" dataKey="value" stroke="#60A5FA" strokeWidth={2} dot={false} activeDot={{ r: 3, fill: "#60A5FA", stroke: "#60A5FA" }} isAnimationActive animationDuration={350} /></LineChart></ResponsiveContainer></div>;
}
