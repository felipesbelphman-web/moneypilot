import assert from "node:assert/strict";
import { test } from "node:test";
import { createClient, type AuthError, type PostgrestError, type SupabaseClient } from "@supabase/supabase-js";
import type { Database, TablesInsert } from "../../../src/lib/supabase/database.types.ts";

type TestError = AuthError | PostgrestError | null;
type TestClient = SupabaseClient<Database>;
type LogicalUser = "A" | "B";

type CleanupFailure = {
  fixture: string;
  user: LogicalUser;
  phase: "cleanup" | "verification";
};

type EnvironmentName =
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
  | "SUPABASE_TEST_USER_A_EMAIL"
  | "SUPABASE_TEST_USER_A_PASSWORD"
  | "SUPABASE_TEST_USER_B_EMAIL"
  | "SUPABASE_TEST_USER_B_PASSWORD";

function environment(name: EnvironmentName) {
  const value = process.env[name];
  if (!value) throw new Error(`RLS integration tests blocked: missing ${name}.`);
  return value;
}

function client() {
  return createClient<Database>(environment("NEXT_PUBLIC_SUPABASE_URL"), environment("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });
}

function expectCode(error: TestError, expected: string) {
  assert.ok(error, `Expected sanitized error code ${expected}.`);
  assert.equal(error.code, expected, `Expected sanitized error code ${expected}.`);
}

function expectNoError(error: TestError) {
  if (error) throw new Error(`Unexpected sanitized error code ${error.code ?? "unknown"}.`);
}

function expectEmpty(data: unknown[] | null) {
  if (!data || data.length !== 0) throw new Error("Expected an empty RLS-filtered result.");
}

async function signIn(testClient: TestClient, emailName: "SUPABASE_TEST_USER_A_EMAIL" | "SUPABASE_TEST_USER_B_EMAIL", passwordName: "SUPABASE_TEST_USER_A_PASSWORD" | "SUPABASE_TEST_USER_B_PASSWORD") {
  const response = await testClient.auth.signInWithPassword({ email: environment(emailName), password: environment(passwordName) });
  if (response.error || !response.data.user || !response.data.session) {
    throw new Error(`Dedicated test account authentication failed (${response.error?.code ?? "no_session"}).`);
  }
  return response.data.user.id;
}

async function confirmInitialAccountBalanceAbsent(testClient: TestClient, userId: string, user: LogicalUser) {
  const response = await testClient
    .from("account_balance_settings")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  expectNoError(response.error);
  if (response.data) {
    throw new Error(`RLS integration tests blocked: dedicated test account ${user} is not empty; choose an empty dedicated test account.`);
  }
}

async function putOwnAccountBalanceSetting(testClient: TestClient, userId: string, openingBalance = 91001.1234, openingDate = "2099-12-01") {
  const response = await testClient
    .from("account_balance_settings")
    .upsert({ user_id: userId, opening_balance: openingBalance, opening_date: openingDate }, { onConflict: "user_id" });
  expectNoError(response.error);
}

async function confirmOwnAccountBalancePresent(testClient: TestClient, userId: string) {
  const response = await testClient.from("account_balance_settings").select("user_id").eq("user_id", userId).single();
  expectNoError(response.error);
  assert.ok(response.data, "Expected the dedicated account balance fixture.");
}

async function removeOwnAccountBalanceSetting(testClient: TestClient, userId: string) {
  const response = await testClient.from("account_balance_settings").delete().eq("user_id", userId);
  expectNoError(response.error);
}

async function confirmOwnAccountBalanceAbsent(testClient: TestClient, userId: string) {
  const response = await testClient.from("account_balance_settings").select("user_id").eq("user_id", userId);
  expectNoError(response.error);
  expectEmpty(response.data);
}

async function attemptCleanup(
  failures: CleanupFailure[],
  fixture: string,
  user: LogicalUser,
  operation: () => Promise<void>,
) {
  try {
    await operation();
  } catch {
    failures.push({ fixture, user, phase: "cleanup" });
  }
}

async function attemptVerification(
  failures: CleanupFailure[],
  fixture: string,
  user: LogicalUser,
  operation: () => Promise<void>,
) {
  try {
    await operation();
  } catch {
    failures.push({ fixture, user, phase: "verification" });
  }
}

test("remote ownership, RLS and financial integrity", async (suite) => {
  const anonymous = client();
  const userAClient = client();
  const userBClient = client();
  const prefix = `moneypilot-rls-${crypto.randomUUID()}`;
  const transactionId = `${prefix}-transaction`;
  const budgetId = `${prefix}-budget`;
  const goalId = `${prefix}-goal`;
  const investmentId = `${prefix}-investment`;
  let userAId: string | null = null;
  let userBId: string | null = null;
  let balanceMutationsAuthorized = false;
  let testFailure: unknown = null;

  try {
    await suite.test("invalid authentication is rejected [expected: invalid_credentials]", async () => {
      const response = await anonymous.auth.signInWithPassword({ email: "invalid-login@moneypilot.invalid", password: `${prefix}-invalid-password` });
      assert.equal(response.data.session, null);
      assert.ok(response.error);
      assert.equal(response.error.code, "invalid_credentials");
    });

    await suite.test("anonymous financial reads are denied or empty [expected: 42501 or zero rows]", async () => {
      const reads = [
        anonymous.from("transactions").select("id").limit(1),
        anonymous.from("budgets").select("id").limit(1),
        anonymous.from("budget_adjustments").select("month").limit(1),
        anonymous.from("goals").select("id").limit(1),
        anonymous.from("goal_contribution_plans").select("goal_id").limit(1),
        anonymous.from("investments").select("id").limit(1),
        anonymous.from("account_balance_settings").select("opening_balance").limit(1),
      ];
      for (const pendingRead of reads) {
        const response = await pendingRead;
        if (response.error) assert.equal(response.error.code, "42501");
        else expectEmpty(response.data);
      }
    });

    userAId = await signIn(userAClient, "SUPABASE_TEST_USER_A_EMAIL", "SUPABASE_TEST_USER_A_PASSWORD");
    userBId = await signIn(userBClient, "SUPABASE_TEST_USER_B_EMAIL", "SUPABASE_TEST_USER_B_PASSWORD");
    assert.ok(userAId !== userBId, "Dedicated test accounts must be different.");

    await Promise.all([
      confirmInitialAccountBalanceAbsent(userAClient, userAId, "A"),
      confirmInitialAccountBalanceAbsent(userBClient, userBId, "B"),
    ]);
    balanceMutationsAuthorized = true;

    const balanceSetting: TablesInsert<"account_balance_settings"> = {
      user_id: userAId,
      opening_balance: 91001.1234,
      opening_date: "2099-12-01",
    };

    const transaction: TablesInsert<"transactions"> = {
      user_id: userAId, id: transactionId, description: `${prefix}-description`, category: `${prefix}-category`,
      category_color: "#64707D", payment: "Card", date: "8 September 2026", date_iso: "2026-09-08",
      origin: "RLS integration test", type: "expense", amount: 10,
    };
    const investment: TablesInsert<"investments"> = {
      user_id: userAId,
      id: investmentId,
      name: `${prefix}-investment-name`,
      symbol: `${prefix}-symbol`,
      asset_type: "stock",
      quantity: 2,
      average_purchase_price: 10,
      price_mode: "manual",
      manual_current_price: 11,
      market_asset_key: null,
      native_currency: "EUR",
    };

    await suite.test("user A creates, reads and updates own transaction", async () => {
      const created = await userAClient.from("transactions").insert(transaction).select("id").single();
      expectNoError(created.error);
      assert.ok(created.data?.id === transactionId, "Expected the dedicated test transaction.");

      const read = await userAClient.from("transactions").select("id,amount").eq("user_id", userAId!).eq("id", transactionId).single();
      expectNoError(read.error);
      assert.ok(read.data?.amount === 10, "Expected the original test amount.");

      const updated = await userAClient.from("transactions").update({ amount: 11 }).eq("user_id", userAId!).eq("id", transactionId).select("id,amount").single();
      expectNoError(updated.error);
      assert.ok(updated.data?.amount === 11, "Expected the updated test amount.");
    });

    await suite.test("user B cannot view user A transaction", async () => {
      const response = await userBClient.from("transactions").select("id").eq("user_id", userAId!).eq("id", transactionId);
      expectNoError(response.error);
      expectEmpty(response.data);
    });

    await suite.test("user B cannot update or delete user A transaction", async () => {
      const updated = await userBClient.from("transactions").update({ amount: 12 }).eq("user_id", userAId!).eq("id", transactionId).select("id");
      expectNoError(updated.error);
      expectEmpty(updated.data);
      const deleted = await userBClient.from("transactions").delete().eq("user_id", userAId!).eq("id", transactionId).select("id");
      expectNoError(deleted.error);
      expectEmpty(deleted.data);
    });

    await suite.test("user A cannot forge user B ownership [expected: 42501]", async () => {
      const response = await userAClient.from("transactions").insert({ ...transaction, id: `${prefix}-forged`, user_id: userBId! });
      expectCode(response.error, "42501");
    });

    await suite.test("transaction amount must be positive [expected: 23514]", async () => {
      for (const amount of [0, -1]) {
        const response = await userAClient.from("transactions").insert({ ...transaction, id: `${prefix}-amount-${amount}`, amount });
        expectCode(response.error, "23514");
      }
    });

    await suite.test("transaction payment cannot be blank [expected: 23514]", async () => {
      const response = await userAClient.from("transactions").insert({ ...transaction, id: `${prefix}-blank-payment`, payment: "   " });
      expectCode(response.error, "23514");
    });

    await suite.test("required transaction text cannot be blank [expected: 23514]", async () => {
      const response = await userAClient.from("transactions").insert({ ...transaction, id: `${prefix}-blank-description`, description: "   " });
      expectCode(response.error, "23514");
    });

    await suite.test("normalized duplicate budget is rejected [expected: 23505]", async () => {
      const budget: TablesInsert<"budgets"> = { user_id: userAId!, id: budgetId, category: `${prefix}-Food`, subtitle: `${prefix}-subtitle`, budget: 100, month: "2026-09", color: "#64707D" };
      const first = await userAClient.from("budgets").insert(budget);
      expectNoError(first.error);
      const duplicate = await userAClient.from("budgets").insert({ ...budget, id: `${prefix}-budget-duplicate`, category: `  ${prefix}-food  ` });
      expectCode(duplicate.error, "23505");
    });

    await suite.test("second primary goal is rejected [expected: 23505]", async () => {
      const goal: TablesInsert<"goals"> = { user_id: userAId!, id: goalId, name: `${prefix}-goal`, target_amount: 1000, saved_amount: 100, target_date: "2027-09", priority: "primary" };
      const first = await userAClient.from("goals").insert(goal);
      expectNoError(first.error);
      const duplicate = await userAClient.from("goals").insert({ ...goal, id: `${prefix}-goal-primary-duplicate`, name: `${prefix}-second-goal` });
      expectCode(duplicate.error, "23505");
    });

    await suite.test("goal saved amount cannot exceed target [expected: 23514]", async () => {
      const response = await userAClient.from("goals").insert({ user_id: userAId!, id: `${prefix}-goal-invalid`, name: `${prefix}-invalid-goal`, target_amount: 100, saved_amount: 101, target_date: "2027-09", priority: "secondary" });
      expectCode(response.error, "23514");
    });

    await suite.test("contribution plan ownership follows its goal", async () => {
      const ownPlan: TablesInsert<"goal_contribution_plans"> = { user_id: userAId!, goal_id: goalId, monthly_target: 100, baseline_required_monthly_contribution: 80, savings_boost: 20 };
      const created = await userAClient.from("goal_contribution_plans").insert(ownPlan).select("goal_id").single();
      expectNoError(created.error);
      assert.ok(created.data?.goal_id === goalId, "Expected the dedicated test contribution plan.");
      const crossOwner = await userBClient.from("goal_contribution_plans").insert({ ...ownPlan, user_id: userBId! });
      expectCode(crossOwner.error, "23503");
    });

    await suite.test("RLS remains active after constraint errors", async () => {
      const hidden = await userBClient.from("transactions").select("id").eq("user_id", userAId!).eq("id", transactionId);
      expectNoError(hidden.error);
      expectEmpty(hidden.data);
      const visible = await userAClient.from("transactions").select("id").eq("user_id", userAId!).eq("id", transactionId).single();
      expectNoError(visible.error);
    });

    await suite.test("user A creates and reads own investment", async () => {
      const created = await userAClient.from("investments").insert(investment).select("id").single();
      expectNoError(created.error);
      assert.equal(created.data?.id, investmentId);
      const read = await userAClient.from("investments").select("id").eq("user_id", userAId!).eq("id", investmentId).single();
      expectNoError(read.error);
      assert.equal(read.data?.id, investmentId);
    });

    await suite.test("user B cannot view user A investment", async () => {
      const response = await userBClient.from("investments").select("id").eq("user_id", userAId!).eq("id", investmentId);
      expectNoError(response.error);
      expectEmpty(response.data);
    });

    await suite.test("user B cannot update or delete user A investment", async () => {
      const updated = await userBClient.from("investments").update({ quantity: 3 }).eq("user_id", userAId!).eq("id", investmentId).select("id");
      expectNoError(updated.error);
      expectEmpty(updated.data);
      const deleted = await userBClient.from("investments").delete().eq("user_id", userAId!).eq("id", investmentId).select("id");
      expectNoError(deleted.error);
      expectEmpty(deleted.data);
    });

    await suite.test("user A cannot forge investment ownership [expected: 42501]", async () => {
      const response = await userAClient.from("investments").insert({ ...investment, id: `${prefix}-investment-forged`, user_id: userBId! });
      expectCode(response.error, "42501");
    });

    await suite.test("investment quantity and prices must be positive [expected: 23514]", async () => {
      const invalidRows: Array<TablesInsert<"investments">> = [
        { ...investment, id: `${prefix}-investment-quantity`, quantity: 0 },
        { ...investment, id: `${prefix}-investment-average-price`, average_purchase_price: 0 },
        { ...investment, id: `${prefix}-investment-current-price`, manual_current_price: 0 },
      ];
      for (const row of invalidRows) {
        const response = await userAClient.from("investments").insert(row);
        expectCode(response.error, "23514");
      }
    });

    await suite.test("invalid investment price mode fields are rejected [expected: 23514]", async () => {
      const response = await userAClient.from("investments").insert({
        ...investment,
        id: `${prefix}-investment-price-mode`,
        price_mode: "automatic",
        manual_current_price: 11,
        market_asset_key: crypto.randomUUID(),
      });
      expectCode(response.error, "23514");
    });

    await suite.test("user A deletes own transaction", async () => {
      const response = await userAClient.from("transactions").delete().eq("user_id", userAId!).eq("id", transactionId).select("id").single();
      expectNoError(response.error);
      assert.ok(response.data?.id === transactionId, "Expected deletion of the dedicated test transaction.");
    });

    await suite.test("user A upserts own account balance setting", async () => {
      await putOwnAccountBalanceSetting(userAClient, userAId!);
      const response = await userAClient.from("account_balance_settings").upsert(balanceSetting, { onConflict: "user_id" }).select("opening_balance").single();
      expectNoError(response.error);
      assert.equal(response.data?.opening_balance, 91001.1234);
    });

    await suite.test("user A reads own account balance setting", async () => {
      await putOwnAccountBalanceSetting(userAClient, userAId!);
      const response = await userAClient.from("account_balance_settings").select("opening_balance,opening_date").eq("user_id", userAId!).single();
      expectNoError(response.error);
      assert.equal(response.data?.opening_date, "2099-12-01");
    });

    await suite.test("user A updates own account balance setting", async () => {
      await putOwnAccountBalanceSetting(userAClient, userAId!);
      const response = await userAClient.from("account_balance_settings").update({ opening_balance: 91002.1234 }).eq("user_id", userAId!).select("opening_balance").single();
      expectNoError(response.error);
      assert.equal(response.data?.opening_balance, 91002.1234);
    });

    await suite.test("user B cannot view user A account balance setting", async () => {
      await putOwnAccountBalanceSetting(userAClient, userAId!);
      const response = await userBClient.from("account_balance_settings").select("opening_balance").eq("user_id", userAId!);
      expectNoError(response.error);
      expectEmpty(response.data);
    });

    await suite.test("user B cannot update user A account balance setting", async () => {
      await putOwnAccountBalanceSetting(userAClient, userAId!);
      const response = await userBClient.from("account_balance_settings").update({ opening_balance: 92001 }).eq("user_id", userAId!).select("opening_balance");
      expectNoError(response.error);
      expectEmpty(response.data);
    });

    await suite.test("user B cannot delete user A account balance setting", async () => {
      await putOwnAccountBalanceSetting(userAClient, userAId!);
      const response = await userBClient.from("account_balance_settings").delete().eq("user_id", userAId!).select("user_id");
      expectNoError(response.error);
      expectEmpty(response.data);
    });

    await suite.test("user A cannot forge user B account balance ownership [expected: 42501]", async () => {
      await putOwnAccountBalanceSetting(userAClient, userAId!);
      await confirmOwnAccountBalanceAbsent(userBClient, userBId!);
      const response = await userAClient.from("account_balance_settings").upsert({ ...balanceSetting, user_id: userBId! }, { onConflict: "user_id" });
      expectCode(response.error, "42501");
      await confirmOwnAccountBalanceAbsent(userBClient, userBId!);
    });

    await suite.test("account balance setting accepts zero", async () => {
      await putOwnAccountBalanceSetting(userAClient, userAId!, 0);
      const response = await userAClient.from("account_balance_settings").update({ opening_balance: 0 }).eq("user_id", userAId!).select("opening_balance").single();
      expectNoError(response.error);
      assert.equal(response.data?.opening_balance, 0);
    });

    await suite.test("account balance setting accepts a negative value", async () => {
      await putOwnAccountBalanceSetting(userAClient, userAId!, -91003.1234);
      const response = await userAClient.from("account_balance_settings").update({ opening_balance: -91003.1234 }).eq("user_id", userAId!).select("opening_balance").single();
      expectNoError(response.error);
      assert.equal(response.data?.opening_balance, -91003.1234);
    });

    await suite.test("account balance upsert preserves one setting per user", async () => {
      await putOwnAccountBalanceSetting(userAClient, userAId!);
      const upserted = await userAClient.from("account_balance_settings").upsert({ ...balanceSetting, opening_balance: 91004.1234 }, { onConflict: "user_id" });
      expectNoError(upserted.error);
      const response = await userAClient.from("account_balance_settings").select("user_id").eq("user_id", userAId!);
      expectNoError(response.error);
      assert.equal(response.data?.length, 1);
    });

    await suite.test("account balance RLS remains active after ownership and constraint errors", async () => {
      await putOwnAccountBalanceSetting(userAClient, userAId!);
      const invalid = await userAClient.from("account_balance_settings").update({ opening_date: "2026-02-30" }).eq("user_id", userAId!);
      assert.ok(invalid.error, "Expected an invalid civil date to be rejected.");
      const hidden = await userBClient.from("account_balance_settings").select("user_id").eq("user_id", userAId!);
      expectNoError(hidden.error);
      expectEmpty(hidden.data);
      const visible = await userAClient.from("account_balance_settings").select("user_id").eq("user_id", userAId!).single();
      expectNoError(visible.error);
      await putOwnAccountBalanceSetting(userAClient, userAId!, 91005.1234);
      await confirmOwnAccountBalancePresent(userAClient, userAId!);
    });

    await suite.test("user A deletes own account balance setting", async () => {
      await putOwnAccountBalanceSetting(userAClient, userAId!);
      const response = await userAClient.from("account_balance_settings").delete().eq("user_id", userAId!).select("user_id").single();
      expectNoError(response.error);
      assert.equal(response.data?.user_id, userAId);
      await confirmOwnAccountBalanceAbsent(userAClient, userAId!);
    });
  } catch (error) {
    testFailure = error;
  } finally {
    const failures: CleanupFailure[] = [];
    const cleanupUser = async (testClient: TestClient, userId: string, user: LogicalUser) => {
      if (balanceMutationsAuthorized) {
        await attemptCleanup(failures, "account_balance_settings", user, () => removeOwnAccountBalanceSetting(testClient, userId));
      }
      await attemptCleanup(failures, "goal_contribution_plans", user, async () => {
        const response = await testClient.from("goal_contribution_plans").delete().eq("user_id", userId).like("goal_id", `${prefix}%`);
        expectNoError(response.error);
      });
      await Promise.all([
        attemptCleanup(failures, "investments", user, async () => {
          const response = await testClient.from("investments").delete().eq("user_id", userId).like("id", `${prefix}%`);
          expectNoError(response.error);
        }),
        attemptCleanup(failures, "goals", user, async () => {
          const response = await testClient.from("goals").delete().eq("user_id", userId).like("id", `${prefix}%`);
          expectNoError(response.error);
        }),
        attemptCleanup(failures, "budgets", user, async () => {
          const response = await testClient.from("budgets").delete().eq("user_id", userId).like("id", `${prefix}%`);
          expectNoError(response.error);
        }),
        attemptCleanup(failures, "transactions", user, async () => {
          const response = await testClient.from("transactions").delete().eq("user_id", userId).like("id", `${prefix}%`);
          expectNoError(response.error);
        }),
      ]);
    };

    await Promise.all([
      ...(balanceMutationsAuthorized && userAId ? [cleanupUser(userAClient, userAId, "A")] : []),
      ...(balanceMutationsAuthorized && userBId ? [cleanupUser(userBClient, userBId, "B")] : []),
    ]);

    const verifyUser = async (testClient: TestClient, userId: string, user: LogicalUser) => {
      await Promise.all([
        ...(balanceMutationsAuthorized
          ? [attemptVerification(failures, "account_balance_settings", user, () => confirmOwnAccountBalanceAbsent(testClient, userId))]
          : []),
        ...(["transactions", "investments", "budgets", "goals"] as const).map((fixture) =>
          attemptVerification(failures, fixture, user, async () => {
            const response = await testClient.from(fixture).select("id").eq("user_id", userId).like("id", `${prefix}%`);
            expectNoError(response.error);
            expectEmpty(response.data);
          }),
        ),
        attemptVerification(failures, "goal_contribution_plans", user, async () => {
          const response = await testClient.from("goal_contribution_plans").select("goal_id").eq("user_id", userId).like("goal_id", `${prefix}%`);
          expectNoError(response.error);
          expectEmpty(response.data);
        }),
      ]);
    };

    await Promise.all([
      ...(balanceMutationsAuthorized && userAId ? [verifyUser(userAClient, userAId, "A")] : []),
      ...(balanceMutationsAuthorized && userBId ? [verifyUser(userBClient, userBId, "B")] : []),
    ]);
    await Promise.all([
      attemptCleanup(failures, "local session", "A", async () => {
        const response = await userAClient.auth.signOut({ scope: "local" });
        expectNoError(response.error);
      }),
      attemptCleanup(failures, "local session", "B", async () => {
        const response = await userBClient.auth.signOut({ scope: "local" });
        expectNoError(response.error);
      }),
    ]);

    const cleanupErrors = failures.map(
      ({ fixture, user, phase }) => new Error(`${phase} failed for ${fixture} fixture owned by logical user ${user}.`),
    );
    if (testFailure && cleanupErrors.length > 0) {
      throw new AggregateError(
        [testFailure, ...cleanupErrors],
        "Remote RLS tests failed and fixture cleanup or post-cleanup verification also failed.",
      );
    }
    if (cleanupErrors.length > 0) {
      throw new AggregateError(cleanupErrors, "Remote RLS fixture cleanup or post-cleanup verification failed.");
    }
  }
  if (testFailure) throw testFailure;
});
