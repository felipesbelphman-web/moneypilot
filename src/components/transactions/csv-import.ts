import type { TransactionType } from "./transaction-model";

export type ImportedTransactionDraft = {
  id: string;
  rawDate: string;
  rawDescription: string;
  rawAmount: string;
  rawType: string;
  rawCategory: string;
  dateISO: string | null;
  description: string;
  category: string;
  type: TransactionType | null;
  amount: number | null;
  errors: string[];
};

const aliases = {
  date: ["date", "data", "transaction date", "transaction_date"],
  description: ["description", "descricao", "merchant", "details"],
  amount: ["amount", "valor", "value"],
  type: ["type", "tipo", "transaction type"],
  category: ["category", "categoria"],
};

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function detectDelimiter(text: string) {
  const firstRecord = text.split(/\r?\n/).find((line) => line.trim()) ?? "";
  let quoted = false;
  let commas = 0;
  let semicolons = 0;
  for (const character of firstRecord) {
    if (character === '"') quoted = !quoted;
    if (!quoted && character === ",") commas += 1;
    if (!quoted && character === ";") semicolons += 1;
  }
  return semicolons > commas ? ";" : ",";
}

function parseRows(text: string, delimiter: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === delimiter && !quoted) {
      row.push(field.trim());
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

export function parseImportedDate(value: string) {
  const match = value.trim().match(/^(?:(\d{4})-(\d{2})-(\d{2})|(\d{2})[/-](\d{2})[/-](\d{4}))$/);
  if (!match) return null;
  const year = Number(match[1] ?? match[6]);
  const month = Number(match[2] ?? match[5]);
  const day = Number(match[3] ?? match[4]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseImportedAmount(value: string) {
  let compact = value.trim().replace(/(?:R\$|€|£|\$|EUR|GBP|USD|BRL|\s|\u00a0)/gi, "");
  const parentheses = compact.startsWith("(") && compact.endsWith(")");
  if (parentheses) compact = compact.slice(1, -1);
  const negative = parentheses || compact.startsWith("-");
  compact = compact.replace(/^[+-]/, "");
  if (!compact) return null;
  const comma = compact.lastIndexOf(",");
  const dot = compact.lastIndexOf(".");
  const decimal = comma > dot ? "," : ".";
  const thousands = decimal === "," ? "." : ",";
  const normalized = compact.includes(decimal) ? compact.replaceAll(thousands, "").replace(decimal, ".") : compact;
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const amount = Number(normalized);
  return Number.isFinite(amount) ? (negative ? -amount : amount) : null;
}

export function parseImportedType(value: string) {
  const normalized = normalizeHeader(value);
  if (["income", "revenue", "credit", "receita", "entrada"].includes(normalized)) return "income" as const;
  if (["expense", "debit", "despesa", "saida"].includes(normalized)) return "expense" as const;
  return null;
}

export function validateImportedDraft(draft: Pick<ImportedTransactionDraft, "dateISO" | "description" | "type" | "amount">) {
  const errors: string[] = [];
  if (!draft.dateISO || parseImportedDate(draft.dateISO) !== draft.dateISO) errors.push("Data inválida");
  if (!draft.description.trim()) errors.push("Descrição ausente");
  if (draft.amount === null || !Number.isFinite(draft.amount) || draft.amount <= 0) errors.push("Valor inválido");
  if (draft.type !== "income" && draft.type !== "expense") errors.push("Tipo não reconhecido");
  return errors;
}

export function parseTransactionCsv(text: string): ImportedTransactionDraft[] {
  const rows = parseRows(text.replace(/^\uFEFF/, ""), detectDelimiter(text));
  if (rows.length < 2) throw new Error("O CSV precisa conter cabeçalho e pelo menos uma transação.");
  const headers = rows[0].map(normalizeHeader);
  const column = (key: keyof typeof aliases) => headers.findIndex((header) => aliases[key].includes(header));
  const dateColumn = column("date");
  const descriptionColumn = column("description");
  const amountColumn = column("amount");
  const typeColumn = column("type");
  const categoryColumn = column("category");
  if (dateColumn < 0 || descriptionColumn < 0 || amountColumn < 0) throw new Error("Não foi possível localizar as colunas de data, descrição e valor.");

  return rows.slice(1).map((row) => {
    const rawDate = row[dateColumn] ?? "";
    const rawDescription = row[descriptionColumn] ?? "";
    const rawAmount = row[amountColumn] ?? "";
    const rawType = typeColumn >= 0 ? row[typeColumn] ?? "" : "";
    const rawCategory = categoryColumn >= 0 ? row[categoryColumn] ?? "" : "";
    const dateISO = parseImportedDate(rawDate);
    const signedAmount = parseImportedAmount(rawAmount);
    const explicitType = rawType ? parseImportedType(rawType) : null;
    const type = rawType ? explicitType : (signedAmount === null || signedAmount === 0 ? null : signedAmount < 0 ? "expense" : "income");
    const errors: string[] = [];
    if (!dateISO) errors.push("Data inválida");
    if (!rawDescription.trim()) errors.push("Descrição ausente");
    if (signedAmount === null || signedAmount === 0) errors.push("Valor inválido");
    if (rawType && !explicitType) errors.push("Tipo não reconhecido");
    return {
      id: crypto.randomUUID(), rawDate, rawDescription, rawAmount, rawType, rawCategory,
      dateISO, description: rawDescription.trim(), category: rawCategory.trim() || "Sem categoria",
      type, amount: signedAmount === null ? null : Math.abs(signedAmount), errors,
    };
  });
}
