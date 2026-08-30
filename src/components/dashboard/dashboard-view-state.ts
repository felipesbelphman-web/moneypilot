export type DashboardViewState = "loading" | "error" | "empty" | "ready";

type DashboardViewStateInput = {
  isLoading: boolean;
  error: Error | string | null;
  hasFinancialData: boolean;
};

export function resolveDashboardViewState({ isLoading, error, hasFinancialData }: DashboardViewStateInput): DashboardViewState {
  if (isLoading) return "loading";
  if (error) return "error";
  if (!hasFinancialData) return "empty";
  return "ready";
}
