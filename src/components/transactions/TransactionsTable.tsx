import Image from "next/image";

export type Transaction = {
  description: string;
  category: string;
  categoryColor: string;
  payment: string;
  date: string;
  origin: "Extrato" | "Manual";
  value: string;
};

type TransactionsTableProps = {
  transactions: Transaction[];
  page: number;
  onPageChange: (page: number) => void;
};

const columns = "grid-cols-[283px_159px_155px_117px_94px_91px_74px_30px]";
const iconRoot = "/moneypilot/transactions/icons";

export function TransactionsTable({ transactions, page, onPageChange }: TransactionsTableProps) {
  return (
    <section className="absolute left-0 top-[300px] h-[359px] w-[1090px] rounded-[18px] border border-[#28313B] bg-[rgba(8,11,15,0.22)] px-[16px] py-[10px] shadow-[0_8px_18px_rgba(0,0,0,0.24)] backdrop-blur-[7px]">
      <div className="flex h-[18px] items-start justify-between">
        <h2 className="text-[15px] font-semibold leading-none">Transações de Agosto</h2>
        <span className="w-[188px] text-right text-[9px] text-[#64707D]">45 transações encontradas</span>
      </div>
      <div className={`mt-[12px] grid h-[22px] w-[1056px] ${columns} items-center rounded-[8px] bg-[rgba(25,33,44,0.62)] px-[8px] text-[8.5px] font-semibold text-[#7F8996]`}>
        <span>Descrição / Estabelecimento</span><span>Categoria</span><span>Pagamento</span><span>Data</span><span>Origem</span><span>Valor</span><span className="text-center">Ações</span><span className="text-center">Excluir</span>
      </div>
      <div className="h-[251px] w-[1056px] overflow-hidden">
        {transactions.map((item, index) => <TransactionRow key={`${item.description}-${item.date}-${item.value}-${index}`} item={item} last={index === transactions.length - 1} />)}
        {transactions.length === 0 && <div className="flex h-full items-center justify-center text-[11px] text-[#64707D]">Nenhuma transação encontrada.</div>}
      </div>
      <div className="mt-[2px] flex h-[24px] w-[1044px] items-center justify-between">
        <span className="text-[8.5px] text-[#64707D]">Mostrando 1–7 de 45 transações</span>
        <div className="flex gap-[6px]">
          {[1, 2, 3, 4].map((number) => <button key={number} type="button" onClick={() => onPageChange(number)} className={`size-[24px] rounded-[7px] text-[8.5px] font-semibold ${page === number ? "bg-[#3B82F6] text-white" : "border border-[#28313B] bg-[#080B0F]/30 text-[#9CA6B2]"}`}>{number}</button>)}
        </div>
      </div>
    </section>
  );
}

function TransactionRow({ item, last }: { item: Transaction; last: boolean }) {
  return (
    <div className={`grid ${last ? "h-[35px]" : "h-[36px] border-b border-[rgba(40,49,59,0.72)]"} ${columns} items-center px-[8px] text-[9px]`}>
      <strong className="text-[9.5px] font-semibold">{item.description}</strong>
      <span className="flex items-center gap-[7px] text-[#9CA6B2]"><i className="size-[5px] rounded-full" style={{ background: item.categoryColor }} />{item.category}</span>
      <span className="flex items-center gap-[6px] text-[#B7BEC8]"><Image src={`${iconRoot}/card-outline.svg`} alt="" width={14} height={14} className="size-[14px]" />{item.payment}</span>
      <span className="text-[#9CA6B2]">{item.date}</span>
      <span className="font-semibold text-[#60A5FA]">{item.origin}</span>
      <strong className="text-[9.5px] font-semibold">{item.value}</strong>
      <button type="button" aria-label={`Ações de ${item.description}`} className="flex w-[60px] items-center justify-center justify-self-center"><Image src={`${iconRoot}/ellipsis-horizontal-outline.svg`} alt="" width={16} height={16} className="size-[16px]" /></button>
      <button type="button" aria-label={`Excluir ${item.description}`} className="flex items-center justify-center"><Image src={`${iconRoot}/trash-outline.svg`} alt="" width={16} height={16} className="size-[16px]" /></button>
    </div>
  );
}
