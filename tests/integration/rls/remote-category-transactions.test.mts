import assert from "node:assert/strict";
import { test } from "node:test";
import { createClient, type AuthError, type PostgrestError, type SupabaseClient } from "@supabase/supabase-js";
import type { Database, TablesInsert } from "../../../src/lib/supabase/database.types.ts";

type TestClient = SupabaseClient<Database>;
type TestError = AuthError | PostgrestError | null;
type LogicalUser = "A" | "B";
type RegisteredCategory = { id: string; userId: string; name: string; owner: LogicalUser };
type RegisteredTransaction = { id: string; userId: string; description: string; owner: LogicalUser };
type CleanupFailure = {
  fixture: "category" | "transaction";
  owner: LogicalUser;
  phase: "validation" | "cleanup" | "verification";
  status: number | null;
  code: string | null;
};

const confirmation = "I_CONFIRM_ISOLATED_CATEGORY_TRANSACTION_REMOTE_TESTS";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const protectedCategoryNames = new Set(["Alimentação", "Transporte"]);
const protectedTransactionDescription = "TESTE Despesa manual";

type EnvironmentName =
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
  | "SUPABASE_SERVICE_ROLE_KEY"
  | "SUPABASE_TEST_USER_A_EMAIL"
  | "SUPABASE_TEST_USER_A_PASSWORD"
  | "SUPABASE_TEST_USER_B_EMAIL"
  | "SUPABASE_TEST_USER_B_PASSWORD";

function environment(name: EnvironmentName) {
  const value = process.env[name];
  if (!value) throw new Error(`Category/transaction remote tests blocked: missing required server-side environment configuration.`);
  return value;
}

function assertExecutionAuthorized() {
  if (process.env.RUN_REMOTE_CATEGORY_TRANSACTION_TESTS !== "true") {
    throw new Error("Category/transaction remote tests blocked: explicit run opt-in is missing.");
  }
  if (process.env.SUPABASE_TEST_REMOTE_CONFIRMATION !== confirmation) {
    throw new Error("Category/transaction remote tests blocked: dedicated-user confirmation is missing.");
  }
  for (const name of [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_TEST_USER_A_EMAIL",
    "SUPABASE_TEST_USER_A_PASSWORD",
    "SUPABASE_TEST_USER_B_EMAIL",
    "SUPABASE_TEST_USER_B_PASSWORD",
  ] as const) environment(name);
}

