"use client";

import { useCurrency } from "@/components/CurrencyProvider";

import { Cell, Pie, PieChart, Tooltip } from "recharts";
import type { DashboardCategorySpending } from "@/components/dashboard/dashboard-financial-summary";
import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/i18n/translations";

const categoryPalette = ["#3B82F6", "#38BDF8", "#8B5CF6", "#22C55E"];
export type DisplayCategorySpending = DashboardCategorySpending & { color: string };

export function getDisplayCategorySpending(data: DashboardCategorySpending[], maxItems = 4): DisplayCategorySpending[] {
  const visible = data.length <= maxItems ? data : [...data.slice(0, maxItems - 1), data.slice(maxItems - 1).reduce((other, item) => ({ category: "Other", amount: other.amount + item.amount, percentage: other.percentage + item.percentage }), { category: "Other", amount: 0, percentage: 0 })];
  return visible.map((item, index) => ({ ...item, color: categoryPalette[index % categoryPalette.length] }));
}

type TooltipEntry = { payload?: DisplayCategorySpending };

function SpendingTooltip({ active, payload, showValues }: { active?: boolean; payload?: TooltipEntry[]; showValues: boolean }) {
  const { formatMoney: money } = useCurrency();
  const item = payload?.[0]?.payload;
  if (!active || !item) return null;
  return <div className="rounded-[8px] border border-[#28313B] bg-[#10151B] px-[9px] py-[7px] shadow-[0_8px_24px_rgba(0,0,0,0.35)]"><p className="text-[9px] font-semibold text-[#F5F7FA]">{item.category}</p><div className="mt-[3px] flex items-center gap-[7px] text-[8px]"><span style={{ color: item.color }}>{(item.percentage * 100).toFixed(1)}%</span><span className="text-[#9CA6B2]">{showValues ? money(item.amount) : "••••••"}</span></div></div>;
}

export function SpendingRadialChart({ data, total, showValues }: { data: DisplayCategorySpending[]; total: number; showValues: boolean }) {
  const { language } = useLanguage();
  const { formatMoney: money } = useCurrency();
  const t = translations[language].appDashboard;
  return <div className="relative size-[125px] shrink-0">{data.length > 0 && <PieChart width={125} height={125}><Tooltip cursor={false} content={<SpendingTooltip showValues={showValues} />} /><Pie data={data} dataKey="percentage" nameKey="category" cx="50%" cy="50%" innerRadius={37} outerRadius={55} startAngle={90} endAngle={-270} stroke="none" isAnimationActive animationDuration={550}>{data.map((item) => <Cell key={item.category} fill={item.color} />)}</Pie></PieChart>}<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"><strong className="max-w-[82px] text-[11.8px] font-semibold leading-none text-[#9CA6B2]">{data.length === 0 ? "—" : showValues ? money(total) : "••••••"}</strong><span className="mt-[3px] text-[8.1px] leading-none text-[#9CA6B2]">{data.length === 0 ? "No spending data" : t.total}</span></div></div>;
}
