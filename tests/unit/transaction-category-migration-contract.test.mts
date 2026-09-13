import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = new URL(
  "../../supabase/migrations/20260911120000_link_transactions_categories.sql",
  import.meta.url,
);
const migration = await readFile(migrationPath, "utf8");
const compact = migration.replace(/\s+/g, " ").trim();

test("adds nullable category identity and historical snapshot columns", () => {
  for (const column of ["category_id uuid", "category_name_snapshot text", "category_color_snapshot text"]) {
    assert.match(compact, new RegExp(`add column ${column}(?:,| add column)`));
    assert.doesNotMatch(compact, new RegExp(`add column ${column} not null`));
  }

  assert.match(
    compact,
    /normalized_category_snapshot text generated always as \( lower\(btrim\(normalize\(category_name_snapshot, NFC\)\)\) \) stored/,
  );
});

test("backfills exact legacy snapshots without localizing uncategorized values", () => {
  assert.match(compact, /category_name_snapshot = category, category_color_snapshot = category_color/);
  assert.doesNotMatch(migration, /sem categoria/i);
});

test("backfills an id only for one active same-owner same-type normalized match", () => {
  assert.match(compact, /category_row\.user_id = transaction_row\.user_id/);
  assert.match(compact, /category_row\.type = transaction_row\.type/);
  assert.match(compact, /category_row\.normalized_name = transaction_row\.normalized_category_snapshot/);
  assert.match(compact, /category_row\.archived_at is null/);
  assert.match(compact, /select count\(\*\).*?\) = 1;/);
});

test("enforces composite ownership and type while nulling only category_id on delete", () => {
  assert.match(
    compact,
    /foreign key \(user_id, category_id, type\) references public\.categories \(user_id, id, type\) on delete set null \(category_id\)/,
  );
  assert.doesNotMatch(compact, /transactions_category_owner_type_fk.*?on delete cascade/);
  assert.match(compact, /server_version_num.*?< 170000/);
});

test("indexes linked transactions and constrains snapshot integrity", () => {
  assert.match(
    compact,
    /create index transactions_user_category_type_idx on public\.transactions \(user_id, category_id, type\) where category_id is not null/,
  );
  assert.match(compact, /category_name_snapshot is null or btrim\(category_name_snapshot\) <> ''/);
  assert.match(compact, /category_id is null or \( category_name_snapshot is not null and category_color_snapshot is not null \)/);
});

test("accepts only active category assignments and derives their snapshots", () => {
  assert.match(compact, /security invoker set search_path = ''/);
  assert.match(compact, /category_row\.user_id = new\.user_id/);
  assert.match(compact, /category_row\.id = new\.category_id/);
  assert.match(compact, /category_row\.type = new\.type/);
  assert.match(compact, /category_row\.archived_at is null for share/);
  assert.match(compact, /new\.category_name_snapshot := category_name/);
  assert.match(compact, /new\.category_color_snapshot := category_color/);
});

test("does not reject unrelated updates to transactions linked to archived categories", () => {
  assert.match(compact, /if tg_op = 'UPDATE'.*?new\.user_id is not distinct from old\.user_id.*?new\.category_id is not distinct from old\.category_id.*?new\.type is not distinct from old\.type.*?return new/);
  assert.match(compact, /before insert or update on public\.transactions/);
});

test("keeps legacy category columns and never mutates the category catalog", () => {
  assert.doesNotMatch(compact, /drop column (?:if exists )?category(?:\s|,|;)/);
  assert.doesNotMatch(compact, /drop column (?:if exists )?category_color(?:\s|,|;)/);
  assert.doesNotMatch(compact, /(?:update|insert into|delete from) public\.categories/);
});
