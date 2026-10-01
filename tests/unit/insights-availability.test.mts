import assert from "node:assert/strict";
import test from "node:test";
import type { getInsightsViewState } from "../../src/components/insights/insights-view-state.ts";

import { availabilityHarness, financeData, month, readyStatuses, withStatus } from "./finance-availability-render-harness.mts";

const page = "src/app/insights/page.tsx";
for (const resource of ["transactions", "budgets", "budgetAdjustments", "goals", "goalContributionPlans"] as const) {
  for (const status of ["loading", "error", "unavailable"] as const) {
    for (const hasSnapshot of [false, true]) test(`Insights ${resource} ${status}, snapshot=${hasSnapshot}: prerequisites gate invocation`, () => {
      const data = financeData(); data.resourceStatuses = withStatus(resource, status, hasSnapshot);
      const harness = availabilityHarness(data);
      const html = harness.render(page);
      assert.ok(!harness.calls.includes("calculateDashboardFinancialSummary"));
      assert.ok(!harness.calls.includes("calculateNextBestAction"));
      if (resource === "transactions") {
        assert.ok(!harness.calls.includes("calculateCurrentTransactionAggregates"));
        assert.ok(!harness.calls.includes("calculateBudgetProjection"));
        assert.match(html, /Independent goal/);
        assert.doesNotMatch(html, /20%|Chart 20|No spending data yet|No income data yet/);
      } else assert.match(html, /20%/);
      if (resource === "goals") {
        assert.ok(!harness.calls.includes("calculateGoal"));
        assert.doesNotMatch(html, /Independent goal|No goal yet|Create a goal to measure/);
      }
      if (["transactions", "budgets", "budgetAdjustments"].includes(resource)) assert.ok(!harness.calls.includes("calculateGoalSavingsCapacity"));
    });
  }
}

test("Insights successful empty data is distinct from failed empty data", () => {
  const data = financeData(); data.transactions = []; data.goals = []; data.budgets = [];
  const harness = availabilityHarness(data);
  const ready = harness.render(page);
  assert.match(ready, /No goal yet|No spending data yet/);
  data.resourceStatuses = withStatus("transactions", "error");
  const failed = harness.render(page);
  assert.doesNotMatch(failed, /No spending data yet|No income data yet/);
  assert.ok(!harness.calls.includes("calculateNextBestAction"));
  data.resourceStatuses = readyStatuses();
  assert.equal(harness.render(page), ready);
});

test("Insights unrelated failures leave all implemented derivations usable", () => {
  const baseline = availabilityHarness().render(page);
  for (const resource of ["investments", "categories", "accountBalanceSettings"] as const) {
    const data = financeData(); data.resourceStatuses = withStatus(resource, "error"); data.hydrationError = new Error("unrelated"); data.isHydrating = true;
    assert.equal(availabilityHarness(data).render(page), baseline);
  }
});

test("Insights savings and current spending survive missing goal plans and invalid prior period", () => {
  const data = financeData(); data.resourceStatuses = withStatus("goalContributionPlans", "error", true);
  data.transactions.push({ ...data.transactions[1], id: "prior", dateISO: "2026-08-10", amount: NaN });
  const getView = availabilityHarness(data).load("src/components/insights/insights-view-state.ts").getInsightsViewState as typeof getInsightsViewState;
  const view = getView({ ...data, period: data.getTransactionPeriodState({ startISO: `${month}-01`, endExclusiveISO: "2026-10-01" }), month, now: new Date(2026, 8, 15) });
  assert.equal(view.transactions?.expenses, 20);
  assert.equal(view.savings?.available, true);
  assert.ok(view.savings?.safeMonthlyCapacity && view.savings.safeMonthlyCapacity > 0);
  assert.equal(view.goal?.name, "Independent goal");
  assert.equal(view.action, null);
  assert.equal(view.categorySpending?.[0].amount, 20);
});

