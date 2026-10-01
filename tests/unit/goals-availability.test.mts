import assert from "node:assert/strict";
import test from "node:test";
import type React from "react";
import { elements, goalsHarness, textOf } from "./goals-render-harness.mts";
import { FinanceError } from "../../src/lib/domain/finance-error.ts";
import { beginFinanceResourceHydration, createFinanceResourceStatuses, settleFinanceResourceStatuses } from "../../src/lib/persistence/finance-resource-status.ts";
import type { FinanceHydrationResourceName } from "../../src/lib/persistence/finance-persistence-model.ts";
import { getGoalsAvailability, goalPlanResources } from "../../src/components/goals/goal-availability.ts";

const now = new Date();
const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
const goal = { id: "g", name: "Available goal", targetAmount: 1200, savedAmount: 100, targetDate: `${now.getFullYear() + 1}-12`, priority: "primary" as const };
const budget = { id: "b", month, category: "Food", subtitle: "", budget: 200, color: "#000" };
const ready = () => settleFinanceResourceStatuses(createFinanceResourceStatuses(), {});
const failed = (resource: FinanceHydrationResourceName, retained = false) => settleFinanceResourceStatuses(retained ? ready() : createFinanceResourceStatuses(), { [resource]: new FinanceError("repository_unavailable") });
const modal = (tree: React.ReactNode) => elements(tree).find(e => typeof e.type === "function" && e.type.name === "GoalSavingsPlanModal");
const action = (tree: React.ReactNode) => elements(tree).find(e => e.type === "button" && (textOf(e).startsWith("Apply ") || textOf(e).includes("No capacity") || textOf(e) === "Not available yet"));

for (const resource of goalPlanResources) {
  test(`Goals blocks planning when ${resource} fails, including retained snapshots`, () => {
    for (const retained of [false, true]) {
      const h = goalsHarness({ goals: [goal], budgets: [budget], resourceStatuses: failed(resource, retained) });
      const tree = h.render();
      assert.equal(getGoalsAvailability(h.data.resourceStatuses).canApplyPlan, false);
      assert.equal(modal(tree), undefined);
      if (resource === "goals") {
        assert.equal(elements(tree).filter(e => e.type === "article").length, 0);
        assert.ok(!textOf(tree).includes("No goals yet"));
      } else {
        assert.ok(textOf(tree).includes(goal.name));
        assert.ok(textOf(tree).includes("100")); // Goal-only progress remains usable.
        const button = action(tree); assert.ok(button); assert.equal(button.props.disabled, true);
        assert.ok(!textOf(tree).includes("No capacity available"));
        if (resource !== "goalContributionPlans") assert.ok(!textOf(tree).includes("€100.00 / month"));
      }
      assert.equal(h.writes.length, 0);
    }
  });
}

test("Goals treats loading prerequisites as unavailable while preserving independently ready goals", () => {
  const statuses = { ...ready(), transactions: { status: "loading" as const, hasSnapshot: true, error: null } };
  const h = goalsHarness({ goals: [goal], budgets: [budget], resourceStatuses: statuses });
  const tree = h.render(); assert.ok(textOf(tree).includes(goal.name)); assert.equal(action(tree)?.props.disabled, true);
  assert.equal(getGoalsAvailability(statuses).savingsReady, false);
});

test("Goals does not interpret never-loaded resources as confirmed absence", () => {
  const h = goalsHarness({ goals: [goal], budgets: [budget], resourceStatuses: createFinanceResourceStatuses() });
  const tree = h.render(); assert.equal(elements(tree).filter(e => e.type === "article").length, 0);
  assert.equal(modal(tree), undefined);
});

test("Goals recovery restores plan eligibility and submission with successfully empty transactions", async () => {
  const h = goalsHarness({ goals: [goal], budgets: [budget], resourceStatuses: failed("transactions") });
  assert.equal(action(h.render())?.props.disabled, true);
  h.data.resourceStatuses = beginFinanceResourceHydration(h.data.resourceStatuses);
  assert.equal(modal(h.render()), undefined);
  h.data.resourceStatuses = settleFinanceResourceStatuses(h.data.resourceStatuses, {});
  const button = action(h.render()); assert.ok(button); assert.equal(button.props.disabled, false);
  (button.props.onClick as () => void)();
  const dialog = modal(h.render()); assert.ok(dialog); assert.equal(dialog.props.savingsBoost, 100);
  await (dialog.props.onApply as () => Promise<void>)(); assert.equal(h.writes[0].type, "plan");
});

test("an open plan modal disappears when a prerequisite becomes unavailable", () => {
  const h = goalsHarness({ goals: [goal], budgets: [budget] });
  (action(h.render())!.props.onClick as () => void)(); assert.ok(modal(h.render()));
  h.data.resourceStatuses = failed("goalContributionPlans", true);
  assert.equal(modal(h.render()), undefined); assert.equal(action(h.render())?.props.disabled, true);
});

for (const resource of ["investments", "categories", "accountBalanceSettings"] as const) {
  test(`${resource} failure does not block Goals or show an unrelated load error`, () => {
    const h = goalsHarness({ goals: [goal], budgets: [budget], resourceStatuses: failed(resource), hydrationError: new Error("unrelated") });
    const tree = h.render(); assert.equal(action(tree)?.props.disabled, false);
    assert.equal(elements(tree).filter(e => e.props.role === "alert").length, 0);
  });
}

