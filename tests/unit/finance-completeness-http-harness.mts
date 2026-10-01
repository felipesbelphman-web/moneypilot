import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";
import type { Database, Tables } from "../../src/lib/supabase/database.types.ts";
import type { FinanceCollectionPageRequest, FinanceCollectionPage } from "../../src/lib/persistence/finance-collection-pagination.ts";

declare module "node:module" {
  export function registerHooks(hooks: {
    resolve(specifier: string, context: unknown, nextResolve: (specifier: string, context: unknown) => unknown): unknown;
  }): void;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      return nextResolve(new URL(`./src/${specifier.slice(2)}.ts`, pathToFileURL(`${process.cwd()}/`)).href, context);
    }
    return nextResolve(specifier, context);
  },
});

export const { SupabaseFinanceRepository, transactionProjection, budgetProjection } =
  await import("../../src/lib/persistence/supabase-finance-repository.ts");
export const { SupabaseCategoryRepository } = await import("../../src/lib/persistence/supabase-category-repository.ts");
export const owner = "synthetic-owner";
export const cap = 4;
const timestamps = { created_at: "2026-09-01T10:00:00Z", updated_at: "2026-09-01T10:00:00Z" };

export function transactionRows(count: number): Tables<"transactions">[] {
  return Array.from({ length: count }, (_, index) => ({
    ...timestamps, user_id: owner, id: `t${String(index + 1).padStart(2, "0")}`,
    description: "Synthetic", category: "Food", category_color: "#123456", category_id: null,
    category_name_snapshot: "Food", category_color_snapshot: "#123456", normalized_category_snapshot: "food",
    payment: "Card", date: "Synthetic date", date_iso: `2026-09-${30 - index}`,
    origin: "Manual", type: "expense", amount: 10,
  }));
}

export function budgetRows(count: number): Tables<"budgets">[] {
  return Array.from({ length: count }, (_, index) => ({
    ...timestamps, user_id: owner, id: `b${String(index + 1).padStart(2, "0")}`,
    category: "Food", subtitle: "Synthetic", budget: 100, month: "2026-09", color: "#123456",
  }));
}

type Row = Record<string, unknown>;
type Observation = { method: string; url: URL; prefer: string | null; total: number; returned: number; range: string; status: number; ids: string[]; dates: string[]; from: number };

