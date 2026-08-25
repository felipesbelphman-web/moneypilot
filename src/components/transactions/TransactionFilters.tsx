import Image from "next/image";

const filters = [
  { label: "Agosto 2026", width: 198 },
  { label: "Todas as categorias", width: 198 },
  { label: "Todos os pagamentos", width: 202 },
  { label: "Todas as origens", width: 198 },
  { label: "Mais recentes", width: 266 },
];

export function TransactionFilters() {
  return (
    <div className="absolute left-0 top-[250px] flex h-[38px] w-[1090px] gap-[7px]">
      {filters.map((filter) => (
        <button key={filter.label} type="button" style={{ width: filter.width }} className="flex h-[38px] shrink-0 items-center justify-between rounded-[12px] border border-[#28313B] bg-[#080B0F]/35 px-[14px] text-[9.5px] font-medium text-[#9CA6B2]">
          <span>{filter.label}</span>
          <Image src="/moneypilot/transactions/icons/chevron-down-outline.svg" alt="" width={15} height={15} className="size-[15px]" />
        </button>
      ))}
    </div>
  );
}
