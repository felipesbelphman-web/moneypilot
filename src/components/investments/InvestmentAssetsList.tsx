import type { Investment } from "@/components/investments/investment-model";
import { calculateInvestmentValuation } from "@/lib/domain/investment-validation";

type InvestmentAssetsListProps = {
  investments: Investment[];
  emptyTitle: string;
  emptyDetail: string;
};

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 8,
  }).format(value);
}

export function InvestmentAssetsList({
  investments,
  emptyTitle,
  emptyDetail,
}: InvestmentAssetsListProps) {
  if (investments.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-[16px] text-center">
        <strong className="text-[10px]">{emptyTitle}</strong>

        <p className="mt-[5px] text-[8.5px] text-[#9CA6B2]">
          {emptyDetail}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pr-[4px]">
      <div className="flex flex-col gap-[6px]">
        {investments.map((investment) => {
          const valuation = calculateInvestmentValuation(investment);

          return (
            <div
              key={investment.id}
              className="grid min-h-[42px] grid-cols-[1.6fr_0.8fr_1fr_1fr] items-center gap-[8px] rounded-[10px] border border-[#28313B] bg-[#080B0F]/24 px-[10px] py-[6px]"
            >
              <div className="min-w-0">
                <p className="truncate text-[10px] font-semibold text-[#F5F7FA]">
                  {investment.name}
                </p>

                <p className="truncate text-[8px] uppercase text-[#64707D]">
                  {investment.symbol ?? investment.assetType}
                </p>
              </div>

              <div>
                <p className="text-[8px] text-[#64707D]">Quantity</p>

                <p className="text-[9px] font-medium text-[#F5F7FA]">
                  {formatQuantity(investment.quantity)}
                </p>
              </div>

              <div>
                <p className="text-[8px] text-[#64707D]">Invested</p>

                <p className="text-[9px] font-medium text-[#F5F7FA]">
                  {valuation.available
                    ? formatMoney(valuation.investedValue, investment.nativeCurrency)
                    : "Unavailable"}
                </p>
              </div>

              <div>
                <p className="text-[8px] text-[#64707D]">Current</p>

                <p className="text-[9px] font-medium text-[#F5F7FA]">
                  {!valuation.available || valuation.currentValue === null
                    ? "Unavailable"
                    : formatMoney(
                        valuation.currentValue,
                        investment.nativeCurrency,
                      )}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
