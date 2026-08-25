"use client";

import { Cell, Pie, PieChart, Tooltip } from "recharts";

export const portfolioAllocation = [
  { name: "Ações", percentage: 62, value: "€7.961,11", color: "#3B82F6" },
  { name: "Cripto", percentage: 28, value: "€3.595,34", color: "#8B5CF6" },
  { name: "Caixa", percentage: 10, value: "€1.284,05", color: "#14B8A6" },
];

type TooltipEntry = { payload?: (typeof portfolioAllocation)[number] };

function AllocationTooltip({ active, payload }: { active?: boolean; payload?: TooltipEntry[] }) {
  const item = payload?.[0]?.payload;
  if (!active || !item) return null;
  return <div className="rounded-[8px] border border-[#28313B] bg-[#10151B] px-[9px] py-[7px] text-[8px]"><strong>{item.name}</strong><div className="mt-[3px] flex gap-[7px]"><span style={{ color: item.color }}>{item.percentage}%</span><span className="text-[#9CA6B2]">{item.value}</span></div></div>;
}

export function PortfolioAllocationChart() {
  return <div className="flex h-[145px] items-center"><div className="relative size-[126px] shrink-0"><PieChart width={126} height={126}><Tooltip cursor={false} content={<AllocationTooltip />} /><Pie data={portfolioAllocation} dataKey="percentage" nameKey="name" cx="50%" cy="50%" innerRadius={39} outerRadius={63} startAngle={90} endAngle={-270} stroke="none" isAnimationActive animationDuration={400}>{portfolioAllocation.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie></PieChart><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><strong className="text-[11px]">€12.840</strong><span className="text-[8px] text-[#9CA6B2]">Total</span></div></div><div className="ml-[25px] flex w-[218px] flex-col gap-[13px]">{portfolioAllocation.map((item) => <div key={item.name} className="flex items-center text-[8.5px]"><i className="mr-[7px] size-[6px] rounded-full" style={{ backgroundColor: item.color }} /><span>{item.name}</span><span className="ml-auto text-right"><b className="block">{item.percentage}%</b><small className="text-[7px] text-[#9CA6B2]">{item.value}</small></span></div>)}</div></div>;
}