// This is a deliberately narrow HTTP simulator, not an emulator of deployed RLS
// or a claim about the deployed cap. There is no network fallback.
export function cappedRepository(options: {
  transactions?: Tables<"transactions">[];
  budgets?: Tables<"budgets">[];
  failTable?: "transactions" | "budgets";
  countMetadata?: "missing" | "unknown";
  nullTransactions?: boolean;
  collections?: Record<string, Row[]>;
  beforePage?: (table: string, call: number, from: number, url: URL) => { rows?: Row[]; count?: number; body?: unknown; fail?: boolean } | undefined;
} = {}) {
  const observations: Observation[] = [];
  const mockFetch: typeof fetch = async (input, init) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    assert.equal(url.origin, "http://supabase.invalid");
    assert.ok(["GET", "HEAD"].includes(request.method), "Only reads are allowed");
    const table = url.pathname.replace("/rest/v1/", "");
    assert.ok(["transactions", "budgets", "budget_adjustments", "goals", "goal_contribution_plans", "investments", "account_balance_settings", "categories"].includes(table));
    assert.equal(url.searchParams.get("user_id"), `eq.${owner}`);
    const dateFilters = url.searchParams.getAll("date_iso");
    const paged = (table !== "transactions" && table !== "account_balance_settings") || dateFilters.length > 0;
    assert.equal(url.searchParams.has("limit"), paged);
    assert.equal(url.searchParams.has("offset"), paged);
    const from = Number(url.searchParams.get("offset") ?? 0);
    const call = observations.filter(item => item.url.pathname.endsWith('/' + table)).length + 1;
    const override = options.beforePage?.(table, call, from, url) ?? {};
    assert.equal(request.headers.has("range"), false);
    const source: Row[] = override.rows ?? options.collections?.[table] ?? (table === "transactions" ? options.transactions ?? [] : table === "budgets" ? options.budgets ?? [] : []);
    const rows = source.filter(row => `eq.${row.user_id}` === url.searchParams.get("user_id") && (url.searchParams.get("archived_at") !== "is.null" || row.archived_at === null) && dateFilters.every(filter => filter.startsWith("gte.") ? String(row.date_iso) >= filter.slice(4) : filter.startsWith("lt.") ? String(row.date_iso) < filter.slice(3) : false));
    const terms = (url.searchParams.get("order") ?? "").split(",").filter(Boolean);
    rows.sort((left, right) => {
      for (const term of terms) {
        const [column, direction] = term.split(".");
        const a = String(Reflect.get(left, column));
        const b = String(Reflect.get(right, column));
        if (a !== b) return (a < b ? -1 : 1) * (direction === "desc" ? -1 : 1);
      }
      return 0;
    });
    const selected = rows.slice(from, from + Math.min(cap, Number(url.searchParams.get("limit") ?? cap)));
    const prefer = request.headers.get("prefer");
    const exact = prefer?.includes("count=exact") ?? false;
    const range = `${selected.length ? `${from}-${from + selected.length - 1}` : "*"}/${exact && options.countMetadata !== "unknown" ? override.count ?? rows.length : "*"}`;
    const status = table === options.failTable || override.fail ? 400 : exact && rows.length > selected.length ? 206 : 200;
    observations.push({ method: request.method, url, prefer, total: rows.length, returned: selected.length, range, status, from, ids: selected.map(row => String(row.id)), dates: selected.map(row => String(Reflect.get(row, "date_iso"))) });
    const columns = (url.searchParams.get("select") ?? "").split(",");
    const body = status === 400 ? { code: "42501", message: "Synthetic query failure" } : Object.hasOwn(override, "body") ? override.body : selected.map(row =>
      Object.fromEntries(columns.map(column => [column, Reflect.get(row, column)])));
    return new Response(request.method === "HEAD" ? null : JSON.stringify(table === "transactions" && options.nullTransactions ? null : body), {
      status, headers: { "Content-Type": "application/json", ...(options.countMetadata === "missing" ? {} : { "Content-Range": range }), "Range-Unit": "items" },
    });
  };
  const client = createClient<Database>("http://supabase.invalid", "synthetic-test-key", {
    global: { fetch: mockFetch }, auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  // Authentication is stubbed locally; collection HTTP still uses the real SDK.
  const categoryClient = Object.create(client);
  categoryClient.auth = { getUser: async () => ({ data: { user: { id: owner } }, error: null }) };
  return { client, repository: new SupabaseFinanceRepository(client), categoryRepository: new SupabaseCategoryRepository(categoryClient), observations };
}

type PaginationRow = Record<string, unknown>;
type PageOverride<Row> = {
  rows?: Row[];
  body?: unknown;
  totalHeader?: string | null;
  status?: number;
};

/** Real SDK range/count requests; all HTTP is intercepted, with no network fallback. */
export function paginatedSdkHarness<Row extends PaginationRow>(options: {
  rows: Row[];
  serverCap?: number;
  table?: "transactions" | "budget_adjustments" | "goal_contribution_plans";
  order?: string;
  projection?: string;
  beforePage?: (call: number, from: number) => PageOverride<Row> | undefined;
}) {
  const requests: Array<{ from: number; limit: number; method: string; url: URL; prefer: string | null }> = [];
  const table = options.table ?? "transactions";
  const order = options.order ?? "id";
  const projection = options.projection ?? "id,user_id,date_iso,created_at,amount";
  const client = createClient("http://supabase.invalid", "synthetic-test-key", {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (input, init) => {
      const request = new Request(input, init);
      const url = new URL(request.url);
      assert.equal(url.origin, "http://supabase.invalid");
      assert.equal(request.method, "GET");
      assert.equal(url.pathname, `/rest/v1/${table}`);
      assert.equal(url.searchParams.get("user_id"), `eq.${owner}`);
      assert.equal(url.searchParams.get("select"), projection);
      assert.equal(url.searchParams.get("order"), `${order}.asc`);
      assert.equal(request.headers.get("prefer"), "count=exact");
      const from = Number(url.searchParams.get("offset"));
      const limit = Number(url.searchParams.get("limit"));
      assert.ok(Number.isSafeInteger(from) && from >= 0);
      assert.ok(Number.isSafeInteger(limit) && limit > 0);
      requests.push({ from, limit, method: request.method, url, prefer: request.headers.get("prefer") });
      const override = options.beforePage?.(requests.length, from) ?? {};
      const rows = (override.rows ?? options.rows).filter(row => row.user_id === owner).slice().sort((a, b) =>
        String(a[order]) < String(b[order]) ? -1 : String(a[order]) > String(b[order]) ? 1 : 0);
      const selected = rows.slice(from, from + Math.min(limit, options.serverCap ?? cap));
      const body = Object.hasOwn(override, "body") ? override.body : selected.map(row =>
        Object.fromEntries(projection.split(",").map(column => [column, row[column]])));
      const denominator = Object.hasOwn(override, "totalHeader") ? override.totalHeader : String(rows.length);
      const range = `${selected.length ? `${from}-${from + selected.length - 1}` : "*"}/${denominator}`;
      const status = override.status ?? (rows.length > selected.length ? 206 : 200);
      return new Response(JSON.stringify(status >= 400 ? { code: "42501", message: "private backend details" } : body), {
        status, headers: { "Content-Type": "application/json", ...(denominator === null ? {} : { "Content-Range": range }) },
      });
    } },
  });
  function fetchPage({ from, to, count, signal }: FinanceCollectionPageRequest): PromiseLike<FinanceCollectionPage<Row>> {
    const query = client.from(table).select(projection, { count }).eq("user_id", owner).order(order, { ascending: true }).range(from, to);
    if (signal) query.abortSignal(signal);
    return query.then(response => ({ data: response.data as Row[] | null, count: response.count, error: response.error }));
  }
  return { fetchPage, requests };
}
