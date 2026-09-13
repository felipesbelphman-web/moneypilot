import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const migrationUrl = new URL(
  "../../supabase/migrations/20260913130000_restore_service_role_test_cleanup_grants.sql",
  import.meta.url,
);
const migration = (await readFile(migrationUrl, "utf8"))
  .replace(/--.*$/gm, "")
  .replace(/\s+/g, " ")
  .trim()
  .toLowerCase();

test("service role receives only the table privileges needed for exact cleanup", () => {
  assert.match(migration, /grant select, delete on table public\.categories to service_role/);
  assert.match(migration, /grant select, delete on table public\.transactions to service_role/);
  assert.doesNotMatch(migration, /grant (?:all|insert|update|truncate|references|trigger)/);
});

test("cleanup grants do not change client grants, policies, RLS, or functions", () => {
  assert.doesNotMatch(migration, /\b(?:anon|authenticated|policy|row level security|function|procedure)\b/);
});
