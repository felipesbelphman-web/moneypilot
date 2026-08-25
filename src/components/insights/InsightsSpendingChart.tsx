"use client";

import { Cell, Pie, PieChart, Tooltip } from "recharts";

const categories = [
  { category: "Aluguel", percentage: 49.1, value: "€500,00", color: "#3B82F6" },
  { category: "Supermercado", percentage: 18.6, value: "€189,97", color: "#38BDF8" },
  { category: "Compras", percentage: 13.2, value: "€134,60", color: "#8B5CF6" },
  { category: "Outros", percentage: 19.1, value: "€194,20", color: "#22C55E" },
];

type TooltipEntry = { payload?: (typeof categories)[number] };

function ChartTooltip({ active, payload }: { active?: boolean; payload?: TooltipEntry[] }) {
  const item = payload?.[0]?.payload;
  if (!active || !item) return null;

  return (
    <div className="rounded-[8px] border border-[#28313B] bg-[#10151B] px-[9px] py-[7px] shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
      <p className="text-[9px] font-semibold">{item.category}</p>
      <div className="mt-[3px] flex gap-[7px] text-[8px]"><span style={{ color: item.color }}>{item.percentage.toFixed(1).replace(".", ",")}%</span><span className="text-[#9CA6B2]">{item.value}</span></div>
    </div>
  );
}

export function InsightsSpendingChart() {
  return (
    <div className="mt-[4px] flex h-[132px] items-center gap-[12px]">
      <div className="relative size-[108px] shrink-0">
        <PieChart width={108} height={108}><Tooltip cursor={false} content={<ChartTooltip />} /><Pie data={categories} dataKey="percentage" nameKey="category" cx="50%" cy="50%" innerRadius={31} outerRadius={46} startAngle={90} endAngle={-270} stroke="none" isAnimationActive animationDuration={550}>{categories.map((item) => <Cell key={item.category} fill={item.color} />)}</Pie></PieChart>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><strong className="text-[9.5px] font-semibold leading-none">€1.018,77</strong><span className="mt-[2px] text-[7px] text-[#9CA6B2]">Total</span></div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        {categories.map((item) => <div key={item.category} className="flex h-[18px] items-center text-[8.2px]"><i className="mr-[6px] size-[5px] rounded-full" style={{ backgroundColor: item.color }} /><span className="text-[#9CA6B2]">{item.category}</span><span className="ml-auto text-[#9CA6B2]">{item.percentage.toFixed(1).replace(".", ",")}% · {item.value}</span></div>)}
        <p className="mt-[6px] text-[8.3px] text-[#64707D]">Compras é o maior gasto variável deste mês.</p>
      </div>
    </div>
  );
}
