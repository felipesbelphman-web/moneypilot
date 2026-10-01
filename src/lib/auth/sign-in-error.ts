type SignInError = {
  code?: string;
  name: string;
  status?: number;
};

export function classifySignInError(error: SignInError) {
  if (error.code === "invalid_credentials") return "invalid-credentials";

  // The SDK also calls HTTP 5xx responses AuthRetryableFetchError.
  // A retryable server response is not evidence of a failed connection.
  if (error.status !== undefined && error.status > 0) return "auth-error";

  if (
    error.name === "AuthRetryableFetchError" ||
    error.status === 0 ||
    error.code === "request_timeout"
  ) {
    return "auth-unavailable";
  }

  return "auth-error";
}