import { financialMonthRange } from '../../src/lib/dates/financial-month-range.ts';
import { FinanceError } from '../../src/lib/domain/finance-error.ts';
import type { TransactionPeriodState } from '../../src/lib/persistence/transaction-period-state.ts';
import type { insightsFinancialExistence } from '../../src/components/insights/insights-view-state.ts';
const verified = (items = financeData().transactions): TransactionPeriodState => ({status:'ready',result:{completeness:'complete',range:financialMonthRange(month),items}});
for(const status of ['idle','loading','stale','refreshing','error'] as const) test(`C5A Insights ${status} gates all period derivations`,()=>{
 const data=financeData(); const retainedResult=(verified() as Extract<TransactionPeriodState,{status:'ready'}>).result;
 data.period=status==='error'?{status,error:new FinanceError('repository_unavailable'),retainedResult}:status==='stale'||status==='refreshing'?{status,retainedResult}:{status};
 const h=availabilityHarness(data);const html=h.render(page);
 for(const name of ['calculateCurrentTransactionAggregates','calculateBudgetProjection','calculateGoalSavingsCapacity','calculateDashboardFinancialSummary','calculateNextBestAction'])assert.ok(!h.calls.includes(name));
 assert.match(html,/Independent goal/);data.period=verified();assert.match(h.render(page),/20%/);
});
test('C5A Insights ready period ignores contradictory failed global rows',()=>{
 const data=financeData();data.period=verified();data.transactions=[{...data.transactions[0],amount:999999}];data.resourceStatuses=withStatus('transactions','error',true);
 const h=availabilityHarness(data);const html=h.render(page);assert.match(html,/20%/);assert.doesNotMatch(html,/999999/);assert.ok(h.calls.includes('calculateNextBestAction'));
});
test('C5A historical existence is separate, including unknown and historical-only activity',()=>{
 const data=financeData();data.period=verified([]);data.budgets=[];data.goals=[];
 const h=availabilityHarness(data);const existence=h.load('src/components/insights/insights-view-state.ts').insightsFinancialExistence as typeof insightsFinancialExistence;
 const input=()=>({period:data.period!,resourceStatuses:data.resourceStatuses,globalTransactionCount:data.transactions.length,budgetCount:data.budgets.length,goalCount:data.goals.length});
 data.transactions=data.transactions.map(item=>({...item,dateISO:'2026-08-10'}));assert.equal(existence(input()),true);assert.doesNotMatch(h.render(page),/No insights yet/);
 data.resourceStatuses=withStatus('transactions','error',true);assert.equal(existence(input()),null);
 const html=h.render(page);assert.doesNotMatch(html,/No insights yet/);assert.match(html,/Chart 0/);assert.ok(h.calls.includes('calculateCurrentTransactionAggregates'));
 data.transactions=[];data.resourceStatuses=readyStatuses();assert.equal(existence(input()),false);
});
test('C5A Insights equivalent verified rows preserve formula outputs',()=>{
 const data=financeData();data.period=verified();const h=availabilityHarness(data);
 const getView=h.load('src/components/insights/insights-view-state.ts').getInsightsViewState as typeof getInsightsViewState;
 const formula=h.load('src/components/dashboard/dashboard-financial-summary.ts').calculateDashboardFinancialSummary as (input:unknown)=>unknown;
 const input={...data,period:data.period,month,now:new Date(2026,8,15)};
 assert.deepEqual(structuredClone(getView(input).summary),structuredClone(formula(input)));
});
test('C5A Insights effect requests auth/stale/range transitions without an error loop',()=>{
 const data=financeData();data.period={status:'idle'};const h=availabilityHarness(data);h.render(page);assert.equal(data.requests.length,1);
 data.getTransactionPeriodState=()=>data.period!;h.render(page);assert.equal(data.requests.length,2);
 data.period={status:'loading'};h.render(page);data.period={status:'error',error:new FinanceError('repository_unavailable')};for(let i=0;i<4;i++)h.render(page);assert.equal(data.requests.length,2);
 data.period={status:'stale'};h.render(page);assert.equal(data.requests.length,3);
 h.setNow(new Date(2026,11,2));h.render(page);assert.deepEqual(structuredClone(data.requests.at(-1)),financialMonthRange('2026-12'));
});
