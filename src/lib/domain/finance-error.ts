export type FinanceErrorCode =
  | "validation_error"
  | "duplicate_record"
  | "ownership_denied"
  | "authentication_required"
  | "constraint_violation"
  | "repository_unavailable"
  | "unknown_repository_error";

export type FinanceErrorDetails = Readonly<{
  field?: string;
  reason?: "required" | "positive" | "nonnegative" | "finite" | "allowed_value" | "invalid_format" | "invalid_date";
}>;

export class FinanceError extends Error {
  readonly code: FinanceErrorCode;
  readonly details?: FinanceErrorDetails;

  constructor(code: FinanceErrorCode, details?: FinanceErrorDetails) {
    super(code);
    this.name = "FinanceError";
    this.code = code;
    this.details = details;
  }
}

export function mapFinanceRepositoryError(error: unknown): FinanceError {
  if (error instanceof FinanceError) return error;

  const code = readStringProperty(error, "code");
  if (code === "23505") return new FinanceError("duplicate_record");
  if (code === "23514") return new FinanceError("constraint_violation");
  if (code === "42501") return new FinanceError("ownership_denied");
  if (isNetworkFailure(error, code)) return new FinanceError("repository_unavailable");
  return new FinanceError("unknown_repository_error");
}

function isNetworkFailure(error: unknown, code: string | null) {
  if (error instanceof TypeError) return true;
  if (code && ["ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "NETWORK_ERROR", "FETCH_ERROR"].includes(code)) return true;
  const message = readStringProperty(error, "message");
  return message !== null && /fetch|network|connection|timeout/i.test(message);
}

function readStringProperty(value: unknown, property: string) {
  if (typeof value !== "object" || value === null || !(property in value)) return null;
  const propertyValue = (value as Record<string, unknown>)[property];
  return typeof propertyValue === "string" ? propertyValue : null;
}
