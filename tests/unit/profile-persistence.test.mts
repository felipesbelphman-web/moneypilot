import assert from "node:assert/strict";
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

const {
  ProfileError,
  mapProfilePersistenceError,
  profileRowToUserProfile,
  settleProfilePreferenceLoad,
} = await import("../../src/lib/auth/profile-contract.ts");
const { ProfileRepository, profileProjection } = await import("../../src/lib/auth/profile-repository.ts");

const profileRow = {
  id: "authenticated-user",
  display_name: null,
  locale: "pt",
  currency_code: "EUR",
  has_seen_welcome: true,
  created_at: "2026-09-01T00:00:00Z",
  updated_at: "2026-09-02T00:00:00Z",
  avatar_mode: "initials",
  avatar_path: null,
};

type Response = { data: unknown; error: { code?: string; message?: string } | null; count?: number | null };

function createFakeClient(options: {
  profile?: Response;
  counts?: Partial<Record<string, number>>;
  balanceExists?: boolean;
  errorTable?: string;
} = {}) {
  const calls: Array<{ table: string; method: string; args: readonly unknown[] }> = [];
  const profile = options.profile ?? { data: profileRow, error: null };
  let pendingProfileUpdate: Record<string, unknown> = {};

  function responseFor(table: string): Response {
    if (options.errorTable === table) return { data: null, error: { code: "FETCH_ERROR", message: "private remote detail" } };
    if (table === "profiles") {
      return profile.data && typeof profile.data === "object"
        ? { ...profile, data: { ...profile.data, ...pendingProfileUpdate } }
        : profile;
    }
    if (table === "account_balance_settings") {
      return { data: options.balanceExists ? [{ user_id: "authenticated-user" }] : [], error: null };
    }
    return { data: null, error: null, count: options.counts?.[table] ?? 0 };
  }

  const client = {
    from(table: string) {
      calls.push({ table, method: "from", args: [table] });
      const query = {
        select(...args: readonly unknown[]) { calls.push({ table, method: "select", args }); return query; },
        update(...args: readonly unknown[]) {
          calls.push({ table, method: "update", args });
          if (table === "profiles" && typeof args[0] === "object" && args[0] !== null) pendingProfileUpdate = args[0] as Record<string, unknown>;
          return query;
        },
        eq(...args: readonly unknown[]) { calls.push({ table, method: "eq", args }); return query; },
        limit(...args: readonly unknown[]) { calls.push({ table, method: "limit", args }); return query; },
        single() { calls.push({ table, method: "single", args: [] }); return Promise.resolve(responseFor(table)); },
        then(resolve: (value: Response) => unknown, reject?: (reason: unknown) => unknown) {
          return Promise.resolve(responseFor(table)).then(resolve, reject);
        },
      };
      return query;
    },
  };

  const repository = Reflect.construct(ProfileRepository, [client]) as InstanceType<typeof ProfileRepository>;
  return { repository, calls };
}

test("maps an official ProfileRow to the stable public profile contract", () => {
  const mapped = profileRowToUserProfile(profileRow);
  assert.deepEqual(mapped, profileRow);
  assert.notEqual(mapped, profileRow);
});

test("preserves nullable profile fields", () => {
  const mapped = profileRowToUserProfile({ ...profileRow, display_name: null, avatar_path: null });
  assert.equal(mapped.display_name, null);
  assert.equal(mapped.avatar_path, null);
});

test("accepts canonical language and currency values", () => {
  const mapped = profileRowToUserProfile({ ...profileRow, locale: "fr", currency_code: "GBP" });
  assert.equal(mapped.locale, "fr");
  assert.equal(mapped.currency_code, "GBP");
});

for (const invalid of [
  { locale: "invalid" },
  { currency_code: "XYZ" },
  { avatar_mode: "remote-value" },
]) {
  test(`rejects an invalid canonical profile value: ${Object.keys(invalid)[0]}`, () => {
    assert.throws(() => profileRowToUserProfile({ ...profileRow, ...invalid }), (error) => error instanceof ProfileError
      && error.code === "preference_invalid" && error.message === "preference_invalid");
  });
}

test("reads a profile through an explicit projection and maps the row", async () => {
  const { repository, calls } = createFakeClient();
  assert.deepEqual(await repository.getProfile("authenticated-user"), profileRow);
  assert.deepEqual(calls.map(({ method, args }) => ({ method, args })), [
    { method: "from", args: ["profiles"] },
    { method: "select", args: [profileProjection] },
    { method: "eq", args: ["id", "authenticated-user"] },
    { method: "single", args: [] },
  ]);
});

test("distinguishes a missing profile from authentication absence", async () => {
  const { repository } = createFakeClient({ profile: { data: null, error: { code: "PGRST116" } } });
  await assert.rejects(repository.getProfile("authenticated-user"), (error) => error instanceof ProfileError && error.code === "profile_not_found");
});

