import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import test from "node:test";

declare module "node:module" {
  export function registerHooks(hooks: {
    resolve(specifier: string, context: unknown, nextResolve: (specifier: string, context: unknown) => unknown): unknown;
  }): void;
}

const projectRoot = pathToFileURL(`${process.cwd()}\\`).href;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) return nextResolve(new URL(`./src/${specifier.slice(2)}.ts`, projectRoot).href, context);
    return nextResolve(specifier, context);
  },
});

const { categoryCreateToRow, categoryRowToDomain, categoryUpdateToRow } = await import("../../src/lib/persistence/supabase-category-mappers.ts");
const { categoryProjection, SupabaseCategoryRepository } = await import("../../src/lib/persistence/supabase-category-repository.ts");
const { FinanceError } = await import("../../src/lib/domain/finance-error.ts");

const row = {
  id: "category-1",
  user_id: "authenticated-user",
  name: "Groceries",
  type: "expense",
  normalized_name: "groceries",
  icon_key: "shopping_cart",
  color_token: "green-500",
  archived_at: null,
  created_at: "2026-09-11T10:00:00Z",
  updated_at: "2026-09-11T11:00:00Z",
};

test("maps complete income and expense rows from snake_case", () => {
  assert.deepEqual(categoryRowToDomain(row), {
    id: "category-1", userId: "authenticated-user", name: "Groceries", type: "expense",
    normalizedName: "groceries", iconKey: "shopping_cart", colorToken: "green-500",
    archivedAt: null, createdAt: "2026-09-11T10:00:00Z", updatedAt: "2026-09-11T11:00:00Z",
  });
  assert.equal(categoryRowToDomain({ ...row, type: "income" }).type, "income");
});

test("mapper preserves a populated archived timestamp", () => {
  assert.equal(categoryRowToDomain({ ...row, archived_at: "2026-09-12T10:00:00Z" }).archivedAt, "2026-09-12T10:00:00Z");
});

test("mapper rejects an invalid remote type safely", () => {
  assert.throws(() => categoryRowToDomain({ ...row, type: "transfer" }), (error) => error instanceof FinanceError && error.code === "validation_error" && error.message === "validation_error");
});

test("create mapper derives ownership and omits generated fields", () => {
  assert.deepEqual(categoryCreateToRow("authenticated-user", {
    name: "Groceries", type: "expense", iconKey: "shopping_cart", colorToken: "green-500",
  }), {
    user_id: "authenticated-user", name: "Groceries", type: "expense", icon_key: "shopping_cart", color_token: "green-500",
  });
});

test("update mapper emits only database-editable fields", () => {
  assert.deepEqual(categoryUpdateToRow({ name: "Food", iconKey: "food", colorToken: "green-600", archivedAt: null }), {
    name: "Food", icon_key: "food", color_token: "green-600", archived_at: null,
  });
});

type Response = { data: unknown; error: { code?: string; message?: string } | null };

function createFakeClient(options: {
  userId?: string | null;
  authError?: { code?: string } | null;
  listResponse?: Response;
  singleResponse?: Response;
} = {}) {
  const calls: Array<{ method: string; args: readonly unknown[] }> = [];
  const listResponse = options.listResponse ?? { data: [row], error: null };
  const singleResponse = options.singleResponse ?? { data: row, error: null };
  const query = {
    select(...args: readonly unknown[]) { calls.push({ method: "select", args }); return query; },
    eq(...args: readonly unknown[]) { calls.push({ method: "eq", args }); return query; },
    is(...args: readonly unknown[]) { calls.push({ method: "is", args }); return query; },
    order(...args: readonly unknown[]) { calls.push({ method: "order", args }); return query; },
    insert(...args: readonly unknown[]) { calls.push({ method: "insert", args }); return query; },
    update(...args: readonly unknown[]) { calls.push({ method: "update", args }); return query; },
    single() { calls.push({ method: "single", args: [] }); return Promise.resolve(singleResponse); },
    then(resolve: (value: Response) => unknown, reject?: (reason: unknown) => unknown) {
      return Promise.resolve(listResponse).then(resolve, reject);
    },
  };
  const client = {
    auth: {
      getUser() {
        calls.push({ method: "getUser", args: [] });
        return Promise.resolve({ data: { user: options.userId === null ? null : { id: options.userId ?? "authenticated-user" } }, error: options.authError ?? null });
      },
    },
    from(...args: readonly unknown[]) { calls.push({ method: "from", args }); return query; },
  };
  return {
    repository: Reflect.construct(SupabaseCategoryRepository, [client]) as InstanceType<typeof SupabaseCategoryRepository>,
    calls,
  };
}

test("rejects unauthenticated access before querying categories", async () => {
  const context = createFakeClient({ userId: null });
  await assert.rejects(context.repository.listCategories(), (error) => error instanceof FinanceError && error.code === "authentication_required");
  assert.equal(context.calls.some((call) => call.method === "from"), false);
});

