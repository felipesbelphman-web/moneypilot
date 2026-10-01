"use client";

import { createPortal } from "react-dom";
import { useLanguage } from "@/components/LanguageProvider";
import { investmentPresentationCopy } from "./investment-presentation";
import Image from "next/image";
import { type FormEvent, useEffect, useRef, useState } from "react";
import type { InvestmentAssetType } from "@/components/investments/investment-model";
import { useTheme } from "@/components/ThemeProvider";
import { parseInvestmentAveragePriceInput, parseInvestmentManualPriceInput, parseInvestmentQuantityInput } from "@/lib/domain/financial-input-adapters";

export type ManualInvestmentDraft = {
  name: string;
  symbol: string | null;
  assetType: InvestmentAssetType;
  quantity: number;
  averagePurchasePrice: number;
  manualCurrentPrice: number;
  nativeCurrency: string;
};

type ManualInvestmentModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (investment: ManualInvestmentDraft) => void | Promise<void>;
};

const assetTypes: Array<{ value: InvestmentAssetType; label: string }> = [
  { value: "stock", label: "Stock" },
  { value: "etf", label: "ETF" },
  { value: "crypto", label: "Crypto" },
  { value: "other", label: "Other" },
];
const iconRoot = "/moneypilot/investments/icons";

export function ManualInvestmentModal({ open, onClose, onSubmit }: ManualInvestmentModalProps) {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const ui = investmentPresentationCopy[language];
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  const [saveFailed, setSaveFailed] = useState(false);
  const isNight = theme === "dark";
  const iconTheme = isNight ? "night" : "day";
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [assetType, setAssetType] = useState<InvestmentAssetType>("stock");
  const [quantity, setQuantity] = useState("");
  const [averagePurchasePrice, setAveragePurchasePrice] = useState("");
  const [manualCurrentPrice, setManualCurrentPrice] = useState("");
  const [nativeCurrency, setNativeCurrency] = useState("EUR");
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- opening the existing modal starts a fresh draft.
    setName("");
    setSymbol("");
    setAssetType("stock");
    setQuantity("");
    setAveragePurchasePrice("");
    setManualCurrentPrice("");
    setNativeCurrency("EUR");
    setShowErrors(false);
    setSaveFailed(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const shell = document.querySelector<HTMLElement>("[data-shell-viewport]");
    const previousInert = shell?.inert ?? false;
    if (shell) shell.inert = true;
    const controls = () => Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled)') ?? []);
    dialogRef.current?.querySelector<HTMLInputElement>("input")?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); if (!savingRef.current) closeRef.current(); }
      if (event.key !== "Tab") return;
      const elements = controls(); const first = elements[0]; const last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", keyboard);
    return () => { document.removeEventListener("keydown", keyboard); if (shell) shell.inert = previousInert; previousFocus?.focus({ preventScroll: true }); };
  }, [open]);

  if (!open) return null;

  const parsedQuantity = parseInvestmentQuantityInput(quantity);
  const parsedAveragePurchasePrice = parseInvestmentAveragePriceInput(averagePurchasePrice);
  const parsedManualCurrentPrice = parseInvestmentManualPriceInput(manualCurrentPrice);
  const cleanCurrency = nativeCurrency.trim().toUpperCase();
  const nameValid = name.trim().length > 0;
  const quantityValid = parsedQuantity !== null;
  const averagePriceValid = parsedAveragePurchasePrice !== null;
  const currentPriceValid = parsedManualCurrentPrice !== null;
  const currencyValid = /^[A-Z]{3}$/.test(cleanCurrency);
  const formValid = nameValid && quantityValid && averagePriceValid && currentPriceValid && currencyValid;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowErrors(true);
    setSaveFailed(false);
    if (!formValid || parsedQuantity === null || parsedAveragePurchasePrice === null || parsedManualCurrentPrice === null || savingRef.current) return;
    savingRef.current = true;
    setIsSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        symbol: symbol.trim().length > 0 ? symbol.trim().toUpperCase() : null,
        assetType,
        quantity: parsedQuantity,
        averagePurchasePrice: parsedAveragePurchasePrice,
        manualCurrentPrice: parsedManualCurrentPrice,
        nativeCurrency: cleanCurrency,
      });
    } catch {
      // Keep the draft and the provider mutation contract on failure.
      setSaveFailed(true);
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  }

  const fieldClass = `h-[48px] w-full rounded-[12px] border bg-transparent px-[14px] text-[12px] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[#3B82F6] focus:ring-[3px] focus:ring-[#3B82F6]/20 ${isNight ? "border-[#373737] text-[#FAFAFA]" : "border-[#D4D4D4] text-[#0A0A0A]"}`;
  const labelClass = `mb-[6px] block text-[11px] font-semibold ${isNight ? "text-[#D4D4D4]" : "text-[#525252]"}`;
  const errorClass = "mt-[4px] text-[9px] font-medium text-[#F43F5E]";

  return createPortal(
    <div className="investment-modal-layer"><div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-[16px] backdrop-blur-[5px] sm:p-[24px] ${isNight ? "bg-black/68" : "bg-black/34"}`}
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="manual-investment-title"
        className={`relative flex max-h-[calc(100svh-32px)] w-full max-w-[650px] flex-col overflow-hidden rounded-[24px] border ${isNight ? "border-[#373737] bg-[#171717] shadow-[0_20px_46px_rgba(0,0,0,0.5)]" : "border-[#D4D4D4] bg-white shadow-[0_20px_46px_rgba(0,0,0,0.2)]"}`}
      >
        <header className={`flex items-center gap-[12px] border-b pb-[22px] pl-[28px] pr-[64px] pt-[24px] ${isNight ? "border-[#262626]" : "border-[#E5E5E5]"}`}>
          <div className={`flex size-[38px] shrink-0 items-center justify-center overflow-hidden rounded-[12px] border ${isNight ? "border-[#373737] bg-[#262626]" : "border-[#D4D4D4] bg-[#F5F5F5]"}`}>
            <Image src={`${iconRoot}/manual-finance-${iconTheme}.svg`} alt="" width={20} height={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-[12px]">
              <h2 id="manual-investment-title" className={`text-[22px] font-semibold leading-normal ${isNight ? "text-[#FAFAFA]" : "text-[#0A0A0A]"}`}>{ui.manualTitle}</h2>
              <span className="flex h-[24px] w-[68px] shrink-0 items-center justify-center rounded-[12px] border border-[#3B82F6]/40 bg-[#3B82F6]/10 text-[9px] font-semibold text-[#3B82F6]">{ui.manual}</span>
            </div>
            <p className={`mt-[7px] text-[11.5px] leading-normal ${isNight ? "text-[#D4D4D4]" : "text-[#525252]"}`}>{ui.manualDescription}</p>
          </div>
          <button type="button" onClick={onClose} className={`absolute right-[18px] top-[18px] flex size-[30px] items-center justify-center rounded-full border text-[18px] leading-none transition ${isNight ? "border-[#373737] text-[#D4D4D4] hover:bg-[#262626] hover:text-[#FAFAFA]" : "border-[#D4D4D4] text-[#737373] hover:bg-[#F5F5F5] hover:text-[#0A0A0A]"}`} aria-label={ui.close}>×</button>
        </header>

        <form aria-busy={isSaving} onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          {saveFailed && <p role="alert" className="px-[28px] pt-[12px] text-[12px]">{ui.saveError}</p>}
          <div className="min-h-0 overflow-y-auto px-[28px] py-[22px]">
            <div className="grid grid-cols-1 gap-x-[16px] gap-y-[16px] sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="investment-name" className={labelClass}>{ui.name}</label>
                <input id="investment-name" value={name} onChange={(event) => setName(event.target.value)} placeholder={ui.name} className={fieldClass} />
                {showErrors && !nameValid && <p role="alert" className={errorClass}>{ui.nameError}</p>}
              </div>
              <div>
                <label htmlFor="investment-symbol" className={labelClass}>{ui.symbol}</label>
                <input id="investment-symbol" value={symbol} onChange={(event) => setSymbol(event.target.value)} placeholder={ui.symbol} className={fieldClass} />
              </div>
              <div>
                <label htmlFor="investment-type" className={labelClass}>{ui.assetType}</label>
                <select id="investment-type" value={assetType} onChange={(event) => setAssetType(event.target.value as InvestmentAssetType)} className={fieldClass}>
                  {assetTypes.map((type) => <option key={type.value} value={type.value}>{ui.types[type.value]}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="investment-quantity" className={labelClass}>{ui.quantity}</label>
                <input id="investment-quantity" type="number" inputMode="decimal" min="0" step="any" value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="10" className={fieldClass} />
                {showErrors && !quantityValid && <p role="alert" className={errorClass}>{ui.quantityError}</p>}
              </div>
              <div>
                <label htmlFor="investment-currency" className={labelClass}>{ui.currency}</label>
                <input id="investment-currency" value={nativeCurrency} maxLength={3} onChange={(event) => setNativeCurrency(event.target.value.toUpperCase())} placeholder="EUR" className={fieldClass} />
                {showErrors && !currencyValid && <p role="alert" className={errorClass}>{ui.currencyError}</p>}
              </div>
              <div>
                <label htmlFor="investment-average-price" className={labelClass}>{ui.averagePrice}</label>
                <input id="investment-average-price" type="number" inputMode="decimal" min="0" step="any" value={averagePurchasePrice} onChange={(event) => setAveragePurchasePrice(event.target.value)} placeholder="150.00" className={fieldClass} />
                {showErrors && !averagePriceValid && <p role="alert" className={errorClass}>{ui.priceError}</p>}
              </div>
              <div>
                <label htmlFor="investment-current-price" className={labelClass}>{ui.currentPrice}</label>
                <input id="investment-current-price" type="number" inputMode="decimal" min="0" step="any" value={manualCurrentPrice} onChange={(event) => setManualCurrentPrice(event.target.value)} placeholder="175.00" className={fieldClass} />
                {showErrors && !currentPriceValid && <p role="alert" className={errorClass}>{ui.priceError}</p>}
              </div>
            </div>

            <div className={`mt-[16px] flex items-center gap-[12px] rounded-[12px] border px-[14px] py-[12px] ${isNight ? "border-[#3B82F6]/30 bg-[#3B82F6]/10" : "border-[#3B82F6] bg-[#3B82F6]/15"}`}>
              <div className={`flex size-[24px] shrink-0 items-center justify-center rounded-full border ${isNight ? "border-[#3B82F6]/25 bg-[#171717]" : "border-[#3B82F6]"}`}>
                <Image src={`${iconRoot}/manual-tracking-${iconTheme}.svg`} alt="" width={18} height={18} />
              </div>
              <div className="min-w-0">
                <p className={`text-[10.5px] font-semibold ${isNight ? "text-[#FAFAFA]" : "text-[#0A0A0A]"}`}>{ui.manualTracking}</p>
                <p className={`mt-[3px] text-[10px] leading-normal ${isNight ? "text-[#D4D4D4]" : "text-[#525252]"}`}>{ui.manualHelp}</p>
              </div>
            </div>
          </div>

          <footer className={`flex flex-col gap-[14px] border-t px-[28px] py-[18px] sm:flex-row sm:items-center sm:justify-between ${isNight ? "border-[#262626]" : "border-[#E5E5E5]"}`}>
            <p className={`text-[10px] ${isNight ? "text-[#A3A3A3]" : "text-[#737373]"}`}>{ui.manualTracking}</p>
            <div className="flex items-center justify-end gap-[10px]">
              <button type="button" onClick={onClose} disabled={isSaving} className={`h-[42px] w-[104px] rounded-[14px] border text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${isNight ? "border-[#373737] bg-[#171717] text-[#FAFAFA] hover:bg-[#262626]" : "border-[#D4D4D4] bg-white text-[#0A0A0A] hover:bg-[#F5F5F5]"}`}>{ui.cancel}</button>
              <button type="submit" disabled={isSaving} className="flex h-[42px] w-[165px] items-center justify-center gap-[12px] rounded-[14px] bg-[#3B82F6] text-[11px] font-semibold text-white transition hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-60">
                <span>{isSaving ? ui.saving : ui.save}</span>
                <Image src={`${iconRoot}/manual-save-${iconTheme}.svg`} alt="" width={24} height={24} />
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div></div>, document.body
  );
}
