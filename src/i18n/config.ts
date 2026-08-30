import type { Language } from "@/components/LanguageProvider";

export const supportedLanguages = [
  { code: "en", label: "English" }, { code: "pt", label: "Português" }, { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" }, { code: "fr", label: "Français" }, { code: "nl", label: "Nederlands" }, { code: "it", label: "Italiano" },
] as const satisfies readonly { code: Language; label: string }[];

export type CurrencyCode = "EUR" | "GBP" | "USD" | "BRL";
export const supportedCurrencies = [
  { code: "EUR", symbol: "€", names: { en: "Euro", pt: "Euro", es: "Euro", de: "Euro", fr: "Euro", nl: "Euro", it: "Euro" } },
  { code: "GBP", symbol: "£", names: { en: "British Pound", pt: "Libra esterlina", es: "Libra esterlina", de: "Britisches Pfund", fr: "Livre sterling", nl: "Brits pond", it: "Sterlina britannica" } },
  { code: "USD", symbol: "$", names: { en: "US Dollar", pt: "Dólar americano", es: "Dólar estadounidense", de: "US-Dollar", fr: "Dollar américain", nl: "Amerikaanse dollar", it: "Dollaro statunitense" } },
  { code: "BRL", symbol: "R$", names: { en: "Brazilian Real", pt: "Real brasileiro", es: "Real brasileño", de: "Brasilianischer Real", fr: "Réal brésilien", nl: "Braziliaanse real", it: "Real brasiliano" } },
] as const satisfies readonly { code: CurrencyCode; symbol: string; names: Record<Language, string> }[];

export function isCurrencyCode(value: string): value is CurrencyCode { return supportedCurrencies.some((currency) => currency.code === value); }
export function currencyLabel(code: CurrencyCode, language: Language) { const currency = supportedCurrencies.find((item) => item.code === code)!; return `${currency.names[language]} · ${currency.code} · ${currency.symbol}`; }

export const languageLocales = {
  en: "en-GB",
  pt: "pt-PT",
  es: "es-ES",
  de: "de-DE",
  fr: "fr-FR",
  nl: "nl-NL",
  it: "it-IT",
} as const satisfies Record<Language, string>;

export function formatMoney(
  value: number,
  options: { currency: CurrencyCode; language: Language },
) {
  return new Intl.NumberFormat(languageLocales[options.language], {
    style: "currency",
    currency: options.currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
