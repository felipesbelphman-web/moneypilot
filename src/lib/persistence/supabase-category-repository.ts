import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category, CategoryCreateInput, CategoryUpdateInput } from "@/lib/domain/category";
import { categoryArchiveUpdate, categoryRestoreUpdate } from "@/lib/domain/category";
import { FinanceError, mapFinanceRepositoryError } from "@/lib/domain/finance-error";
import { categoryCreateToRow, categoryRowToDomain, categoryUpdateToRow } from "@/lib/persistence/supabase-category-mappers";
import type { Database } from "@/lib/supabase/database.types";

type SupabaseError = { code?: string } | null;
export type CreateCategory = Omit<CategoryCreateInput, "id" | "userId">;

export const categoryProjection = "id,user_id,name,type,normalized_name,icon_key,color_token,archived_at,created_at,updated_at";

export class SupabaseCategoryRepository {
  private readonly client: SupabaseClient<Database>;

  constructor(client: SupabaseClient<Database>) {
    this.client = client;
  }

  async listCategories(): Promise<Category[]> {
    const userId = await this.authenticatedUserId();
    const result = await this.ordered(
      this.client.from("categories").select(categoryProjection).eq("user_id", userId).is("archived_at", null),
    );
    throwIfSupabaseError(result.error);
    return (result.data ?? []).map(categoryRowToDomain);
  }

  async listAllCategories(): Promise<Category[]> {
    const userId = await this.authenticatedUserId();
    const result = await this.ordered(
      this.client.from("categories").select(categoryProjection).eq("user_id", userId),
    );
    throwIfSupabaseError(result.error);
    return (result.data ?? []).map(categoryRowToDomain);
  }

  async createCategory(input: CreateCategory): Promise<Category> {
    const userId = await this.authenticatedUserId();
    const result = await this.client.from("categories").insert(categoryCreateToRow(userId, input)).select(categoryProjection).single();
    throwIfSupabaseError(result.error);
    return categoryRowToDomain(requireData(result.data));
  }

  async updateCategory(id: string, input: CategoryUpdateInput): Promise<Category> {
    const userId = await this.authenticatedUserId();
    const payload = categoryUpdateToRow(input);
    if (Object.keys(payload).length === 0) {
      throw new FinanceError("validation_error", { field: "update", reason: "required" });
    }
    return this.updateOwnedCategory(userId, id, payload);
  }

  async archiveCategory(id: string, archivedAt: unknown): Promise<Category> {
    const userId = await this.authenticatedUserId();
    return this.updateOwnedCategory(userId, id, categoryUpdateToRow(categoryArchiveUpdate(archivedAt)));
  }

  async restoreCategory(id: string): Promise<Category> {
    const userId = await this.authenticatedUserId();
    return this.updateOwnedCategory(userId, id, categoryUpdateToRow(categoryRestoreUpdate()));
  }

  private async authenticatedUserId() {
    const result = await this.client.auth.getUser();
    throwIfSupabaseError(result.error);
    const userId = result.data.user?.id;
    if (!userId) throw new FinanceError("authentication_required");
    return userId;
  }

  private ordered<Query extends { order(column: string, options: { ascending: boolean }): Query }>(query: Query): Query {
    return query
      .order("type", { ascending: true })
      .order("normalized_name", { ascending: true })
      .order("id", { ascending: true });
  }

  private async updateOwnedCategory(
    userId: string,
    id: string,
    payload: ReturnType<typeof categoryUpdateToRow>,
  ): Promise<Category> {
    const result = await this.client.from("categories").update(payload).eq("user_id", userId).eq("id", id).select(categoryProjection).single();
    throwIfSupabaseError(result.error);
    return categoryRowToDomain(requireData(result.data));
  }
}

function throwIfSupabaseError(error: SupabaseError): void {
  if (!error) return;
  if (error.code === "PGRST116") throw new FinanceError("unknown_repository_error");
  throw mapFinanceRepositoryError(error);
}

function requireData<T>(data: T | null): T {
  if (data === null) throw new FinanceError("unknown_repository_error");
  return data;
}
