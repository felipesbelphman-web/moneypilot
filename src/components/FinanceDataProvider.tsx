"use client";

import { createContext, type Dispatch, type ReactNode, type SetStateAction, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import type { Budget, BudgetAdjustment } from "@/components/budgets/budget-model";
import type { Goal } from "@/components/goals/goal-model";
import type { GoalContributionPlan } from "@/components/goals/goal-contribution-plan";
import type { Investment } from "@/components/investments/investment-model";
import type { LegacyTransactionCreateInput, Transaction, TransactionCategoryWrite, TransactionCreateInput, TransactionUpdateInput } from "@/components/transactions/transaction-model";
import { calculateCompleteCurrentBalance, type AccountBalanceSettings, type AccountBalanceSettingsInput } from "@/lib/domain/account-balance-settings";
import type { Category, CategoryCreateInput, CategoryUpdateInput } from "@/lib/domain/category";
import { mapFinanceRepositoryError, type FinanceError } from "@/lib/domain/finance-error";
import { validateAndNormalizeInvestment } from "@/lib/domain/investment-validation";
import { aggregateFinanceHydrationError, authenticationHydrationError, createEmptyFinanceData, isCurrentFinanceHydration, mergeCategoryLoadResult, mergeConfirmedCategory, mergeFinanceLoadResult, selectActiveCategories, settleFinanceProviderHydration } from "@/lib/persistence/finance-hydration";
import { executeFinanceMutation } from "@/lib/persistence/finance-mutation";
import type { FinanceHydrationErrors } from "@/lib/persistence/finance-persistence-model";
import { SupabaseCategoryRepository } from "@/lib/persistence/supabase-category-repository";
import { SupabaseFinanceRepository } from "@/lib/persistence/supabase-finance-repository";
import { createClient } from "@/lib/supabase/client";

export type FinanceMutationOperation =
  | "saveAccountBalanceSettings"
  | "createTransaction"
  | "importTransactions"
  | "updateTransaction"
  | "updateTransactionClassification"
  | "deleteTransaction"
  | "upsertBudget"
  | "deleteBudget"
  | "upsertBudgetAdjustment"
  | "deleteBudgetAdjustment"
  | "upsertGoal"
  | "deleteGoal"
  | "upsertGoalContributionPlan"
  | "deleteGoalContributionPlan"
  | "upsertInvestment"
  | "deleteInvestment"
  | "createCategory"
  | "updateCategory"
  | "archiveCategory"
  | "restoreCategory";

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
  accountBalanceSettings: AccountBalanceSettings | null;
  accountBalance: number | null;
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
  investments: Investment[];
  categories: Category[];
  activeCategories: Category[];
  isHydrating: boolean;
  hydrationError: FinanceError | null;
  mutationState: FinanceMutationState;
  saveAccountBalanceSettings: (settings: AccountBalanceSettingsInput) => Promise<AccountBalanceSettings>;
  createTransaction: (transaction: LegacyTransactionCreateInput) => Promise<Transaction>;
  createClassifiedTransaction: (transaction: TransactionCreateInput) => Promise<Transaction>;
  importTransactions: (transactions: LegacyTransactionCreateInput[]) => Promise<Transaction[]>;
  updateTransaction: (transaction: TransactionUpdateInput) => Promise<Transaction>;
  linkTransactionCategory: (transactionId: string, category: Extract<TransactionCategoryWrite, { kind: "linked" }>) => Promise<Transaction>;
  unlinkTransactionCategory: (transactionId: string) => Promise<Transaction>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  upsertBudget: (budget: Budget) => Promise<Budget>;
  deleteBudget: (budgetId: string) => Promise<void>;
  upsertBudgetAdjustment: (adjustment: BudgetAdjustment) => Promise<BudgetAdjustment>;
  deleteBudgetAdjustment: (month: string) => Promise<void>;
  upsertGoal: (goal: Goal) => Promise<Goal>;
  deleteGoal: (goalId: string) => Promise<void>;
  upsertGoalContributionPlan: (plan: GoalContributionPlan) => Promise<GoalContributionPlan>;
  deleteGoalContributionPlan: (goalId: string) => Promise<void>;
  upsertInvestment: (investment: Investment) => Promise<Investment>;
  deleteInvestment: (investmentId: string) => Promise<void>;
  createCategory: (input: Omit<CategoryCreateInput, "id" | "userId">) => Promise<Category>;
  updateCategory: (categoryId: string, input: CategoryUpdateInput) => Promise<Category>;
  archiveCategory: (categoryId: string, archivedAt: string) => Promise<Category>;
  restoreCategory: (categoryId: string) => Promise<Category>;
};

