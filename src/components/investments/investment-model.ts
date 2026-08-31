export type InvestmentAssetType = "stock" | "etf" | "crypto" | "other";

export type InvestmentPriceMode = "automatic" | "manual";

export type Investment = {
  id: string;
  name: string;
  symbol: string | null;
  assetType: InvestmentAssetType;
  quantity: number;
  averagePurchasePrice: number;
  priceMode: InvestmentPriceMode;
  manualCurrentPrice: number | null;
  marketAssetKey: string | null;
  nativeCurrency: string;
};
