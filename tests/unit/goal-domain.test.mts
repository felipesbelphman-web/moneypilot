import assert from "node:assert/strict";
import { test } from "node:test";
import type { Goal } from "../../src/components/goals/goal-model.ts";
import type { GoalContributionPlan } from "../../src/components/goals/goal-contribution-plan.ts";
import { FinanceError } from "../../src/lib/domain/finance-error.ts";
import { validateAndNormalizeGoal, validateGoalContributionPlan } from "../../src/lib/domain/goal-validation.ts";
import "./goal-safe-calculations.test.mts";

const validGoal: Goal = {
  id: "goal-1",
  name: "Viagem para Itália",
  targetAmount: 6000,
  savedAmount: 1500,
  targetDate: "2028-05",
  priority: "primary",
};

const validPlan: GoalContributionPlan = {
  goalId: "goal-1",
  monthlyTarget: 300,
  baselineRequiredMonthlyContribution: 250,
  savingsBoost: 50,
  createdAt: "2026-09-08T12:00:00.000Z",
};

function expectValidationError(action: () => unknown, field: string, reason: string) {
  assert.throws(action, (error) => error instanceof FinanceError
    && error.code === "validation_error"
    && error.details?.field === field
    && error.details.reason === reason);
}

test("accepts a valid primary goal", () => {
  assert.deepEqual(validateAndNormalizeGoal(validGoal), validGoal);
});

test("accepts a valid secondary goal", () => {
  const secondary = { ...validGoal, priority: "secondary" as const };
  assert.deepEqual(validateAndNormalizeGoal(secondary), secondary);
});

test("normalizes external goal whitespace only", () => {
  const normalized = validateAndNormalizeGoal({ ...validGoal, id: "  goal-1  ", name: "  Viagem para Itália  ", targetDate: "  2028-05  " });
  assert.deepEqual(normalized, validGoal);
});

test("rejects an empty goal id", () => expectValidationError(() => validateAndNormalizeGoal({ ...validGoal, id: "   " }), "id", "required"));
test("rejects an empty goal name", () => expectValidationError(() => validateAndNormalizeGoal({ ...validGoal, name: "   " }), "name", "required"));
test("rejects a zero target", () => expectValidationError(() => validateAndNormalizeGoal({ ...validGoal, targetAmount: 0 }), "targetAmount", "positive"));
test("rejects a negative target", () => expectValidationError(() => validateAndNormalizeGoal({ ...validGoal, targetAmount: -1 }), "targetAmount", "positive"));
test("rejects a negative saved amount", () => expectValidationError(() => validateAndNormalizeGoal({ ...validGoal, savedAmount: -1 }), "savedAmount", "nonnegative"));
test("rejects saved amount above target", () => expectValidationError(() => validateAndNormalizeGoal({ ...validGoal, savedAmount: 6001 }), "savedAmount", "allowed_value"));

for (const field of ["targetAmount", "savedAmount"] as const) {
  for (const [label, value] of [["NaN", Number.NaN], ["infinity", Number.POSITIVE_INFINITY]] as const) {
    test(`rejects ${label} for goal ${field}`, () => {
      expectValidationError(() => validateAndNormalizeGoal({ ...validGoal, [field]: value }), field, "finite");
    });
  }
}

test("rejects an invalid target month format", () => expectValidationError(() => validateAndNormalizeGoal({ ...validGoal, targetDate: "05/2028" }), "targetDate", "invalid_format"));
test("rejects an impossible target month", () => expectValidationError(() => validateAndNormalizeGoal({ ...validGoal, targetDate: "2028-13" }), "targetDate", "invalid_date"));
test("rejects an invalid priority", () => expectValidationError(() => validateAndNormalizeGoal({ ...validGoal, priority: "urgent" as Goal["priority"] }), "priority", "allowed_value"));

test("allows saved amount equal to target", () => {
  const completed = { ...validGoal, savedAmount: validGoal.targetAmount };
  assert.deepEqual(validateAndNormalizeGoal(completed), completed);
});

test("accepts a valid contribution plan", () => {
  assert.deepEqual(validateGoalContributionPlan(validPlan), validPlan);
});

test("rejects an empty contribution plan goal id", () => expectValidationError(() => validateGoalContributionPlan({ ...validPlan, goalId: "   " }), "goalId", "required"));

for (const field of ["monthlyTarget", "baselineRequiredMonthlyContribution", "savingsBoost"] as const) {
  test(`rejects a negative contribution plan ${field}`, () => {
    expectValidationError(() => validateGoalContributionPlan({ ...validPlan, [field]: -1 }), field, "nonnegative");
  });
  for (const [label, value] of [["NaN", Number.NaN], ["infinity", Number.POSITIVE_INFINITY]] as const) {
    test(`rejects ${label} for contribution plan ${field}`, () => {
      expectValidationError(() => validateGoalContributionPlan({ ...validPlan, [field]: value }), field, "finite");
    });
  }
}

test("allows zero for every contribution plan value", () => {
  const zeroPlan = { ...validPlan, monthlyTarget: 0, baselineRequiredMonthlyContribution: 0, savingsBoost: 0 };
  assert.deepEqual(validateGoalContributionPlan(zeroPlan), zeroPlan);
});

test("preserves contribution plan values without recalculation", () => {
  const values = { ...validPlan, monthlyTarget: 123.45, baselineRequiredMonthlyContribution: 67.89, savingsBoost: 55.56 };
  assert.deepEqual(validateGoalContributionPlan(values), values);
});

test("does not alter priority, money, target month or goal relationship", () => {
  const goal = validateAndNormalizeGoal({ ...validGoal, priority: "secondary", targetAmount: 1234.56, savedAmount: 234.56, targetDate: "2029-11" });
  const plan = validateGoalContributionPlan({ ...validPlan, goalId: " goal-identity-is-preserved ", monthlyTarget: 321.09 });
  assert.equal(goal.priority, "secondary");
  assert.equal(goal.targetAmount, 1234.56);
  assert.equal(goal.savedAmount, 234.56);
  assert.equal(goal.targetDate, "2029-11");
  assert.equal(plan.goalId, " goal-identity-is-preserved ");
  assert.equal(plan.monthlyTarget, 321.09);
});
