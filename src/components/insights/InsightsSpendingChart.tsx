"use client";

import { useCurrency } from "@/components/CurrencyProvider";

import { Cell, Pie, PieChart, Tooltip } from "recharts";
import type { DashboardCategorySpending } from "@/components/dashboard/dashboard-financial-summary";
import type { Language } from "@/components/LanguageProvider";

const colors = ["#3B82F6", "#38BDF8", "#8B5CF6", "#22C55E", "#F59E0B", "#14B8A6"];
type ChartItem = DashboardCategorySpending & { color: string };
type TooltipEntry = { payload?: ChartItem };

function ChartTooltip({ active, payload, language }: { active?: boolean; payload?: TooltipEntry[]; language: Language }) {
  const { formatMoney: money } = useCurrency();
  const item = payload?.[0]?.payload;
  if (!active || !item) return null;
  return <div className="rounded-[8px] border border-[#28313B] bg-[#10151B] px-[9px] py-[7px] shadow-[0_8px_24px_rgba(0,0,0,0.35)]"><p className="text-[9px] font-semibold">{item.category}</p><div className="mt-[3px] flex gap-[7px] text-[8px]"><span style={{ color: item.color }}>{(item.percentage * 100).toLocaleString(language, { maximumFractionDigits: 1 })}%</span><span className="text-[#9CA6B2]">{money(item.amount)}</span></div></div>;
}

export function InsightsSpendingChart({ categories, total, language, emptyTitle, emptyCopy, totalLabel }: { categories: DashboardCategorySpending[]; total: number; language: Language; emptyTitle: string; emptyCopy: string; totalLabel: string }) {
  const { formatMoney: money } = useCurrency();
  if (categories.length === 0 || total <= 0) return <div className="mt-[4px] flex h-[132px] flex-col items-center justify-center text-center"><strong className="text-[10px]">{emptyTitle}</strong><p className="mt-[5px] max-w-[260px] text-[8.5px] leading-[12px] text-[#9CA6B2]">{emptyCopy}</p></div>;
  const items = categories.slice(0, 6).map((item, index) => ({ ...item, color: colors[index] }));
  return <div className="mt-[4px] flex h-[132px] items-center gap-[12px]"><div className="relative size-[108px] shrink-0"><PieChart width={108} height={108}><Tooltip cursor={false} content={<ChartTooltip language={language} />} /><Pie data={items} dataKey="percentage" nameKey="category" cx="50%" cy="50%" innerRadius={31} outerRadius={46} startAngle={90} endAngle={-270} stroke="none" isAnimationActive animationDuration={550}>{items.map((item) => <Cell key={item.category} fill={item.color} />)}</Pie></PieChart><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><strong className="text-[9.5px] font-semibold leading-none">{money(total)}</strong><span className="mt-[2px] text-[7px] text-[#9CA6B2]">{totalLabel}</span></div></div><div className="flex min-w-0 flex-1 flex-col">{items.map((item) => <div key={item.category} className="flex h-[18px] items-center text-[8.2px]"><i className="mr-[6px] size-[5px] rounded-full" style={{ backgroundColor: item.color }} /><span className="truncate text-[#9CA6B2]">{item.category}</span><span className="ml-auto shrink-0 text-[#9CA6B2]">{(item.percentage * 100).toLocaleString(language, { maximumFractionDigits: 1 })}% · {money(item.amount)}</span></div>)}</div></div>;
}
