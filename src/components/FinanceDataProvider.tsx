"use client";

import { createContext, type Dispatch, type ReactNode, type SetStateAction, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import type { Budget, BudgetAdjustment } from "@/components/budgets/budget-model";
import type { Goal } from "@/components/goals/goal-model";
import type { GoalContributionPlan } from "@/components/goals/goal-contribution-plan";
import type { Transaction } from "@/components/transactions/transaction-model";
import { SupabaseFinanceRepository } from "@/lib/persistence/supabase-finance-repository";
import { createClient } from "@/lib/supabase/client";

export type FinanceMutationOperation =
  | "createTransaction"
  | "importTransactions"
  | "updateTransaction"
  | "deleteTransaction"
  | "upsertBudget"
  | "deleteBudget"
  | "upsertBudgetAdjustment"
  | "deleteBudgetAdjustment"
  | "upsertGoal"
  | "deleteGoal"
  | "upsertGoalContributionPlan"
  | "deleteGoalContributionPlan";

export type FinanceMutationState = {
  status: "idle" | "saving" | "success" | "error";
  operation: FinanceMutationOperation | null;
  error: Error | null;
};

const idleMutationState: FinanceMutationState = {
  status: "idle",
  operation: null,
  error: null,
};

type FinanceDataContextValue = {
  transactions: Transaction[];
  setTransactions: Dispatch<SetStateAction<Transaction[]>>;
  budgets: Budget[];
  setBudgets: Dispatch<SetStateAction<Budget[]>>;
  budgetAdjustments: Record<string, BudgetAdjustment>;
  setBudgetAdjustment: (adjustment: BudgetAdjustment) => void;
  goals: Goal[];
  setGoals: Dispatch<SetStateAction<Goal[]>>;
  goalContributionPlans: Record<string, GoalContributionPlan>;
  setGoalContributionPlans: Dispatch<SetStateAction<Record<string, GoalContributionPlan>>>;
  isHydrating: boolean;
  hydrationError: Error | null;
  mutationState: FinanceMutationState;
  createTransaction: (transaction: Transaction) => Promise<Transaction>;
  importTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  updateTransaction: (transaction: Transaction) => Promise<Transaction>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  upsertBudget: (budget: Budget) => Promise<Budget>;
  deleteBudget: (budgetId: string) => Promise<void>;
  upsertBudgetAdjustment: (adjustment: BudgetAdjustment) => Promise<BudgetAdjustment>;
  deleteBudgetAdjustment: (month: string) => Promise<void>;
  upsertGoal: (goal: Goal) => Promise<Goal>;
  deleteGoal: (goalId: string) => Promise<void>;
  upsertGoalContributionPlan: (plan: GoalContributionPlan) => Promise<GoalContributionPlan>;
  deleteGoalContributionPlan: (goalId: string) => Promise<void>;
};

const FinanceDataContext = createContext<FinanceDataContextValue | undefined>(undefined);

export function FinanceDataProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [repository] = useState(() => new SupabaseFinanceRepository(supabase));
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetAdjustments, setBudgetAdjustments] = useState<Record<string, BudgetAdjustment>>({});
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalContributionPlans, setGoalContributionPlans] = useState<Record<string, GoalContributionPlan>>({});
  const [isHydrating, setIsHydrating] = useState(true);
  const [hydrationError, setHydrationError] = useState<Error | null>(null);
  const [mutationState, setMutationState] = useState<FinanceMutationState>(idleMutationState);
  const currentUserIdRef = useRef<string | null>(null);
  const accountGenerationRef = useRef(0);
  const activeMutationKeysRef = useRef(new Set<string>());

  const clearFinanceState = useCallback(() => {
    setTransactions([]);
    setBudgets([]);
    setBudgetAdjustments({});
    setGoals([]);
    setGoalContributionPlans({});
  }, []);

  const resetMutationLifecycle = useCallback((userId: string | null) => {
    currentUserIdRef.current = userId;
    accountGenerationRef.current += 1;
    activeMutationKeysRef.current.clear();
    setMutationState(idleMutationState);
  }, []);

  const runMutation = useCallback(async <Result,>(
    operation: FinanceMutationOperation,
    entityKey: string,
    persist: (userId: string) => Promise<Result>,
    commit: (result: Result) => void,
  ): Promise<Result> => {
    const userId = currentUserIdRef.current;
    if (!userId) {
      const error = new Error("An authenticated account is required for financial mutations");
      setMutationState({ status: "error", operation, error });
      throw error;
    }

    const generation = accountGenerationRef.current;
    const mutationKey = `${generation}:${entityKey}`;
    if (activeMutationKeysRef.current.has(mutationKey)) {
      throw new Error(`Financial mutation already in progress: ${operation}`);
    }

    activeMutationKeysRef.current.add(mutationKey);
    setMutationState({ status: "saving", operation, error: null });

    try {
      const result = await persist(userId);
      const isCurrentAccount = currentUserIdRef.current === userId
        && accountGenerationRef.current === generation;

      if (!isCurrentAccount) {
        throw new Error("Financial mutation response belongs to a stale account session");
      }

      commit(result);
      setMutationState({ status: "success", operation, error: null });
      return result;
    } catch (caught: unknown) {
      const error = caught instanceof Error ? caught : new Error("Financial mutation failed");
      const isCurrentAccount = currentUserIdRef.current === userId
        && accountGenerationRef.current === generation;
      if (isCurrentAccount) {
        setMutationState({ status: "error", operation, error });
      }
      throw error;
    } finally {
      activeMutationKeysRef.current.delete(mutationKey);
    }
  }, []);

  const createTransaction = useCallback((transaction: Transaction) => runMutation(
    "createTransaction",
    `transaction:${transaction.id}`,
    (userId) => repository.createTransaction(userId, transaction),
    (confirmed) => setTransactions((current) => [confirmed, ...current]),
  ), [repository, runMutation]);

  const importTransactions = useCallback((transactions: Transaction[]) => runMutation(
    "importTransactions",
    `batch:import:${Date.now()}`,
    (userId) => repository.createTransactions(userId, transactions),
    (confirmed) => setTransactions((current) => [...confirmed, ...current]),
  ), [repository, runMutation]);

  const updateTransaction = useCallback((transaction: Transaction) => runMutation(
    "updateTransaction",
    `transaction:${transaction.id}`,
    (userId) => repository.updateTransaction(userId, transaction),
    (confirmed) => setTransactions((current) => current.map((item) => item.id === confirmed.id ? confirmed : item)),
  ), [repository, runMutation]);

  const deleteTransaction = useCallback((transactionId: string) => runMutation(
    "deleteTransaction",
    `transaction:${transactionId}`,
    (userId) => repository.deleteTransaction(userId, transactionId),
    () => setTransactions((current) => current.filter((item) => item.id !== transactionId)),
  ), [repository, runMutation]);

  const upsertBudget = useCallback((budget: Budget) => runMutation(
    "upsertBudget",
    `budget:${budget.id}`,
    (userId) => repository.upsertBudget(userId, budget),
    (confirmed) => setBudgets((current) => current.some((item) => item.id === confirmed.id)
      ? current.map((item) => item.id === confirmed.id ? confirmed : item)
      : [confirmed, ...current]),
  ), [repository, runMutation]);

  const deleteBudget = useCallback((budgetId: string) => runMutation(
    "deleteBudget",
    `budget:${budgetId}`,
    (userId) => repository.deleteBudget(userId, budgetId),
    () => setBudgets((current) => current.filter((item) => item.id !== budgetId)),
  ), [repository, runMutation]);

  const upsertBudgetAdjustment = useCallback((adjustment: BudgetAdjustment) => runMutation(
    "upsertBudgetAdjustment",
    `budgetAdjustment:${adjustment.month}`,
    (userId) => repository.upsertBudgetAdjustment(userId, adjustment),
    (confirmed) => setBudgetAdjustments((current) => ({ ...current, [confirmed.month]: confirmed })),
  ), [repository, runMutation]);

  const deleteBudgetAdjustment = useCallback((month: string) => runMutation(
    "deleteBudgetAdjustment",
    `budgetAdjustment:${month}`,
    (userId) => repository.deleteBudgetAdjustment(userId, month),
    () => setBudgetAdjustments((current) => {
      const next = { ...current };
      delete next[month];
      return next;
    }),
  ), [repository, runMutation]);

  const upsertGoal = useCallback((goal: Goal) => runMutation(
    "upsertGoal",
    `goal:${goal.id}`,
    (userId) => repository.upsertGoal(userId, goal),
    (confirmed) => setGoals((current) => current.some((item) => item.id === confirmed.id)
      ? current.map((item) => item.id === confirmed.id ? confirmed : item)
      : [...current, confirmed]),
  ), [repository, runMutation]);

  const deleteGoal = useCallback((goalId: string) => runMutation(
    "deleteGoal",
    `goal:${goalId}`,
    (userId) => repository.deleteGoal(userId, goalId),
    () => {
      setGoals((current) => current.filter((item) => item.id !== goalId));
      setGoalContributionPlans((current) => {
        const next = { ...current };
        delete next[goalId];
        return next;
      });
    },
  ), [repository, runMutation]);

  const upsertGoalContributionPlan = useCallback((plan: GoalContributionPlan) => runMutation(
    "upsertGoalContributionPlan",
    `goalContributionPlan:${plan.goalId}`,
    (userId) => repository.upsertGoalContributionPlan(userId, plan),
    (confirmed) => setGoalContributionPlans((current) => ({ ...current, [confirmed.goalId]: confirmed })),
  ), [repository, runMutation]);

  const deleteGoalContributionPlan = useCallback((goalId: string) => runMutation(
    "deleteGoalContributionPlan",
    `goalContributionPlan:${goalId}`,
    (userId) => repository.deleteGoalContributionPlan(userId, goalId),
    () => setGoalContributionPlans((current) => {
      const next = { ...current };
      delete next[goalId];
      return next;
    }),
  ), [repository, runMutation]);

  useEffect(() => {
    let active = true;
    const activeMutationKeys = activeMutationKeysRef.current;
    let authGeneration = 0;
    let hydrationGeneration = 0;
    let authResolved = false;
    let currentUserId: string | null = null;
    let attemptedUserId: string | null = null;

    function isCurrentHydration(requestId: number, userId: string) {
      return active && requestId === hydrationGeneration && userId === currentUserId;
    }

    function synchronizeUser(userId: string | null) {
      if (!active) return;

      if (authResolved && userId === currentUserId && (userId === null || attemptedUserId === userId)) {
        return;
      }

      authResolved = true;
      currentUserId = userId;
      attemptedUserId = userId;
      resetMutationLifecycle(userId);
      const requestId = ++hydrationGeneration;

      clearFinanceState();
      setHydrationError(null);

      if (!userId) {
        setIsHydrating(false);
        return;
      }

      setIsHydrating(true);

      void repository.loadFinanceData(userId).then((data) => {
        if (!isCurrentHydration(requestId, userId)) return;

        setTransactions(data.transactions);
        setBudgets(data.budgets);
        setBudgetAdjustments(Object.fromEntries(
          data.budgetAdjustments.map((adjustment) => [adjustment.month, adjustment]),
        ));
        setGoals(data.goals);
        setGoalContributionPlans(Object.fromEntries(
          data.goalContributionPlans.map((plan) => [plan.goalId, plan]),
        ));
        setHydrationError(null);
        setIsHydrating(false);
      }).catch((error: unknown) => {
        if (!isCurrentHydration(requestId, userId)) return;

        clearFinanceState();
        setHydrationError(error instanceof Error ? error : new Error("Failed to load financial data"));
        setIsHydrating(false);
      });
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      authGeneration += 1;
      const userId = session?.user.id ?? null;
      queueMicrotask(() => synchronizeUser(userId));
    });

    const initialAuthGeneration = authGeneration;
    void supabase.auth.getUser().then(({ data }) => {
      if (!active || initialAuthGeneration !== authGeneration) return;
      synchronizeUser(data.user?.id ?? null);
    });

    return () => {
      active = false;
      authGeneration += 1;
      hydrationGeneration += 1;
      currentUserIdRef.current = null;
      accountGenerationRef.current += 1;
      activeMutationKeys.clear();
      authListener.subscription.unsubscribe();
    };
  }, [clearFinanceState, repository, resetMutationLifecycle, supabase]);

  const value = useMemo(() => ({
    transactions,
    setTransactions,
    budgets,
    setBudgets,
    budgetAdjustments,
    goals,
    setGoals,
    goalContributionPlans,
    setGoalContributionPlans,
    isHydrating,
    hydrationError,
    mutationState,
    createTransaction,
    importTransactions,
    updateTransaction,
    deleteTransaction,
    upsertBudget,
    deleteBudget,
    upsertBudgetAdjustment,
    deleteBudgetAdjustment,
    upsertGoal,
    deleteGoal,
    upsertGoalContributionPlan,
    deleteGoalContributionPlan,
    setBudgetAdjustment: (adjustment: BudgetAdjustment) => setBudgetAdjustments((current) => ({ ...current, [adjustment.month]: adjustment })),
  }), [budgetAdjustments, budgets, createTransaction, importTransactions, deleteBudget, deleteBudgetAdjustment, deleteGoal, deleteGoalContributionPlan, deleteTransaction, goalContributionPlans, goals, hydrationError, isHydrating, mutationState, transactions, updateTransaction, upsertBudget, upsertBudgetAdjustment, upsertGoal, upsertGoalContributionPlan]);

  return <FinanceDataContext.Provider value={value}>{children}</FinanceDataContext.Provider>;
}

export function useFinanceData() {
  const context = useContext(FinanceDataContext);
  if (!context) throw new Error("useFinanceData must be used inside FinanceDataProvider");
  return context;
}
