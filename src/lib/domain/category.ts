import { FinanceError } from "./finance-error.ts";

export type CategoryType = "income" | "expense";

export type Category = Readonly<{
  id: string;
  userId: string;
  name: string;
  type: CategoryType;
  normalizedName: string;
  iconKey: string;
  colorToken: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}>;

export type CategoryCreateInput = Readonly<{
  id?: string;
  userId: string;
  name: string;
  type: CategoryType;
  iconKey: string;
  colorToken: string;
  archivedAt?: string | null;
}>;

export type CategoryUpdateInput = Readonly<{
  name?: string;
  iconKey?: string;
  colorToken?: string;
  archivedAt?: string | null;
}>;

export type CategoryArchiveUpdate = Readonly<{ archivedAt: string | null }>;

const TOKEN_PATTERN = /^[a-z][a-z0-9_-]*$/;

export function parseCategoryType(value: unknown): CategoryType {
  if (value === "income" || value === "expense") return value;
  throw validationError("type", "allowed_value");
}

export function validateAndNormalizeCategoryCreate(input: CategoryCreateInput): CategoryCreateInput {
  return {
    ...(input.id === undefined ? {} : { id: requiredText(input.id, "id") }),
    userId: requiredText(input.userId, "userId"),
    name: categoryName(input.name),
    type: parseCategoryType(input.type),
    iconKey: categoryToken(input.iconKey, "iconKey"),
    colorToken: categoryToken(input.colorToken, "colorToken"),
    ...(input.archivedAt === undefined ? {} : { archivedAt: nullableTimestamp(input.archivedAt, "archivedAt") }),
  };
}

export function validateAndNormalizeCategoryUpdate(input: CategoryUpdateInput): CategoryUpdateInput {
  return {
    ...(input.name === undefined ? {} : { name: categoryName(input.name) }),
    ...(input.iconKey === undefined ? {} : { iconKey: categoryToken(input.iconKey, "iconKey") }),
    ...(input.colorToken === undefined ? {} : { colorToken: categoryToken(input.colorToken, "colorToken") }),
    ...(input.archivedAt === undefined ? {} : { archivedAt: nullableTimestamp(input.archivedAt, "archivedAt") }),
  };
}

export function categoryArchiveUpdate(archivedAt: unknown): CategoryArchiveUpdate {
  return { archivedAt: nullableTimestamp(archivedAt, "archivedAt") };
}

export function categoryRestoreUpdate(): CategoryArchiveUpdate {
  return { archivedAt: null };
}

function categoryName(value: unknown) {
  const normalized = requiredText(value, "name");
  if ([...normalized].length > 100) throw validationError("name", "allowed_value");
  return normalized;
}

function categoryToken(value: unknown, field: "iconKey" | "colorToken") {
  const normalized = requiredText(value, field);
  const length = [...normalized].length;
  if (length > 64) throw validationError(field, "allowed_value");
  if (!TOKEN_PATTERN.test(normalized)) throw validationError(field, "invalid_format");
  return normalized;
}

function requiredText(value: unknown, field: string) {
  if (typeof value !== "string") throw validationError(field, "required");
  const normalized = value.trim();
  if (!normalized) throw validationError(field, "required");
  return normalized;
}

function nullableTimestamp(value: unknown, field: string) {
  if (value === null) return null;
  if (typeof value !== "string") throw validationError(field, "invalid_date");
  const normalized = value.trim();
  if (!normalized || !Number.isFinite(Date.parse(normalized))) throw validationError(field, "invalid_date");
  return normalized;
}

function validationError(field: string, reason: "required" | "allowed_value" | "invalid_format" | "invalid_date") {
  return new FinanceError("validation_error", { field, reason });
}