test("rejects an unauthenticated repository call before querying persistence", async () => {
  const { repository, calls } = createFakeClient();
  await assert.rejects(repository.getProfile(""), (error) => error instanceof ProfileError && error.code === "authentication_required");
  assert.equal(calls.length, 0);
});

test("sanitizes Supabase profile read errors", async () => {
  const { repository } = createFakeClient({ profile: { data: null, error: { code: "FETCH_ERROR", message: "private URL and query" } } });
  await assert.rejects(repository.getProfile("authenticated-user"), (error) => error instanceof ProfileError
    && error.code === "persistence_unavailable" && !error.message.includes("private"));
});

test("updates with ProfileUpdate, authenticated ownership, explicit projection and single confirmation", async () => {
  const { repository, calls } = createFakeClient();
  const confirmed = await repository.updateProfile("authenticated-user", { locale: "pt", currency_code: "EUR" });
  assert.equal(confirmed.id, "authenticated-user");
  assert.deepEqual(calls.map(({ method, args }) => ({ method, args })), [
    { method: "from", args: ["profiles"] },
    { method: "update", args: [{ locale: "pt", currency_code: "EUR" }] },
    { method: "eq", args: ["id", "authenticated-user"] },
    { method: "select", args: [profileProjection] },
    { method: "single", args: [] },
  ]);
});

test("does not report a zero-row update as success", async () => {
  const { repository } = createFakeClient({ profile: { data: null, error: { code: "PGRST116", message: "private detail" } } });
  await assert.rejects(repository.updateProfile("authenticated-user", { locale: "en" }), (error) => error instanceof ProfileError
    && error.code === "profile_not_found" && !error.message.includes("private"));
});

test("allows a currency change only when every financial resource is empty", async () => {
  const { repository, calls } = createFakeClient();
  const result = await repository.updatePreferences("authenticated-user", "EUR", { locale: "en", currencyCode: "GBP" });
  assert.equal(result.currency_code, "GBP");
  assert.ok(calls.some((call) => call.table === "account_balance_settings" && call.method === "select" && call.args[0] === "user_id"));
  assert.ok(calls.some((call) => call.table === "profiles" && call.method === "update"));
});

test("blocks a currency change when Transactions exist and skips the profile update", async () => {
  const context = createFakeClient({ counts: { transactions: 1 } });
  await assert.rejects(context.repository.updatePreferences("authenticated-user", "EUR", { locale: "pt", currencyCode: "GBP" }),
    (error) => error instanceof ProfileError && error.code === "financial_data_exists");
  assert.equal(context.calls.some((call) => call.table === "profiles" && call.method === "update"), false);
});

for (const balance of [100, -100, 0]) {
  test(`blocks a currency change when account balance settings exist with logical balance ${balance}`, async () => {
    const context = createFakeClient({ balanceExists: true });
    await assert.rejects(context.repository.updatePreferences("authenticated-user", "EUR", { locale: "pt", currencyCode: "GBP" }),
      (error) => error instanceof ProfileError && error.code === "financial_data_exists");
    const balanceSelect = context.calls.find((call) => call.table === "account_balance_settings" && call.method === "select");
    assert.deepEqual(balanceSelect?.args, ["user_id"]);
    assert.equal(context.calls.some((call) => call.table === "profiles" && call.method === "update"), false);
  });
}

test("blocks a currency change safely when the balance existence query fails", async () => {
  const context = createFakeClient({ errorTable: "account_balance_settings" });
  await assert.rejects(context.repository.updatePreferences("authenticated-user", "EUR", { locale: "pt", currencyCode: "GBP" }),
    (error) => error instanceof ProfileError && error.code === "persistence_unavailable" && !error.message.includes("private"));
  assert.equal(context.calls.some((call) => call.table === "profiles" && call.method === "update"), false);
});

test("preserves provider-facing success and distinguishes sanitized technical failure", async () => {
  const success = await settleProfilePreferenceLoad(async () => ({ locale: "pt", currency_code: "EUR" }));
  assert.equal(success.status, "success");
  const failure = await settleProfilePreferenceLoad(async () => { throw new Error("private database detail"); });
  assert.equal(failure.status, "failure");
  if (failure.status === "failure") {
    assert.equal(failure.error.code, "unknown_persistence_error");
    assert.equal(failure.error.message.includes("private"), false);
  }
});

test("maps known conflicts and unknown failures to stable public codes", () => {
  assert.equal(mapProfilePersistenceError({ code: "23505", message: "private" }).code, "conflict");
  assert.equal(mapProfilePersistenceError({ code: "42501", message: "private" }).code, "ownership_denied");
  assert.equal(mapProfilePersistenceError({ code: "OTHER", message: "private" }).code, "unknown_persistence_error");
});
