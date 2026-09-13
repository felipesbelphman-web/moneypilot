import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import test from "node:test";

declare module "node:module" {
  export function registerHooks(hooks: {
    resolve(
      specifier: string,
      context: unknown,
      nextResolve: (specifier: string, context: unknown) => unknown,
    ): unknown;
  }): void;
}

const projectRoot = pathToFileURL(`${process.cwd()}\\`).href;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      return nextResolve(new URL(`./src/${specifier.slice(2)}.ts`, projectRoot).href, context);
    }
    return nextResolve(specifier, context);
  },
});

const {
  accountBalanceSettingsRowToDomain,
  accountBalanceSettingsToInsert,
  accountBalanceSettingsToUpdate,
} = await import("../../src/lib/persistence/supabase-finance-mappers.ts");
const { SupabaseFinanceRepository } = await import("../../src/lib/persistence/supabase-finance-repository.ts");
const { FinanceError } = await import("../../src/lib/domain/finance-error.ts");

const row = {
  user_id: "user-a",
  opening_balance: -10.25,
  opening_date: "2026-09-01",
  created_at: "2026-09-01T10:00:00Z",
  updated_at: "2026-09-02T11:00:00Z",
};

test("maps an account balance row to the complete domain value", () => {
  assert.deepEqual(accountBalanceSettingsRowToDomain(row), {
    openingBalance: -10.25,
    openingDate: "2026-09-01",
    userId: "user-a",
    createdAt: "2026-09-01T10:00:00Z",
    updatedAt: "2026-09-02T11:00:00Z",
  });
});

test("maps zero and negative balances to inserts without changing them", () => {
  assert.deepEqual(accountBalanceSettingsToInsert("user-a", { openingBalance: 0, openingDate: "2026-09-01" }), {
    user_id: "user-a",
    opening_balance: 0,
    opening_date: "2026-09-01",
  });
  assert.equal(accountBalanceSettingsToInsert("user-a", { openingBalance: -4, openingDate: "2026-09-01" }).opening_balance, -4);
  assert.deepEqual(accountBalanceSettingsToUpdate({ openingBalance: 0, openingDate: "2026-09-01" }), {
    opening_balance: 0,
    opening_date: "2026-09-01",
  });
});

test("rejects an invalid persisted balance at the mapper boundary", () => {
  assert.throws(
    () => accountBalanceSettingsRowToDomain({ ...row, opening_balance: Number.NaN }),
    (error) => error instanceof FinanceError && error.code === "validation_error",
  );
});

type FakeResponse = { data: typeof row | null; error: { code?: string } | null };

function createClient(readResponse: FakeResponse, writeResponse = readResponse) {
  const calls: Array<{ method: string; args: readonly unknown[] }> = [];
  const query = {
    select(...args: readonly unknown[]) { calls.push({ method: "select", args }); return query; },
    eq(...args: readonly unknown[]) { calls.push({ method: "eq", args }); return query; },
    maybeSingle() { calls.push({ method: "maybeSingle", args: [] }); return Promise.resolve(readResponse); },
    insert(...args: readonly unknown[]) { calls.push({ method: "insert", args }); return query; },
    update(...args: readonly unknown[]) { calls.push({ method: "update", args }); return query; },
    single() { calls.push({ method: "single", args: [] }); return Promise.resolve(writeResponse); },
  };
  const client = {
    from(...args: readonly unknown[]) { calls.push({ method: "from", args }); return query; },
  };
  return { client, calls };
}

function repositoryFor(response: FakeResponse, writeResponse?: FakeResponse) {
  const fake = createClient(response, writeResponse);
  return {
    repository: Reflect.construct(SupabaseFinanceRepository, [fake.client]) as InstanceType<typeof SupabaseFinanceRepository>,
    calls: fake.calls,
  };
}

