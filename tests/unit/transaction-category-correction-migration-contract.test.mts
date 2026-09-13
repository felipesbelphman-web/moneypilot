import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const correctionPath = new URL(
  "../../supabase/migrations/20260912120000_fix_transaction_category_unlink_and_grants.sql",
  import.meta.url,
);
const appliedPath = new URL(
  "../../supabase/migrations/20260911120000_link_transactions_categories.sql",
  import.meta.url,
);
const correction = await readFile(correctionPath, "utf8");
const appliedMigration = await readFile(appliedPath, "utf8");
const compact = correction.replace(/\s+/g, " ").trim();
const compactApplied = appliedMigration.replace(/\s+/g, " ").trim();

test("canonical unlink clears both snapshots and lets the generated snapshot become null", () => {
  assert.match(
    compact,
    /tg_op = 'UPDATE' and old\.category_id is not null and new\.category_id is null then new\.category_name_snapshot := null; new\.category_color_snapshot := null; return new/,
  );
  assert.doesNotMatch(correction, /normalized_category_snapshot\s*:=/);
  assert.match(
    compactApplied,
    /normalized_category_snapshot text generated always as \( lower\(btrim\(normalize\(category_name_snapshot, NFC\)\)\) \) stored/,
  );
});

test("already-unlinked legacy rows and legacy inserts preserve supplied snapshots", () => {
  const unlinkBranch = compact.indexOf("old.category_id is not null");
  const nullReturn = compact.indexOf("if new.category_id is null then return new");
  assert.ok(unlinkBranch >= 0 && nullReturn > unlinkBranch);
  assert.doesNotMatch(
    compact.slice(nullReturn, compact.indexOf("-- Existing historical links", nullReturn)),
    /category_(?:name|color)_snapshot := null/,
  );
});

test("unrelated updates to existing links preserve snapshots without revalidation", () => {
  assert.match(
    compact,
    /if tg_op = 'UPDATE' and new\.user_id is not distinct from old\.user_id and new\.category_id is not distinct from old\.category_id and new\.type is not distinct from old\.type then return new/,
  );
});

test("new and changed links require an active same-owner same-type category and refresh snapshots", () => {
  assert.match(compact, /category_row\.user_id = new\.user_id/);
  assert.match(compact, /category_row\.id = new\.category_id/);
  assert.match(compact, /category_row\.type = new\.type/);
  assert.match(compact, /category_row\.archived_at is null for share/);
  assert.match(compact, /new\.category_name_snapshot := category_name/);
  assert.match(compact, /new\.category_color_snapshot := category_color/);
});

test("trigger function remains invoker-only with an empty search path", () => {
  assert.match(compact, /returns trigger language plpgsql security invoker set search_path = ''/);
  for (const role of ["public", "anon", "authenticated"]) {
    assert.match(
      compact,
      new RegExp(`revoke execute on function public\\.validate_transaction_category_assignment\\(\\) from ${role}`),
    );
  }
});

test("authenticated receives only table SELECT INSERT UPDATE and anon receives nothing", () => {
  assert.match(compact, /revoke all on table public\.categories from anon/);
  assert.match(compact, /revoke delete, truncate, references, trigger on table public\.categories from authenticated/);
  assert.match(compact, /grant select, insert, update on table public\.categories to authenticated/);
  assert.doesNotMatch(compact, /grant .*? on table public\.categories to anon/);
  assert.doesNotMatch(compact, /grant .*?delete.*? to authenticated/);
});

test("correction does not create replace or widen any policy", () => {
  assert.doesNotMatch(compact, /(?:create|alter|drop) policy/);
  assert.doesNotMatch(compact, /alter table public\.categories (?:enable|disable|force|no force) row level security/);
});

test("the already-applied link migration remains byte-for-byte unchanged", () => {
  assert.equal(
    createHash("sha256").update(appliedMigration).digest("hex"),
    "966dffbc9787c2175cd2454c29ba6efd739a92e7d2311859782cce0f59f5ea08",
  );
});
