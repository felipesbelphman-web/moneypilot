"use client";

import { useCurrency } from "@/components/CurrencyProvider";

import { Cell, Pie, PieChart, Tooltip } from "recharts";
import type { DashboardCategorySpending } from "@/components/dashboard/dashboard-financial-summary";
import type { Language } from "@/components/LanguageProvider";
import { translations } from "@/i18n/translations";

const colors = ["#348DFC", "#15E3FF", "#9B5CFF", "#00E7B9", "#FFC700", "#FD4873"];
type ChartItem = DashboardCategorySpending & { color: string };
type TooltipEntry = { payload?: ChartItem };

function ChartTooltip({ active, payload, language }: { active?: boolean; payload?: TooltipEntry[]; language: Language }) {
  const { formatMoney: money } = useCurrency();
  const t = translations[language].appDashboard;
  const item = payload?.[0]?.payload;
  if (!active || !item) return null;
  return <div className="rounded-[8px] border border-[#28313B] bg-[var(--insights-tooltip)] px-[9px] py-[7px] shadow-[0_8px_24px_rgba(0,0,0,0.35)]"><p className="text-[9px] font-semibold">{item.localizationKey ? t[item.localizationKey] : item.category}</p><div className="mt-[3px] flex gap-[7px] text-[8px]"><span className="text-[var(--text-primary)]">{(item.percentage * 100).toLocaleString(language, { maximumFractionDigits: 1 })}%</span><span className="text-[var(--text-secondary)]">{money(item.amount)}</span></div></div>;
}

export function InsightsSpendingChart({ categories, total, available, language, emptyTitle, emptyCopy, totalLabel }: { categories: DashboardCategorySpending[]; total: number | null; available: boolean; language: Language; emptyTitle: string; emptyCopy: string; totalLabel: string }) {
  const { formatMoney: money } = useCurrency();
  const t = translations[language].appDashboard;
  if (!available || total === null || categories.length === 0 || total <= 0) return <div className="mt-[4px] flex h-[132px] flex-col items-center justify-center text-center"><strong className="text-[10px]">{emptyTitle}</strong><p className="mt-[5px] max-w-[260px] text-[8.5px] leading-[12px] text-[var(--text-secondary)]">{emptyCopy}</p></div>;
  const items = categories.slice(0, 6).map((item, index) => ({ ...item, color: colors[index] }));
  return <div className="insights-spending-chart"><div className="relative size-[132px] shrink-0"><PieChart width={132} height={132}><Tooltip cursor={false} content={<ChartTooltip language={language} />} /><Pie data={items} dataKey="percentage" nameKey="category" cx="50%" cy="50%" innerRadius={40} outerRadius={58} startAngle={90} endAngle={-270} stroke="none" isAnimationActive animationDuration={550}>{items.map((item, index) => <Cell key={`${item.category}-${index}`} fill={item.color} />)}</Pie></PieChart><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><strong className="text-[11px] font-semibold leading-none">{money(total)}</strong><span className="mt-[3px] text-[10px] text-[var(--text-secondary)]">{totalLabel}</span></div></div><div className="flex min-w-0 flex-1 flex-col">{items.map((item, index) => <div key={`${item.category}-${index}`} className="flex h-[18px] items-center text-[8.2px]"><i className="mr-[6px] size-[5px] rounded-full" style={{ backgroundColor: item.color }} /><span className="truncate text-[var(--text-secondary)]">{item.localizationKey ? t[item.localizationKey] : item.category}</span><span className="ml-auto shrink-0 text-[var(--text-secondary)]">{(item.percentage * 100).toLocaleString(language, { maximumFractionDigits: 1 })}% · {money(item.amount)}</span></div>)}</div></div>;
}
