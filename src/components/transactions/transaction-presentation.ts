import type { Language } from "@/components/LanguageProvider";
import { translations } from "@/i18n/translations";
import { transactionPaymentValues, type TransactionPayment } from "@/components/transactions/transaction-model";
import { civilDateToUtcTimestamp } from "@/lib/dates/civil-date";
import { dashboardCopyByLanguage } from "@/i18n/dashboard-copy";

const localeByLanguage: Record<Language, string> = {
  en: "en-GB", pt: "pt-PT", es: "es-ES", de: "de-DE", fr: "fr-FR", nl: "nl-NL", it: "it-IT",
};

const knownCardLabels = new Set(["Card", "Cartão", "Tarjeta", "Karte", "Carte", "Kaart", "Carta"]);
const knownNotSpecifiedLabels = new Set(["Not specified", "Não informado", "No especificado", "Nicht angegeben", "Non indiqué", "Niet opgegeven", "Non specificato"]);
const knownManualLabels = new Set(["Manual", "Manuell", "Manuel", "Handmatig", "Manuale"]);
const knownStatementLabels = new Set(["Statement", "Extrato", "Extracto", "Kontoauszug", "Relevé", "Afschrift", "Estratto conto"]);

const paymentLabels: Record<Language, Record<TransactionPayment, string>> = {
  en: { "Not specified": "Not specified", Cash: "Cash", "Debit card": "Debit card", "Credit card": "Credit card", "Bank transfer": "Bank transfer", Pix: "Pix" },
  pt: { "Not specified": "Não informado", Cash: "Dinheiro", "Debit card": "Cartão de débito", "Credit card": "Cartão de crédito", "Bank transfer": "Transferência bancária", Pix: "Pix" },
  es: { "Not specified": "No especificado", Cash: "Efectivo", "Debit card": "Tarjeta de débito", "Credit card": "Tarjeta de crédito", "Bank transfer": "Transferencia bancaria", Pix: "Pix" },
  de: { "Not specified": "Nicht angegeben", Cash: "Bargeld", "Debit card": "Debitkarte", "Credit card": "Kreditkarte", "Bank transfer": "Banküberweisung", Pix: "Pix" },
  fr: { "Not specified": "Non indiqué", Cash: "Espèces", "Debit card": "Carte de débit", "Credit card": "Carte de crédit", "Bank transfer": "Virement bancaire", Pix: "Pix" },
  nl: { "Not specified": "Niet opgegeven", Cash: "Contant", "Debit card": "Betaalpas", "Credit card": "Creditcard", "Bank transfer": "Bankoverschrijving", Pix: "Pix" },
  it: { "Not specified": "Non specificato", Cash: "Contanti", "Debit card": "Carta di debito", "Credit card": "Carta di credito", "Bank transfer": "Bonifico bancario", Pix: "Pix" },
};

export function normalizeTransactionPayment(value: string) {
  if (knownCardLabels.has(value)) return "Card";
  if (knownNotSpecifiedLabels.has(value)) return "Not specified";
  return value;
}

export function getTransactionPaymentOptions(language: Language) {
  return transactionPaymentValues.map((value) => ({ value, label: paymentLabels[language][value] }));
}

export function localizeTransactionPayment(value: string, language: Language) {
  const normalized = normalizeTransactionPayment(value);
  if (normalized === "Card") return translations[language].appTransactions.labels.card;
  if (transactionPaymentValues.includes(normalized as TransactionPayment)) return paymentLabels[language][normalized as TransactionPayment];
  return value;
}

export function localizeTransactionOrigin(value: string, language: Language) {
  if (knownManualLabels.has(value)) return translations[language].appTransactions.labels.manual;
  if (knownStatementLabels.has(value)) return translations[language].appTransactions.labels.statement;
  return value;
}

export function localizeTransactionCategory(value: string | null, language: Language) {
  // Categories have no persisted semantic identifier, so even familiar labels may be custom.
  return value ?? dashboardCopyByLanguage[language].uncategorized;
}

export function formatTransactionCivilDate(dateISO: string, language: Language, fallback: string) {
  const timestamp = civilDateToUtcTimestamp(dateISO);
  if (timestamp === null) return fallback;

  return new Intl.DateTimeFormat(localeByLanguage[language], {
    day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC",
  }).format(timestamp);
}
