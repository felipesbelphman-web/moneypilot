import assert from "node:assert/strict";
import test from "node:test";
import type React from "react";
import { elements, goalsHarness, textOf } from "./goals-render-harness.mts";
import { goalsPresentationCopy } from "../../src/components/goals/goals-presentation.ts";
import { supportedLanguages } from "../../src/i18n/config.ts";
import type { Goal } from "../../src/components/goals/goal-model.ts";

const now = new Date();
const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
const goal: Goal = { id: "offline", name: "Local test goal", targetAmount: 1200, savedAmount: 100, targetDate: `${now.getFullYear() + 1}-12`, priority: "primary" };
const budget = { id: "test-budget", month, category: "Food", subtitle: "", budget: 200, color: "#000" };
const find = (tree: React.ReactNode, name: string) => {
  const element = elements(tree).find(e => typeof e.type === "function" && e.type.name === name);
  assert.ok(element, name); return element;
};
const click = (tree: React.ReactNode, label: string) => {
  const button = elements(tree).find(e => e.type === "button" && textOf(e) === label);
  assert.ok(button, label); assert.ok(!button.props.disabled); (button.props.onClick as () => void)();
};

test("Goals preserves empty, loading and goal progress during a transaction error in all seven languages", () => {
  for (const { code } of supportedLanguages) {
    const copy = goalsPresentationCopy[code];
    assert.equal(Object.keys(copy).length, 6);
    assert.ok(Object.values(copy).every(value => value.trim() && !value.includes("\uFFFD")));
    const loading = goalsHarness({ isHydrating: true, language: code }).render();
    assert.ok(textOf(loading).includes(copy.loading));
    assert.equal(elements(loading).filter(e => e.type === "article").length, 0);
    const partial = goalsHarness({ goals: [goal], hydrationError: new Error("offline"), language: code }).render();
    assert.ok(textOf(partial).includes(copy.error));
    assert.ok(textOf(partial).includes(goal.name));
    assert.equal(elements(goalsHarness({ language: code }).render()).filter(e => e.type === "article").length, 8);
  }
});

test("Goals creation and editing use existing callbacks and retain identity", async () => {
  const h = goalsHarness(); click(h.render(), "New goal");
  await (find(h.render(), "GoalModal").props.onSubmit as (g: Goal) => Promise<void>)(goal);
  assert.equal(h.writes[0].type, "save"); assert.equal(h.data.goals[0].id, "offline-goal-id");
  click(h.render(), "Edit goal");
  await (find(h.render(), "GoalModal").props.onSubmit as (g: Goal) => Promise<void>)({ ...goal, name: "Updated locally" });
  assert.equal(h.data.goals[0].id, "offline-goal-id"); assert.equal(h.data.goals[0].name, "Updated locally");
  assert.ok(textOf(h.render()).includes("Updated locally"));
});

test("Goals deletion requires the existing confirmation modal", async () => {
  const h = goalsHarness({ goals: [goal] }); click(h.render(), "Edit goal");
  (find(h.render(), "GoalModal").props.onRequestDelete as () => void)();
  assert.equal(h.writes.length, 0);
  const dialog = find(h.render(), "DeleteGoalModal");
  await (dialog.props.onConfirm as () => Promise<void>)();
  assert.equal(h.writes[0].type, "delete"); assert.equal(h.data.goals.length, 0);
});

test("Goals plan confirmation uses the existing safe capacity and persists only a contribution plan", async () => {
  const h = goalsHarness({ goals: [goal], budgets: [budget] });
  const button = elements(h.render()).find(e => e.type === "button" && textOf(e).startsWith("Apply "));
  assert.ok(button); assert.equal(button.props.disabled, false); (button.props.onClick as () => void)();
  const dialog = find(h.render(), "GoalSavingsPlanModal");
  assert.equal(dialog.props.savingsBoost, 100); assert.equal(h.writes.length, 0);
  await (dialog.props.onApply as () => Promise<void>)();
  assert.equal(h.writes[0].type, "plan"); assert.equal(h.data.goals[0].savedAmount, 100);
  assert.ok(h.data.goalContributionPlans[goal.id]);
});

test("Goals never enables a plan for unavailable capacity, completed, overdue or invalid-month goals", () => {
  for (const [selected, budgets] of [
    [goal, [{ ...budget, budget: Number.NaN }]],
    [{ ...goal, savedAmount: 1200 }, [budget]],
    [{ ...goal, targetDate: "2000-01" }, [budget]],
    [{ ...goal, targetDate: "invalid" }, [budget]],
    [goal, []],
  ] as const) {
    const tree = goalsHarness({ goals: [selected], budgets: [...budgets] }).render();
    const button = elements(tree).find(e => e.type === "button" && (textOf(e).startsWith("Apply ") || textOf(e).includes("No capacity")));
    assert.ok(button); assert.equal(button.props.disabled, true);
  }
});

test("Goals selection preserves multiple goals and due-this-month contribution", () => {
  const due = { ...goal, id: "due", name: "Due now", targetDate: month };
  const h = goalsHarness({ goals: [goal, due] });
  const select = elements(h.render()).find(e => e.type === "select"); assert.ok(select);
  (select.props.onChange as (e: { target: { value: string } }) => void)({ target: { value: "due" } });
  const tree = h.render(); assert.ok(textOf(tree).includes("Due this month"));
  click(tree, "Edit goal"); assert.equal((find(h.render(), "GoalModal").props.goal as Goal).id, "due");
});
