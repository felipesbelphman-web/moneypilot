import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = new URL(
  "../../supabase/migrations/20260913120000_preserve_legacy_transaction_snapshots.sql",
  import.meta.url,
);
const linkPath = new URL(
  "../../supabase/migrations/20260911120000_link_transactions_categories.sql",
  import.meta.url,
);
const correctionPath = new URL(
  "../../supabase/migrations/20260912120000_fix_transaction_category_unlink_and_grants.sql",
  import.meta.url,
);
const migration = await readFile(migrationPath, "utf8");
const compact = migration.replace(/\s+/g, " ").trim();

test("legacy inserts fill only missing snapshots from required legacy fields", () => {
  assert.match(compact, /if tg_op = 'INSERT' and new\.category_id is null then/);
  assert.match(compact, /if new\.category_name_snapshot is null then new\.category_name_snapshot := new\.category; end if/);
  assert.match(compact, /if new\.category_color_snapshot is null then new\.category_color_snapshot := new\.category_color; end if; return new/);
});

test("linked inserts and reclassifications still derive snapshots from an active owned same-type category", () => {
  assert.match(compact, /category_row\.user_id = new\.user_id/);
  assert.match(compact, /category_row\.id = new\.category_id/);
  assert.match(compact, /category_row\.type = new\.type/);
  assert.match(compact, /category_row\.archived_at is null for share/);
  assert.match(compact, /new\.category_name_snapshot := category_name/);
  assert.match(compact, /new\.category_color_snapshot := category_color/);
});

test("unlinking clears snapshots while already-null updates preserve their prior classification", () => {
  assert.match(compact, /old\.category_id is not null and new\.category_id is null then new\.category_name_snapshot := null; new\.category_color_snapshot := null; return new/);
  assert.match(compact, /old\.category_id is null and new\.category_id is null then new\.category_name_snapshot := old\.category_name_snapshot; new\.category_color_snapshot := old\.category_color_snapshot; return new/);
});

test("unrelated updates to existing links remain valid after category archival", () => {
  assert.match(compact, /new\.user_id is not distinct from old\.user_id/);
  assert.match(compact, /new\.category_id is not distinct from old\.category_id/);
  assert.match(compact, /new\.type is not distinct from old\.type then return new/);
});

test("function security remains invoker-only with an empty search path", () => {
  assert.match(compact, /returns trigger language plpgsql security invoker set search_path = ''/);
  for (const role of ["public", "anon", "authenticated"]) {
    assert.match(compact, new RegExp(`revoke execute on function public\\.validate_transaction_category_assignment\\(\\) from ${role}`));
  }
});

test("migration adds no discriminator backfill grant policy or RLS change", () => {
  assert.doesNotMatch(migration, /category_assignment_kind|add column|alter table/i);
  assert.doesNotMatch(compact, /(?:insert into|update|delete from) public\.transactions/);
  assert.doesNotMatch(compact, /(?:grant|policy|row level security)/);
});

test("previously applied transaction category migrations remain byte-for-byte unchanged", async () => {
  const link = await readFile(linkPath);
  const correction = await readFile(correctionPath);
  assert.equal(createHash("sha256").update(link).digest("hex"), "966dffbc9787c2175cd2454c29ba6efd739a92e7d2311859782cce0f59f5ea08");
  assert.equal(createHash("sha256").update(correction).digest("hex"), "faace6ebc3f9dfa6f6fac004034b8fb52b4003b1df1de1948e8f70f94303f16a");
});
