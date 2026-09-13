const confirmation = "I_CONFIRM_DEDICATED_REMOTE_TEST_USERS";

if (process.env.RUN_REMOTE_RLS_TESTS !== "true") {
  console.error("RLS integration tests blocked: RUN_REMOTE_RLS_TESTS must be true.");
  process.exitCode = 1;
} else if (process.env.SUPABASE_TEST_REMOTE_CONFIRMATION !== confirmation) {
  console.error(`RLS integration tests blocked: SUPABASE_TEST_REMOTE_CONFIRMATION must be ${confirmation}.`);
  process.exitCode = 1;
} else {
  await import("./remote-rls.test.mts");
}