// C5A: explicit period fixtures are independent from the legacy global snapshot.
import { financialMonthRange } from '../../src/lib/dates/financial-month-range.ts';
import type { TransactionPeriodState } from '../../src/lib/persistence/transaction-period-state.ts';
import { transaction } from './finance-availability-render-harness.mts';
const periodReady = (items = [] as ReturnType<typeof transaction>[]): TransactionPeriodState => ({status:'ready',result:{completeness:'complete',range:financialMonthRange(month),items}});
for(const status of ['idle','loading','stale','refreshing','error'] as const) test(`C5A Goals ${status} never calculates with global or retained rows`,()=>{
 const retainedResult=(periodReady([transaction()]) as Extract<TransactionPeriodState,{status:'ready'}>).result;
 const period: TransactionPeriodState=status==='error'?{status,error:new FinanceError('repository_unavailable'),retainedResult}:status==='stale'||status==='refreshing'?{status,retainedResult}:{status};
 const h=goalsHarness({goals:[goal],budgets:[budget],period}); h.data.transactions.push(transaction({amount:9999}));
 const tree=h.render(); assert.ok(textOf(tree).includes(goal.name)); assert.equal(action(tree)?.props.disabled,true); assert.ok(!textOf(tree).includes('No capacity available'));
 assert.equal(getGoalsAvailability(h.data.resourceStatuses,period).savingsReady,false);
});
for(const items of [[],[transaction({dateISO:`${month}-10`,amount:20})]]) test(`C5A Goals uses verified ${items.length?'populated':'empty'} period despite failed global history`,()=>{
 const h=goalsHarness({goals:[goal],budgets:[budget],period:periodReady(items),resourceStatuses:failed('transactions')});
 h.data.transactions.push(transaction({amount:999999})); const tree=h.render(); assert.equal(action(tree)?.props.disabled,false);
 assert.ok(!textOf(tree).includes('999,999')); assert.equal(getGoalsAvailability(h.data.resourceStatuses,h.data.period!).savingsReady,true);
});
test('C5A obsolete modal callback cannot submit after invalidation or replacement; recovery can submit',async()=>{
 const h=goalsHarness({goals:[goal],budgets:[budget],period:periodReady()});
 (action(h.render())!.props.onClick as ()=>void)(); const callback=modal(h.render())!.props.onApply as ()=>Promise<void>;
 h.data.period={status:'stale'}; await callback(); assert.equal(h.writes.length,0);
 h.data.period=periodReady(); await callback(); assert.equal(h.writes.length,0);
 const fresh=modal(h.render())!.props.onApply as ()=>Promise<void>; await fresh(); assert.equal(h.writes.length,1);
});
test('C5A modal rejects changed non-transaction inputs and month rollover',async()=>{
 const h=goalsHarness({goals:[goal],budgets:[budget],period:periodReady()});
 (action(h.render())!.props.onClick as ()=>void)(); const callback=modal(h.render())!.props.onApply as ()=>Promise<void>;
 h.data.budgets=[{...budget,budget:400}];h.render();await callback();assert.equal(h.writes.length,0);
 h.setNow(new Date(now.getFullYear(),now.getMonth()+1,2));await callback();assert.equal(h.writes.length,0);
});
test('C5A Goals requests mount/auth/stale/new month without retrying persistent errors',()=>{
 const h=goalsHarness({period:{status:'idle'}}); h.render();assert.equal(h.requests.length,1);
 h.data.getTransactionPeriodState=()=>h.data.period!;h.render();assert.equal(h.requests.length,2);
 h.data.period={status:'loading'};h.render();h.data.period={status:'error',error:new FinanceError('repository_unavailable')};
 for(let i=0;i<4;i++)h.render();assert.equal(h.requests.length,2);
 h.data.period={status:'stale'};h.render();assert.equal(h.requests.length,3);
 const next=new Date(now.getFullYear(),now.getMonth()+1,2);h.setNow(next);h.render();
 assert.deepEqual(structuredClone(h.requests.at(-1)),financialMonthRange(`${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}`));
});
test('C5A stored plan information remains visible without transaction coverage',()=>{
 const h=goalsHarness({goals:[goal],budgets:[budget],period:{status:'error',error:new FinanceError('repository_unavailable')}});
 h.data.goalContributionPlans={g:{goalId:'g',monthlyTarget:50,baselineRequiredMonthlyContribution:25,savingsBoost:10,createdAt:'2026-09-01T00:00:00Z'}};
 assert.match(textOf(h.render()),/50/);assert.equal(action(h.render())?.props.disabled,true);
});
test('C5A submission rejects an estimate made on a different day in the same month',async()=>{
 const h=goalsHarness({goals:[goal],budgets:[budget],period:periodReady([transaction({dateISO:`${month}-02`,amount:20})])});
 h.setNow(new Date(now.getFullYear(),now.getMonth(),10));
 (action(h.render())!.props.onClick as ()=>void)(); const callback=modal(h.render())!.props.onApply as ()=>Promise<void>;
 h.setNow(new Date(now.getFullYear(),now.getMonth(),20)); await callback(); assert.equal(h.writes.length,0);
});
