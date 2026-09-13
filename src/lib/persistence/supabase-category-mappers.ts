import type { Category, CategoryCreateInput, CategoryUpdateInput } from "@/lib/domain/category";
import { parseCategoryType, validateAndNormalizeCategoryCreate, validateAndNormalizeCategoryUpdate } from "@/lib/domain/category";
import { FinanceError } from "@/lib/domain/finance-error";
import type { Tables, TablesInsert, TablesUpdate } from "@/lib/supabase/database.types";

export type CategoryRow = Tables<"categories">;
export type CategoryInsert = Pick<TablesInsert<"categories">, "user_id" | "name" | "type" | "icon_key" | "color_token" | "archived_at">;
export type CategoryUpdate = Pick<TablesUpdate<"categories">, "name" | "icon_key" | "color_token" | "archived_at">;

export function categoryRowToDomain(row: CategoryRow): Category {
  const type = parseCategoryType(row.type);
  const writable = validateAndNormalizeCategoryCreate({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    type,
    iconKey: row.icon_key,
    colorToken: row.color_token,
    archivedAt: validateTimestamp(row.archived_at, "archivedAt", true),
  });

  return {
    id: requiredText(writable.id, "id"),
    userId: requiredText(writable.userId, "userId"),
    name: writable.name,
    type,
    normalizedName: requiredText(row.normalized_name, "normalizedName"),
    iconKey: writable.iconKey,
    colorToken: writable.colorToken,
    archivedAt: writable.archivedAt ?? null,
    createdAt: validateTimestamp(row.created_at, "createdAt", false),
    updatedAt: validateTimestamp(row.updated_at, "updatedAt", false),
  };
}

export function categoryCreateToRow(userId: string, input: Omit<CategoryCreateInput, "id" | "userId">): CategoryInsert {
  const normalized = validateAndNormalizeCategoryCreate({ ...input, userId });
  return {
    user_id: normalized.userId,
    name: normalized.name,
    type: normalized.type,
    icon_key: normalized.iconKey,
    color_token: normalized.colorToken,
    ...(normalized.archivedAt === undefined ? {} : { archived_at: normalized.archivedAt }),
  };
}

export function categoryUpdateToRow(input: CategoryUpdateInput): CategoryUpdate {
  const normalized = validateAndNormalizeCategoryUpdate(input);
  return {
    ...(normalized.name === undefined ? {} : { name: normalized.name }),
    ...(normalized.iconKey === undefined ? {} : { icon_key: normalized.iconKey }),
    ...(normalized.colorToken === undefined ? {} : { color_token: normalized.colorToken }),
    ...(normalized.archivedAt === undefined ? {} : { archived_at: normalized.archivedAt }),
  };
}

function requiredText(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new FinanceError("validation_error", { field, reason: "required" });
  }
  return value;
}

function validateTimestamp(value: unknown, field: string, nullable: true): string | null;
function validateTimestamp(value: unknown, field: string, nullable: false): string;
function validateTimestamp(value: unknown, field: string, nullable: boolean) {
  if (nullable && value === null) return null;
  if (typeof value !== "string" || !value.trim() || !Number.isFinite(Date.parse(value))) {
    throw new FinanceError("validation_error", { field, reason: "invalid_date" });
  }
  return value;
}