const FinanceDataContext = createContext<FinanceDataContextValue | undefined>(undefined);

export function FinanceDataProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [repository] = useState(() => new SupabaseFinanceRepository(supabase));
  const [categoryRepository] = useState(() => new SupabaseCategoryRepository(supabase));
  const [accountBalanceSettings, setAccountBalanceSettings] = useState<AccountBalanceSettings | null>(null);
  const [transactionsComplete, setTransactionsComplete] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetAdjustments, setBudgetAdjustments] = useState<Record<string, BudgetAdjustment>>({});
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalContributionPlans, setGoalContributionPlans] = useState<Record<string, GoalContributionPlan>>({});
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isHydrating, setIsHydrating] = useState(true);
  const [hydrationError, setHydrationError] = useState<FinanceError | null>(null);
  const [mutationState, setMutationState] = useState<FinanceMutationState>(idleMutationState);
  const currentUserIdRef = useRef<string | null>(null);
  const accountGenerationRef = useRef(0);
  const activeMutationKeysRef = useRef(new Set<string>());
  const hydrationErrorsRef = useRef<FinanceHydrationErrors>({});

  const clearFinanceState = useCallback(() => {
    setAccountBalanceSettings(null);
    setTransactionsComplete(false);
    setTransactions([]);
    setBudgets([]);
    setBudgetAdjustments({});
    setGoals([]);
    setGoalContributionPlans({});
    setInvestments([]);
    setCategories([]);
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
    const generation = accountGenerationRef.current;
    return executeFinanceMutation({
      operation,
      entityKey,
      userId: currentUserIdRef.current,
      generation,
      activeKeys: activeMutationKeysRef.current,
      isCurrent: (userId, expectedGeneration) => currentUserIdRef.current === userId
        && accountGenerationRef.current === expectedGeneration,
      setState: setMutationState,
    }, persist, commit);
  }, []);

  const saveAccountBalanceSettings = useCallback((settings: AccountBalanceSettingsInput) => runMutation(
    "saveAccountBalanceSettings",
    "accountBalanceSettings",
    (userId) => repository.saveAccountBalanceSettings(userId, settings),
    setAccountBalanceSettings,
  ), [repository, runMutation]);

  const createClassifiedTransaction = useCallback((transaction: TransactionCreateInput) => runMutation(
    "createTransaction",
    `transaction:${transaction.id}`,
    (userId) => repository.createTransaction(userId, transaction),
    (confirmed) => setTransactions((current) => [confirmed, ...current]),
  ), [repository, runMutation]);

  const createTransaction = useCallback((transaction: LegacyTransactionCreateInput) => createClassifiedTransaction({
    ...transaction,
    categoryWrite: { kind: "legacy", categoryName: transaction.category, categoryColor: transaction.categoryColor },
  }), [createClassifiedTransaction]);

  const importTransactions = useCallback((transactions: LegacyTransactionCreateInput[]) => runMutation(
    "importTransactions",
    `batch:import:${Date.now()}`,
    (userId) => repository.createTransactions(userId, transactions.map((transaction) => ({ ...transaction, categoryWrite: { kind: "legacy", categoryName: transaction.category, categoryColor: transaction.categoryColor } }))),
    (confirmed) => setTransactions((current) => [...confirmed, ...current]),
  ), [repository, runMutation]);

  const updateTransaction = useCallback((transaction: TransactionUpdateInput) => runMutation(
    "updateTransaction",
    `transaction:${transaction.id}`,
    (userId) => repository.updateTransaction(userId, transaction),
    (confirmed) => setTransactions((current) => current.map((item) => item.id === confirmed.id ? confirmed : item)),
  ), [repository, runMutation]);

  const updateTransactionClassification = useCallback((transactionId: string, categoryWrite: Extract<TransactionCategoryWrite, { kind: "linked" | "uncategorized" }>) => runMutation(
    "updateTransactionClassification",
    `transaction:${transactionId}`,
    (userId) => repository.updateTransactionClassification(userId, { id: transactionId, categoryWrite }),
    (confirmed) => setTransactions((current) => current.map((item) => item.id === confirmed.id ? confirmed : item)),
  ), [repository, runMutation]);

  const linkTransactionCategory = useCallback((transactionId: string, category: Extract<TransactionCategoryWrite, { kind: "linked" }>) => updateTransactionClassification(transactionId, category), [updateTransactionClassification]);
  const unlinkTransactionCategory = useCallback((transactionId: string) => updateTransactionClassification(transactionId, { kind: "uncategorized" }), [updateTransactionClassification]);

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

  const upsertInvestment = useCallback((investment: Investment) => {
    const validated = validateAndNormalizeInvestment(investment);
    return runMutation(
      "upsertInvestment",
      `investment:${validated.id}`,
      (userId) => repository.upsertInvestment(userId, validated),
      (confirmed) => setInvestments((current) => current.some((item) => item.id === confirmed.id)
        ? current.map((item) => item.id === confirmed.id ? confirmed : item)
        : [...current, confirmed]),
    );
  }, [repository, runMutation]);

  const deleteInvestment = useCallback((investmentId: string) => runMutation(
    "deleteInvestment",
    `investment:${investmentId}`,
    (userId) => repository.deleteInvestment(userId, investmentId),
    () => setInvestments((current) => current.filter((item) => item.id !== investmentId)),
  ), [repository, runMutation]);

  const createCategory = useCallback((input: Omit<CategoryCreateInput, "id" | "userId">) => runMutation(
    "createCategory",
    `category:create:${input.type}:${input.name}`,
    () => categoryRepository.createCategory(input),
    (confirmed) => setCategories((current) => mergeConfirmedCategory(current, confirmed)),
  ), [categoryRepository, runMutation]);

  const updateCategory = useCallback((categoryId: string, input: CategoryUpdateInput) => runMutation(
    "updateCategory",
    `category:${categoryId}`,
    () => categoryRepository.updateCategory(categoryId, input),
    (confirmed) => setCategories((current) => mergeConfirmedCategory(current, confirmed)),
  ), [categoryRepository, runMutation]);

  const archiveCategory = useCallback((categoryId: string, archivedAt: string) => runMutation(
    "archiveCategory",
    `category:${categoryId}`,
    () => categoryRepository.archiveCategory(categoryId, archivedAt),
    (confirmed) => setCategories((current) => mergeConfirmedCategory(current, confirmed)),
  ), [categoryRepository, runMutation]);

  const restoreCategory = useCallback((categoryId: string) => runMutation(
    "restoreCategory",
    `category:${categoryId}`,
    () => categoryRepository.restoreCategory(categoryId),
    (confirmed) => setCategories((current) => mergeConfirmedCategory(current, confirmed)),
  ), [categoryRepository, runMutation]);

  useEffect(() => {
    let active = true;
    const activeMutationKeys = activeMutationKeysRef.current;
    let authGeneration = 0;
    let hydrationGeneration = 0;
    let authResolved = false;
    let currentUserId: string | null = null;

    function isCurrentHydration(requestId: number, userId: string) {
      return isCurrentFinanceHydration(active, hydrationGeneration, currentUserId, requestId, userId);
    }

    function synchronizeUser(userId: string | null) {
      if (!active) return;

      if (authResolved && userId === currentUserId && userId === null) {
        return;
      }

      const userChanged = userId !== currentUserId;
      authResolved = true;
      currentUserId = userId;
      if (userChanged) resetMutationLifecycle(userId);
      const requestId = ++hydrationGeneration;

      if (userChanged) clearFinanceState();
      setHydrationError(null);
      hydrationErrorsRef.current = {};

      if (!userId) {
        setIsHydrating(false);
        return;
      }

      setIsHydrating(true);
      setTransactionsComplete(false);

      void settleFinanceProviderHydration(
        () => repository.loadFinanceData(userId),
        () => categoryRepository.listAllCategories(),
      ).then(({ finance: result, categories: categoryResult }) => {
        if (!isCurrentHydration(requestId, userId)) return;

        const merged = mergeFinanceLoadResult(createEmptyFinanceData(), result);
        if (result.accountBalanceSettings.status === "success") setAccountBalanceSettings(merged.data.accountBalanceSettings);
        if (result.transactions.status === "success") setTransactions(merged.data.transactions);
        setTransactionsComplete(result.transactions.status === "success");
        if (result.budgets.status === "success") setBudgets(merged.data.budgets);
        if (result.budgetAdjustments.status === "success") setBudgetAdjustments(Object.fromEntries(merged.data.budgetAdjustments.map((adjustment) => [adjustment.month, adjustment])));
        if (result.goals.status === "success") setGoals(merged.data.goals);
        if (result.goalContributionPlans.status === "success") setGoalContributionPlans(Object.fromEntries(merged.data.goalContributionPlans.map((plan) => [plan.goalId, plan])));
        if (result.investments.status === "success") setInvestments(merged.data.investments);
        setCategories((current) => mergeCategoryLoadResult(current, categoryResult).categories);
        const hydrationErrors: FinanceHydrationErrors = { ...merged.errors };
        if (categoryResult.status === "failure") hydrationErrors.categories = categoryResult.error;
        hydrationErrorsRef.current = hydrationErrors;
        setHydrationError(aggregateFinanceHydrationError(hydrationErrors));
        setIsHydrating(false);
      }).catch((error: unknown) => {
        if (!isCurrentHydration(requestId, userId)) return;

        setHydrationError(mapFinanceRepositoryError(error));
        setIsHydrating(false);
      });
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      authGeneration += 1;
      const userId = session?.user.id ?? null;
      queueMicrotask(() => synchronizeUser(userId));
    });

    const initialAuthGeneration = authGeneration;
    void supabase.auth.getUser().then(({ data, error }) => {
      if (!active || initialAuthGeneration !== authGeneration) return;
      if (error) {
        clearFinanceState();
        resetMutationLifecycle(null);
        setHydrationError(authenticationHydrationError());
        setIsHydrating(false);
        return;
      }
      synchronizeUser(data.user?.id ?? null);
    }).catch(() => {
      if (!active || initialAuthGeneration !== authGeneration) return;
      clearFinanceState();
      resetMutationLifecycle(null);
      setHydrationError(authenticationHydrationError());
      setIsHydrating(false);
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
  }, [categoryRepository, clearFinanceState, repository, resetMutationLifecycle, supabase]);

  const accountBalance = useMemo(
    () => calculateCompleteCurrentBalance(accountBalanceSettings, transactions, transactionsComplete),
    [accountBalanceSettings, transactions, transactionsComplete],
  );

  const activeCategories = useMemo(() => selectActiveCategories(categories), [categories]);

  const value = useMemo(() => ({
    accountBalanceSettings,
    accountBalance,
    transactions,
    setTransactions,
    budgets,
    setBudgets,
    budgetAdjustments,
    goals,
    setGoals,
    goalContributionPlans,
    setGoalContributionPlans,
    investments,
    categories,
    activeCategories,
    isHydrating,
    hydrationError,
    mutationState,
    saveAccountBalanceSettings,
    createTransaction,
    createClassifiedTransaction,
    importTransactions,
    updateTransaction,
    linkTransactionCategory,
    unlinkTransactionCategory,
    deleteTransaction,
    upsertBudget,
    deleteBudget,
    upsertBudgetAdjustment,
    deleteBudgetAdjustment,
    upsertGoal,
    deleteGoal,
    upsertGoalContributionPlan,
    deleteGoalContributionPlan,
    upsertInvestment,
    deleteInvestment,
    createCategory,
    updateCategory,
    archiveCategory,
    restoreCategory,
    setBudgetAdjustment: (adjustment: BudgetAdjustment) => setBudgetAdjustments((current) => ({ ...current, [adjustment.month]: adjustment })),
  }), [accountBalance, accountBalanceSettings, activeCategories, archiveCategory, budgetAdjustments, budgets, categories, createCategory, createClassifiedTransaction, createTransaction, importTransactions, deleteBudget, deleteBudgetAdjustment, deleteGoal, deleteGoalContributionPlan, deleteInvestment, deleteTransaction, goalContributionPlans, goals, hydrationError, investments, isHydrating, linkTransactionCategory, mutationState, restoreCategory, saveAccountBalanceSettings, transactions, unlinkTransactionCategory, updateCategory, updateTransaction, upsertBudget, upsertBudgetAdjustment, upsertGoal, upsertGoalContributionPlan, upsertInvestment]);

  return <FinanceDataContext.Provider value={value}>{children}</FinanceDataContext.Provider>;
}

export function useFinanceData() {
  const context = useContext(FinanceDataContext);
  if (!context) throw new Error("useFinanceData must be used inside FinanceDataProvider");
  return context;
}
