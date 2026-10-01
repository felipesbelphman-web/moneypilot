import assert from "node:assert/strict";
import test from "node:test";
import { classifySignInError } from "../../src/lib/auth/sign-in-error.ts";

test("invalid credentials keep their specific message", () => {
  assert.equal(classifySignInError({ name: "AuthApiError", code: "invalid_credentials", status: 400 }), "invalid-credentials");
});

test("transport failures and timeouts without an HTTP response indicate connectivity failure", () => {
  for (const error of [
    { name: "AuthRetryableFetchError", status: 0 },
    { name: "AuthRetryableFetchError" },
    { name: "AuthApiError", code: "request_timeout" },
  ]) {
    assert.equal(classifySignInError(error), "auth-unavailable");
  }
});

test("retryable HTTP responses and rate limits are not reported as connection failures", () => {
  for (const status of [429, 500, 502, 503, 504, 520, 530]) {
    assert.equal(classifySignInError({ name: "AuthRetryableFetchError", status }), "auth-error");
  }
  assert.equal(classifySignInError({ name: "AuthApiError", code: "over_request_rate_limit", status: 429 }), "auth-error");
});

test("other authentication rejections and unknown errors do not claim network failure", () => {
  for (const error of [
    { name: "AuthApiError", code: "email_not_confirmed", status: 400 },
    { name: "AuthApiError", code: "user_banned", status: 403 },
    { name: "AuthUnknownError", status: 401 },
    { name: "AuthUnknownError" },
  ]) {
    assert.equal(classifySignInError(error), "auth-error");
  }
});
