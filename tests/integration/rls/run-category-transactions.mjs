const confirmation = "I_CONFIRM_ISOLATED_CATEGORY_TRANSACTION_REMOTE_TESTS";

if (process.env.RUN_REMOTE_CATEGORY_TRANSACTION_TESTS !== "true") {
  console.error("Category/transaction RLS tests blocked: RUN_REMOTE_CATEGORY_TRANSACTION_TESTS must be true.");
  process.exitCode = 1;
} else if (process.env.SUPABASE_TEST_REMOTE_CONFIRMATION !== confirmation) {
  console.error(`Category/transaction RLS tests blocked: SUPABASE_TEST_REMOTE_CONFIRMATION must be ${confirmation}.`);
  process.exitCode = 1;
} else {
  await import("./remote-category-transactions.test.mts");
}
