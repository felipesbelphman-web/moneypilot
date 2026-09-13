import { SupabaseFinanceRepository } from "@/lib/persistence/supabase-finance-repository";
import { requireCompleteFinanceData } from "@/lib/persistence/finance-hydration";
import type { PersistedFinanceData } from "@/lib/persistence/finance-persistence-model";
import { createClient } from "@/lib/supabase/server";

// Server-side adapter that reuses the existing user-scoped finance repository.
export async function loadAuthenticatedFinancialData(userId: string): Promise<PersistedFinanceData> {
  if (!userId.trim()) {
    throw new Error("Authenticated user context is required");
  }

  const supabase = await createClient();
  const repository = new SupabaseFinanceRepository(supabase);
  return requireCompleteFinanceData(await repository.loadFinanceData(userId));
}
