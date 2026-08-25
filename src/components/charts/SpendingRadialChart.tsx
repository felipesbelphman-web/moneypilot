"use client";

import { Cell, Pie, PieChart, Tooltip } from "recharts";

export const spendingData = [
  { category: "Aluguel", percentage: 49.1, value: "€500,00", color: "#3B82F6" },
  { category: "Supermercado", percentage: 18.6, value: "€189,97", color: "#38BDF8" },
  { category: "Compras", percentage: 13.2, value: "€134,60", color: "#8B5CF6" },
  { category: "Outros", percentage: 19.1, value: "€194,20", color: "#22C55E" },
];

type TooltipEntry = { payload?: (typeof spendingData)[number] };

function SpendingTooltip({ active, payload, showValues }: { active?: boolean; payload?: TooltipEntry[]; showValues: boolean }) {
  const item = payload?.[0]?.payload;
  if (!active || !item) return null;

  return (
    <div className="rounded-[8px] border border-[#28313B] bg-[#10151B] px-[9px] py-[7px] shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
      <p className="text-[9px] font-semibold text-[#F5F7FA]">{item.category}</p>
      <div className="mt-[3px] flex items-center gap-[7px] text-[8px]">
        <span style={{ color: item.color }}>{item.percentage.toFixed(1).replace(".", ",")}%</span>
        <span className="text-[#9CA6B2]">{showValues ? item.value : "••••••"}</span>
      </div>
    </div>
  );
}

export function SpendingRadialChart({ showValues }: { showValues: boolean }) {
  return (
    <div className="relative size-[125px] shrink-0">
      <PieChart width={125} height={125}>
        <Tooltip cursor={false} content={<SpendingTooltip showValues={showValues} />} />
        <Pie data={spendingData} dataKey="percentage" nameKey="category" cx="50%" cy="50%" innerRadius={37} outerRadius={55} startAngle={90} endAngle={-270} stroke="none" isAnimationActive animationDuration={550}>
          {spendingData.map((item) => <Cell key={item.category} fill={item.color} />)}
        </Pie>
      </PieChart>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <strong className="text-[11.8px] font-semibold leading-none text-[#9CA6B2]">{showValues ? "€1.018,77" : "••••••"}</strong>
        <span className="mt-[3px] text-[8.1px] leading-none text-[#9CA6B2]">Total</span>
      </div>
    </div>
  );
}