test("lists active categories with deterministic ordering", async () => {
  const context = createFakeClient();
  assert.equal((await context.repository.listCategories()).length, 1);
  assert.deepEqual(context.calls, [
    { method: "getUser", args: [] },
    { method: "from", args: ["categories"] },
    { method: "select", args: [categoryProjection] },
    { method: "eq", args: ["user_id", "authenticated-user"] },
    { method: "is", args: ["archived_at", null] },
    { method: "order", args: ["type", { ascending: true }] },
    { method: "order", args: ["normalized_name", { ascending: true }] },
    { method: "order", args: ["id", { ascending: true }] },
  ]);
});

test("explicit all-categories listing includes archived rows", async () => {
  const context = createFakeClient({ listResponse: { data: [{ ...row, archived_at: "2026-09-12T10:00:00Z" }], error: null } });
  assert.equal((await context.repository.listAllCategories())[0]?.archivedAt, "2026-09-12T10:00:00Z");
  assert.equal(context.calls.some((call) => call.method === "is"), false);
});

test("create uses the authenticated user and exact safe payload", async () => {
  const context = createFakeClient({ userId: "session-user", singleResponse: { data: { ...row, user_id: "session-user" }, error: null } });
  await context.repository.createCategory({ name: "Groceries", type: "expense", iconKey: "shopping_cart", colorToken: "green-500" });
  const insert = context.calls.find((call) => call.method === "insert");
  assert.deepEqual(insert?.args, [{ user_id: "session-user", name: "Groceries", type: "expense", icon_key: "shopping_cart", color_token: "green-500" }]);
});

test("update sends only editable fields and owned filters", async () => {
  const context = createFakeClient();
  await context.repository.updateCategory("category-1", { name: "Food", iconKey: "food" });
  assert.deepEqual(context.calls.find((call) => call.method === "update")?.args, [{ name: "Food", icon_key: "food" }]);
  assert.ok(context.calls.some((call) => call.method === "eq" && call.args[0] === "user_id"));
  assert.ok(context.calls.some((call) => call.method === "eq" && call.args[0] === "id"));
});

test("empty update is rejected before the remote call", async () => {
  const context = createFakeClient();
  await assert.rejects(context.repository.updateCategory("category-1", {}), (error) => error instanceof FinanceError && error.code === "validation_error");
  assert.equal(context.calls.some((call) => call.method === "update"), false);
});

test("archive and restore update only archived_at", async () => {
  const archive = createFakeClient();
  await archive.repository.archiveCategory("category-1", "2026-09-12T10:00:00Z");
  assert.deepEqual(archive.calls.find((call) => call.method === "update")?.args, [{ archived_at: "2026-09-12T10:00:00Z" }]);

  const restore = createFakeClient();
  await restore.repository.restoreCategory("category-1");
  assert.deepEqual(restore.calls.find((call) => call.method === "update")?.args, [{ archived_at: null }]);
});

test("name conflicts on create and restore remain sanitized", async () => {
  for (const operation of [
    (repository: InstanceType<typeof SupabaseCategoryRepository>) => repository.createCategory({ name: "Food", type: "expense", iconKey: "food", colorToken: "green-500" }),
    (repository: InstanceType<typeof SupabaseCategoryRepository>) => repository.restoreCategory("category-1"),
  ]) {
    const context = createFakeClient({ singleResponse: { data: null, error: { code: "23505", message: "private constraint detail" } } });
    await assert.rejects(operation(context.repository), (error) => error instanceof FinanceError && error.code === "duplicate_record" && !error.message.includes("private"));
  }
});

test("not-found and remote failures use safe stable errors", async () => {
  const missing = createFakeClient({ singleResponse: { data: null, error: { code: "PGRST116", message: "private query" } } });
  await assert.rejects(missing.repository.updateCategory("missing", { name: "Food" }), (error) => error instanceof FinanceError && error.code === "unknown_repository_error" && error.message === "unknown_repository_error");

  const failed = createFakeClient({ listResponse: { data: null, error: { code: "FETCH_ERROR", message: "private URL" } } });
  await assert.rejects(failed.repository.listCategories(), (error) => error instanceof FinanceError && error.code === "repository_unavailable" && !error.message.includes("private"));
});

test("invalid confirmed rows are rejected", async () => {
  const context = createFakeClient({ singleResponse: { data: { ...row, type: "transfer" }, error: null } });
  await assert.rejects(context.repository.createCategory({ name: "Food", type: "expense", iconKey: "food", colorToken: "green-500" }), (error) => error instanceof FinanceError && error.code === "validation_error");
});

test("repository has no delete API and update source excludes immutable fields", async () => {
  const repositorySource = await readFile("src/lib/persistence/supabase-category-repository.ts", "utf8");
  assert.equal("deleteCategory" in SupabaseCategoryRepository.prototype, false);
  assert.doesNotMatch(repositorySource, /\.delete\s*\(/);

  const context = createFakeClient();
  await context.repository.updateCategory("category-1", { colorToken: "blue-500" });
  const payload = context.calls.find((call) => call.method === "update")?.args[0];
  assert.deepEqual(payload, { color_token: "blue-500" });
  assert.equal(typeof payload === "object" && payload !== null && ("user_id" in payload || "type" in payload), false);
});