test("reads an existing setting with an exact owner filter and explicit projection", async () => {
  const { repository, calls } = repositoryFor({ data: row, error: null });
  assert.equal((await repository.getAccountBalanceSettings("user-a"))?.openingBalance, -10.25);
  assert.deepEqual(calls, [
    { method: "from", args: ["account_balance_settings"] },
    { method: "select", args: ["user_id,opening_balance,opening_date,created_at,updated_at"] },
    { method: "eq", args: ["user_id", "user-a"] },
    { method: "maybeSingle", args: [] },
  ]);
});

test("treats a missing setting as a valid null response", async () => {
  const { repository } = repositoryFor({ data: null, error: null });
  assert.equal(await repository.getAccountBalanceSettings("user-a"), null);
});

test("maps repository read errors to a safe FinanceError", async () => {
  const { repository } = repositoryFor({ data: null, error: { code: "42501" } });
  await assert.rejects(
    repository.getAccountBalanceSettings("user-a"),
    (error) => error instanceof FinanceError && error.code === "ownership_denied",
  );
});

test("updates an existing setting with only editable fields and an owner filter", async () => {
  const { repository, calls } = repositoryFor({ data: row, error: null });
  const confirmed = await repository.saveAccountBalanceSettings("user-a", { openingBalance: -10.25, openingDate: "2026-09-01" });
  assert.equal(confirmed.updatedAt, row.updated_at);
  assert.deepEqual(calls, [
    { method: "from", args: ["account_balance_settings"] },
    { method: "select", args: ["user_id,opening_balance,opening_date,created_at,updated_at"] },
    { method: "eq", args: ["user_id", "user-a"] },
    { method: "maybeSingle", args: [] },
    { method: "from", args: ["account_balance_settings"] },
    { method: "update", args: [{ opening_balance: -10.25, opening_date: "2026-09-01" }] },
    { method: "eq", args: ["user_id", "user-a"] },
    { method: "select", args: ["user_id,opening_balance,opening_date,created_at,updated_at"] },
    { method: "single", args: [] },
  ]);
});

test("creates a missing setting with ownership supplied by the authenticated boundary", async () => {
  const { repository, calls } = repositoryFor({ data: null, error: null }, { data: row, error: null });
  await repository.saveAccountBalanceSettings("user-a", { openingBalance: -10.25, openingDate: "2026-09-01" });
  assert.ok(calls.some((call) => call.method === "insert" && JSON.stringify(call.args) === JSON.stringify([{ user_id: "user-a", opening_balance: -10.25, opening_date: "2026-09-01" }])));
  assert.equal(calls.some((call) => call.method === "upsert" || call.method === "delete"), false);
});

test("account balance source contains no DELETE, service role, or unsafe upsert", async () => {
  const source = await readFile("src/lib/persistence/supabase-finance-repository.ts", "utf8");
  const accountMethods = source.slice(source.indexOf("async getAccountBalanceSettings"), source.indexOf("private async loadResource"));
  assert.doesNotMatch(accountMethods, /\.delete\(|\.upsert\(|service_role/i);
  assert.match(accountMethods, /\.update\(accountBalanceSettingsToUpdate\(settings\)\)\.eq\("user_id", userId\)/);
});

test("contains no service-role access in the account balance repository", async () => {
  const source = await readFile("src/lib/persistence/supabase-finance-repository.ts", "utf8");
  assert.doesNotMatch(source, /service_role/i);
});

test("provider exposes a session-owned save and recalculates from confirmed settings and complete transactions", async () => {
  const source = await readFile("src/components/FinanceDataProvider.tsx", "utf8");
  assert.match(source, /saveAccountBalanceSettings: \(settings: AccountBalanceSettingsInput\)/);
  assert.match(source, /\(userId\) => repository\.saveAccountBalanceSettings\(userId, settings\)/);
  assert.match(source, /setAccountBalanceSettings/);
  assert.match(source, /calculateCompleteCurrentBalance\(accountBalanceSettings, transactions, transactionsComplete\)/);
  assert.match(source, /\[accountBalanceSettings, transactions, transactionsComplete\]/);
  assert.match(source, /currentUserIdRef\.current/);
  assert.match(source, /accountGenerationRef\.current === expectedGeneration/);
  assert.doesNotMatch(source, /upsertAccountBalanceSettings/);
});
