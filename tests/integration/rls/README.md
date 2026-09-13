# Remote Supabase RLS integration tests

This suite is disabled by default and targets only two dedicated test accounts. It never uses `service_role`, does not create users, and does not touch profiles or avatars.

## Preparation

1. In Supabase Authentication, manually create two distinct, dedicated users that contain no real or personal data.
2. Confirm that neither account has an `account_balance_settings` row. The suite checks both accounts with their own sessions and blocks before its first mutation if either account is not empty. Choose empty test accounts instead of clearing an existing row.
3. Copy `.env.test.example` to an ignored local file and fill the Supabase URL, publishable key, and both dedicated credentials. Do not commit that file.
4. Export those variables in the shell used to run the suite.
5. Set both explicit safeguards:

   - `RUN_REMOTE_RLS_TESTS=true`
   - `SUPABASE_TEST_REMOTE_CONFIRMATION=I_CONFIRM_DEDICATED_REMOTE_TEST_USERS`

## Execution

Run `npm run test:rls` only against the linked, already-migrated test environment. The command is not part of `test`, `build`, or `dev`.

The tests create records with a unique `moneypilot-rls-` prefix. Cleanup runs in `finally`; cleanup for A and B is attempted independently, and each authenticated client deletes only its own balance row and records owned by that account and identifiable by the current run prefix. Post-cleanup checks independently verify that no balance, Transaction, Investment, or other identifiable fixture from the run remains. Cleanup and verification failures fail the suite without exposing record values or identifiers.

The suite contains 34 checks: the original financial and ownership checks plus 12 checks for `account_balance_settings` and the parent integration test. Because that table uses `user_id` as its primary key, an isolated balance fixture cannot coexist with an account's real setting. The suite therefore never replaces, restores, or deletes a preexisting balance setting. Each balance check prepares its required state deterministically after the empty-account precondition passes.

If a process ends before cleanup completes, a later run detects the residue as a non-empty account and blocks before mutations. The residue requires manual analysis; the suite never clears it automatically. Remote execution continues to require both the opt-in and the explicit confirmation above.

## Categories and transactions suite

The isolated category/transaction contract has a separate command and separate opt-in:

- `RUN_REMOTE_CATEGORY_TRANSACTION_TESTS=true`
- `SUPABASE_TEST_REMOTE_CONFIRMATION=I_CONFIRM_ISOLATED_CATEGORY_TRANSACTION_REMOTE_TESTS`
- `SUPABASE_SERVICE_ROLE_KEY` configured only in the ignored server-side test environment

Run it with `npm run test:rls:categories`. This suite creates only UUID-addressed fixtures whose names and descriptions contain a unique per-run prefix. Its service-role client is restricted to cleanup: before deleting, it verifies the exact fixture id, owner and prefix, and it then verifies that every registered fixture was removed. The key must never use the `NEXT_PUBLIC_` prefix or be committed.