function regularClient() {
  return createClient<Database>(environment("NEXT_PUBLIC_SUPABASE_URL"), environment("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });
}

function cleanupClient() {
  return createClient<Database>(environment("NEXT_PUBLIC_SUPABASE_URL"), environment("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });
}

class SanitizedRemoteError extends Error {
  readonly status: number | null;
  readonly code: string | null;

  constructor(
    operation: string,
    status: number | null,
    code: string | null,
  ) {
    super(`${operation} failed (HTTP ${status ?? "unknown"}; code ${code ?? "unknown"}).`);
    this.name = "SanitizedRemoteError";
    this.status = status;
    this.code = code;
  }
}

function expectNoError(error: TestError, status?: number, operation = "Remote operation") {
  if (error) throw new SanitizedRemoteError(operation, status ?? null, error.code ?? null);
}

function cleanupFailure(
  fixture: CleanupFailure["fixture"],
  owner: LogicalUser,
  phase: CleanupFailure["phase"],
  error: unknown,
): CleanupFailure {
  return {
    fixture,
    owner,
    phase,
    status: error instanceof SanitizedRemoteError ? error.status : null,
    code: error instanceof SanitizedRemoteError ? error.code : null,
  };
}

async function assertCleanupReadAccess(admin: TestClient) {
  try {
    const categories = await admin.from("categories").select("id", { head: true, count: "exact" }).limit(1);
    expectNoError(categories.error, categories.status, "Cleanup preflight SELECT on categories");
  } catch (error) {
    if (error instanceof SanitizedRemoteError) throw error;
    throw new SanitizedRemoteError("Cleanup preflight SELECT on categories", null, null);
  }

  try {
    const transactions = await admin.from("transactions").select("id", { head: true, count: "exact" }).limit(1);
    expectNoError(transactions.error, transactions.status, "Cleanup preflight SELECT on transactions");
  } catch (error) {
    if (error instanceof SanitizedRemoteError) throw error;
    throw new SanitizedRemoteError("Cleanup preflight SELECT on transactions", null, null);
  }
}

function assertSameInstant(actual: string | null | undefined, expected: string) {
  assert.ok(actual, "Expected a timestamp from the remote operation.");
  const actualMilliseconds = Date.parse(actual);
  const expectedMilliseconds = Date.parse(expected);
  assert.ok(Number.isFinite(actualMilliseconds), "Remote timestamp is not a valid date.");
  assert.ok(Number.isFinite(expectedMilliseconds), "Expected timestamp is not a valid date.");
  assert.equal(actualMilliseconds, expectedMilliseconds, "Remote timestamp represents a different instant.");
}

function expectCode(error: TestError, expected: string | readonly string[]) {
  assert.ok(error, "Expected a sanitized remote error.");
  const accepted = typeof expected === "string" ? [expected] : expected;
  assert.ok(accepted.includes(error.code ?? ""), `Expected one of the approved sanitized remote error codes.`);
}

function expectEmpty(data: unknown[] | null) {
  assert.equal(data?.length ?? 0, 0, "Expected an empty RLS-filtered result.");
}

async function signIn(testClient: TestClient, user: LogicalUser) {
  const emailName = user === "A" ? "SUPABASE_TEST_USER_A_EMAIL" : "SUPABASE_TEST_USER_B_EMAIL";
  const passwordName = user === "A" ? "SUPABASE_TEST_USER_A_PASSWORD" : "SUPABASE_TEST_USER_B_PASSWORD";
  const response = await testClient.auth.signInWithPassword({ email: environment(emailName), password: environment(passwordName) });
  if (response.error || !response.data.user || !response.data.session) {
    throw new Error(`Dedicated test account ${user} authentication failed (${response.error?.code ?? "no_session"}).`);
  }
  return response.data.user.id;
}

function registerCategory(registry: Map<string, RegisteredCategory>, fixture: RegisteredCategory, prefix: string) {
  assert.ok(uuidPattern.test(fixture.id), "Refused to register a category with a non-UUID identifier.");
  assert.ok(fixture.name.startsWith(`${prefix}-`), "Refused to register a category without the current run prefix.");
  assert.ok(!protectedCategoryNames.has(fixture.name), "Refused to register a protected permanent category.");
  assert.ok(!registry.has(fixture.id), "Refused to register a duplicate category identifier.");
  registry.set(fixture.id, fixture);
}

function registerTransaction(registry: Map<string, RegisteredTransaction>, fixture: RegisteredTransaction, prefix: string) {
  assert.ok(uuidPattern.test(fixture.id), "Refused to register a transaction with a non-UUID identifier.");
  assert.ok(fixture.description.startsWith(`${prefix}-`), "Refused to register a transaction without the current run prefix.");
  assert.notEqual(fixture.description, protectedTransactionDescription, "Refused to register the protected real transaction.");
  assert.ok(!registry.has(fixture.id), "Refused to register a duplicate transaction identifier.");
  registry.set(fixture.id, fixture);
}

async function cleanupTransaction(admin: TestClient, fixture: RegisteredTransaction, registry: Map<string, RegisteredTransaction>, prefix: string) {
  if (!uuidPattern.test(fixture.id) || registry.get(fixture.id) !== fixture || !fixture.description.startsWith(`${prefix}-`) || fixture.description === protectedTransactionDescription) {
    throw new Error(`Cleanup validation failed for a transaction fixture owned by logical user ${fixture.owner}.`);
  }
  const found = await admin.from("transactions").select("id,user_id,description").eq("id", fixture.id).eq("user_id", fixture.userId).maybeSingle();
  expectNoError(found.error, found.status, "Cleanup transaction validation SELECT");
  if (!found.data) return;
  if (found.data.id !== fixture.id || found.data.user_id !== fixture.userId || found.data.description !== fixture.description) {
    throw new Error(`Cleanup ownership validation failed for a transaction fixture owned by logical user ${fixture.owner}.`);
  }
  const removed = await admin.from("transactions").delete().eq("id", fixture.id).eq("user_id", fixture.userId).eq("description", fixture.description).select("id").single();
  expectNoError(removed.error, removed.status, "Cleanup transaction DELETE");
  assert.equal(removed.data?.id, fixture.id, "Exact transaction cleanup did not remove the registered fixture.");
}

async function cleanupCategory(admin: TestClient, fixture: RegisteredCategory, registry: Map<string, RegisteredCategory>, prefix: string) {
  if (!uuidPattern.test(fixture.id) || registry.get(fixture.id) !== fixture || !fixture.name.startsWith(`${prefix}-`) || protectedCategoryNames.has(fixture.name)) {
    throw new Error(`Cleanup validation failed for a category fixture owned by logical user ${fixture.owner}.`);
  }
  const found = await admin.from("categories").select("id,user_id,name").eq("id", fixture.id).eq("user_id", fixture.userId).maybeSingle();
  expectNoError(found.error, found.status, "Cleanup category validation SELECT");
  if (!found.data) return;
  if (found.data.id !== fixture.id || found.data.user_id !== fixture.userId || !found.data.name.startsWith(`${prefix}-`) || protectedCategoryNames.has(found.data.name)) {
    throw new Error(`Cleanup ownership validation failed for a category fixture owned by logical user ${fixture.owner}.`);
  }
  const removed = await admin.from("categories").delete().eq("id", fixture.id).eq("user_id", fixture.userId).eq("name", found.data.name).select("id").single();
  expectNoError(removed.error, removed.status, "Cleanup category DELETE");
  assert.equal(removed.data?.id, fixture.id, "Exact category cleanup did not remove the registered fixture.");
}

async function verifyCleanup(admin: TestClient, categories: Map<string, RegisteredCategory>, transactions: Map<string, RegisteredTransaction>, failures: CleanupFailure[]) {
  for (const fixture of transactions.values()) {
    try {
      const response = await admin.from("transactions").select("id").eq("id", fixture.id).eq("user_id", fixture.userId);
      expectNoError(response.error, response.status, "Cleanup transaction verification SELECT");
      expectEmpty(response.data);
    } catch (error) {
      failures.push(cleanupFailure("transaction", fixture.owner, "verification", error));
    }
  }
  for (const fixture of categories.values()) {
    try {
      const response = await admin.from("categories").select("id").eq("id", fixture.id).eq("user_id", fixture.userId);
      expectNoError(response.error, response.status, "Cleanup category verification SELECT");
      expectEmpty(response.data);
    } catch (error) {
      failures.push(cleanupFailure("category", fixture.owner, "verification", error));
    }
  }
}

assertExecutionAuthorized();

test("isolated remote Categories and Transactions integration", async (suite) => {
  const admin = cleanupClient();
  await assertCleanupReadAccess(admin);

  const userAClient = regularClient();
  const userBClient = regularClient();
  const prefix = `moneypilot-category-transaction-${crypto.randomUUID()}`;
  const categories = new Map<string, RegisteredCategory>();
  const transactions = new Map<string, RegisteredTransaction>();
  let userAId: string | null = null;
  let userBId: string | null = null;
  let testFailure: unknown = null;

  try {
    userAId = await signIn(userAClient, "A");
    userBId = await signIn(userBClient, "B");
    assert.notEqual(userAId, userBId, "Dedicated test users must be distinct.");

    const categoryA1 = { id: crypto.randomUUID(), userId: userAId, name: `${prefix}-a-primary`, owner: "A" as const };
    const categoryA2 = { id: crypto.randomUUID(), userId: userAId, name: `${prefix}-a-secondary`, owner: "A" as const };
    const categoryAIncome = { id: crypto.randomUUID(), userId: userAId, name: `${prefix}-a-income`, owner: "A" as const };
    const categoryB = { id: crypto.randomUUID(), userId: userBId, name: `${prefix}-b-primary`, owner: "B" as const };
    for (const fixture of [categoryA1, categoryA2, categoryAIncome, categoryB]) registerCategory(categories, fixture, prefix);

    await suite.test("owners create and read isolated categories", async () => {
      for (const [testClient, fixture, type] of [
        [userAClient, categoryA1, "expense"], [userAClient, categoryA2, "expense"],
        [userAClient, categoryAIncome, "income"], [userBClient, categoryB, "expense"],
      ] as const) {
        const response = await testClient.from("categories").insert({ id: fixture.id, user_id: fixture.userId, name: fixture.name, type, icon_key: "test-tube", color_token: "green" }).select("id,user_id,name,type").single();
        expectNoError(response.error);
        assert.equal(response.data?.id, fixture.id);
      }
      const hidden = await userBClient.from("categories").select("id").eq("id", categoryA1.id).eq("user_id", userAId!);
      expectNoError(hidden.error);
      expectEmpty(hidden.data);
    });

    await suite.test("owner edits archives restores and cannot physically delete a category", async () => {
      const editedName = `${prefix}-a-primary-edited`;
      categoryA1.name = editedName;
      const edited = await userAClient.from("categories").update({ name: editedName, icon_key: "wallet", color_token: "blue" }).eq("id", categoryA1.id).eq("user_id", userAId!).select("id,name").single();
      expectNoError(edited.error);
      assert.equal(edited.data?.name, editedName);
      const archivedAt = new Date().toISOString();
      const archived = await userAClient.from("categories").update({ archived_at: archivedAt }).eq("id", categoryA1.id).eq("user_id", userAId!).select("archived_at").single();
      expectNoError(archived.error);
      assertSameInstant(archived.data?.archived_at, archivedAt);
      const restored = await userAClient.from("categories").update({ archived_at: null }).eq("id", categoryA1.id).eq("user_id", userAId!).select("archived_at").single();
      expectNoError(restored.error);
      assert.equal(restored.data?.archived_at, null);
      const denied = await userAClient.from("categories").delete().eq("id", categoryA1.id).eq("user_id", userAId!).select("id");
      expectCode(denied.error, "42501");
    });

    const linkedTransaction = { id: crypto.randomUUID(), userId: userAId, description: `${prefix}-linked-transaction`, owner: "A" as const };
    const legacyTransaction = { id: crypto.randomUUID(), userId: userAId, description: `${prefix}-legacy-transaction`, owner: "A" as const };
    const userBTransaction = { id: crypto.randomUUID(), userId: userBId, description: `${prefix}-b-transaction`, owner: "B" as const };
    const rejectedCrossOwner = { id: crypto.randomUUID(), userId: userAId, description: `${prefix}-rejected-cross-owner`, owner: "A" as const };
    const rejectedType = { id: crypto.randomUUID(), userId: userAId, description: `${prefix}-rejected-type`, owner: "A" as const };
    for (const fixture of [linkedTransaction, legacyTransaction, userBTransaction, rejectedCrossOwner, rejectedType]) registerTransaction(transactions, fixture, prefix);

    const transactionRow = (fixture: RegisteredTransaction, categoryId: string | null, type: "income" | "expense" = "expense"): TablesInsert<"transactions"> => ({
      id: fixture.id, user_id: fixture.userId, description: fixture.description, category: `${prefix}-legacy-category`, category_color: "#64707D",
      category_id: categoryId, payment: "Card", date: "12 September 2026", date_iso: "2026-09-12", origin: "Isolated remote test", type, amount: 10,
    });

    await suite.test("active same-owner same-type category derives transaction snapshots", async () => {
      const response = await userAClient.from("transactions").insert(transactionRow(linkedTransaction, categoryA1.id)).select("id,category_id,category_name_snapshot,category_color_snapshot,normalized_category_snapshot").single();
      expectNoError(response.error);
      assert.equal(response.data?.category_id, categoryA1.id);
      assert.equal(response.data?.category_name_snapshot, categoryA1.name);
      assert.equal(response.data?.category_color_snapshot, "blue");
      assert.equal(response.data?.normalized_category_snapshot, categoryA1.name.toLocaleLowerCase());
    });

    await suite.test("transaction reclassifies to another valid category", async () => {
      const response = await userAClient.from("transactions").update({ category_id: categoryA2.id }).eq("id", linkedTransaction.id).eq("user_id", userAId!).select("category_id,category_name_snapshot,category_color_snapshot,normalized_category_snapshot").single();
      expectNoError(response.error);
      assert.equal(response.data?.category_id, categoryA2.id);
      assert.equal(response.data?.category_name_snapshot, categoryA2.name);
      assert.equal(response.data?.category_color_snapshot, "green");
      assert.equal(response.data?.normalized_category_snapshot, categoryA2.name.toLocaleLowerCase());
    });

    await suite.test("linked transaction remains editable after category archival", async () => {
      const archived = await userAClient.from("categories").update({ archived_at: new Date().toISOString() }).eq("id", categoryA2.id).eq("user_id", userAId!).select("id").single();
      expectNoError(archived.error);
      const response = await userAClient.from("transactions").update({ amount: 11 }).eq("id", linkedTransaction.id).eq("user_id", userAId!).select("amount,category_id,category_name_snapshot").single();
      expectNoError(response.error);
      assert.equal(response.data?.amount, 11);
      assert.equal(response.data?.category_id, categoryA2.id);
      assert.equal(response.data?.category_name_snapshot, categoryA2.name);
      const restored = await userAClient.from("categories").update({ archived_at: null }).eq("id", categoryA2.id).eq("user_id", userAId!).select("id").single();
      expectNoError(restored.error);
    });

    await suite.test("unlink clears all category snapshots", async () => {
      const response = await userAClient.from("transactions").update({ category_id: null }).eq("id", linkedTransaction.id).eq("user_id", userAId!).select("category_id,category_name_snapshot,category_color_snapshot,normalized_category_snapshot").single();
      expectNoError(response.error);
      assert.deepEqual(response.data, { category_id: null, category_name_snapshot: null, category_color_snapshot: null, normalized_category_snapshot: null });
    });

    await suite.test("unrelated legacy transaction update preserves historical classification", async () => {
      const created = await userAClient.from("transactions").insert(transactionRow(legacyTransaction, null)).select("category_id,category_name_snapshot,category_color_snapshot,normalized_category_snapshot").single();
      expectNoError(created.error);
      const original = created.data;
      assert.equal(original?.category_id, null);
      assert.equal(original?.category_name_snapshot, `${prefix}-legacy-category`);
      const updated = await userAClient.from("transactions").update({ amount: 12 }).eq("id", legacyTransaction.id).eq("user_id", userAId!).select("category_id,category_name_snapshot,category_color_snapshot,normalized_category_snapshot").single();
      expectNoError(updated.error);
      assert.deepEqual(updated.data, original);
    });

    await suite.test("cross-owner and incompatible-type category assignments are rejected", async () => {
      const crossOwner = await userAClient.from("transactions").insert(transactionRow(rejectedCrossOwner, categoryB.id));
      expectCode(crossOwner.error, ["23503", "23514"]);
      const incompatible = await userAClient.from("transactions").insert(transactionRow(rejectedType, categoryAIncome.id, "expense"));
      expectCode(incompatible.error, ["23503", "23514"]);
    });

    await suite.test("users cannot read or alter another user's categories or transactions", async () => {
      const created = await userBClient.from("transactions").insert(transactionRow(userBTransaction, categoryB.id)).select("id").single();
      expectNoError(created.error);
      const categoryRead = await userBClient.from("categories").select("id").eq("id", categoryA1.id).eq("user_id", userAId!);
      expectNoError(categoryRead.error);
      expectEmpty(categoryRead.data);
      const categoryUpdate = await userBClient.from("categories").update({ name: `${prefix}-forbidden-category-update` }).eq("id", categoryA1.id).eq("user_id", userAId!).select("id");
      expectNoError(categoryUpdate.error);
      expectEmpty(categoryUpdate.data);
      const transactionRead = await userBClient.from("transactions").select("id").eq("id", linkedTransaction.id).eq("user_id", userAId!);
      expectNoError(transactionRead.error);
      expectEmpty(transactionRead.data);
      const transactionUpdate = await userBClient.from("transactions").update({ amount: 99 }).eq("id", linkedTransaction.id).eq("user_id", userAId!).select("id");
      expectNoError(transactionUpdate.error);
      expectEmpty(transactionUpdate.data);
    });
  } catch (error) {
    testFailure = error;
  } finally {
    const failures: CleanupFailure[] = [];
    for (const fixture of transactions.values()) {
      try {
        await cleanupTransaction(admin, fixture, transactions, prefix);
      } catch (error) {
        failures.push(cleanupFailure("transaction", fixture.owner, "cleanup", error));
      }
    }
    for (const fixture of categories.values()) {
      try {
        await cleanupCategory(admin, fixture, categories, prefix);
      } catch (error) {
        failures.push(cleanupFailure("category", fixture.owner, "cleanup", error));
      }
    }
    await verifyCleanup(admin, categories, transactions, failures);
    await Promise.all([userAClient.auth.signOut({ scope: "local" }), userBClient.auth.signOut({ scope: "local" })]);

    if (failures.length > 0) {
      const cleanupErrors = failures.map(({ fixture, owner, phase, status, code }) =>
        new Error(`${phase} failed for an exact ${fixture} fixture owned by logical user ${owner} (HTTP ${status ?? "unknown"}; code ${code ?? "unknown"}).`),
      );
      throw new AggregateError(testFailure ? [testFailure, ...cleanupErrors] : cleanupErrors, "Isolated remote tests did not complete verified cleanup.");
    }
  }
  if (testFailure) throw testFailure;
});
