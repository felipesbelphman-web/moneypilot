import { FinanceError, mapFinanceRepositoryError } from "../domain/finance-error.ts";

export type FinanceMutationLifecycle<Operation extends string> = {
  operation: Operation;
  entityKey: string;
  userId: string | null;
  generation: number;
  activeKeys: Set<string>;
  isCurrent: (userId: string, generation: number) => boolean;
  setState: (state: { status: "saving" | "success" | "error"; operation: Operation; error: FinanceError | null }) => void;
};

export async function executeFinanceMutation<Result, Operation extends string>(
  lifecycle: FinanceMutationLifecycle<Operation>,
  persist: (userId: string) => Promise<Result>,
  commit: (result: Result) => void,
): Promise<Result> {
  if (!lifecycle.userId) {
    const error = new FinanceError("authentication_required");
    lifecycle.setState({ status: "error", operation: lifecycle.operation, error });
    throw error;
  }

  const userId = lifecycle.userId;
  const mutationKey = `${lifecycle.generation}:${lifecycle.entityKey}`;
  if (lifecycle.activeKeys.has(mutationKey)) {
    throw new FinanceError("unknown_repository_error");
  }

  lifecycle.activeKeys.add(mutationKey);
  lifecycle.setState({ status: "saving", operation: lifecycle.operation, error: null });

  try {
    const result = await persist(userId);
    if (!lifecycle.isCurrent(userId, lifecycle.generation)) {
      throw new FinanceError("unknown_repository_error");
    }

    commit(result);
    lifecycle.setState({ status: "success", operation: lifecycle.operation, error: null });
    return result;
  } catch (caught: unknown) {
    const error = mapFinanceRepositoryError(caught);
    if (lifecycle.isCurrent(userId, lifecycle.generation)) {
      lifecycle.setState({ status: "error", operation: lifecycle.operation, error });
    }
    throw error;
  } finally {
    lifecycle.activeKeys.delete(mutationKey);
  }
}
