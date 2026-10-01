/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { dashboardHarness, range, grid, key, ready, failed, nodes, text, transaction } from './dashboard-period-render-harness.mts';
import { withStatus } from './finance-availability-render-harness.mts';
import { calculateDashboardFinancialSummary, calculateDashboardTransactionSummary } from '../../src/components/dashboard/dashboard-financial-summary.ts';
import { buildFinancialFlowSeries } from '../../src/components/financial-flow/financial-flow-series.ts';
import { financeProviderHarness } from './finance-provider-harness.mts';

const fixtures=JSON.parse(readFileSync(new URL('./dashboard-summary-parity-fixtures.json',import.meta.url),'utf8'));
for(let i=0;i<fixtures.length;i++)test(`pre-extraction composite formula parity fixture ${i}`,()=>{
 const {input,expected}=fixtures[i];const result=calculateDashboardFinancialSummary({...input,now:new Date(input.now)});
 assert.deepEqual(JSON.parse(JSON.stringify(result)),expected);
 const metrics=calculateDashboardTransactionSummary({...input,now:new Date(input.now)});
 for(const field of Object.keys(metrics))assert.deepEqual((metrics as any)[field],(result as any)[field],field);
});

test('ready selected rows supply KPIs and Financial Flow with unchanged series formulas',()=>{
 const h=dashboardHarness(),tree=h.render(),kpi=h.component(tree,'DashboardKpiCards').props,flow=h.component(tree,'FinancialFlow').props;
 assert.equal(kpi.income,100);assert.equal(kpi.expenses,20);assert.equal(kpi.netCashFlow,80);assert.equal(kpi.accountBalance,456);
 assert.deepEqual(Array.from(flow.transactions,(r:any)=>r.id),['income','expense']);
 const series=buildFinancialFlowSeries({month:flow.month,transactions:flow.transactions,expectedTotals:{income:flow.income,expenses:flow.expenses,netCashFlow:flow.netCashFlow}});
 assert.equal(series.available,true);if(series.available)assert.deepEqual(series.totals,{income:100,expenses:20,netCashFlow:80});
 assert.ok(h.calls.includes('markWelcomeSeen'),'Welcome action is a local stub');assert.equal(h.writes.length,0);
});
test('ready empty selected month is zero activity, not first access with historical history',()=>{
 const h=dashboardHarness();h.states.set(key(range),ready(range,[]));h.data.transactions=[transaction({dateISO:'2020-01-01'})];
 const tree=h.render();assert.equal(h.component(tree,'DashboardKpiCards').props.income,0);assert.equal(h.component(tree,'FinancialFlow').props.transactions.length,0);assert.ok(!h.component(tree,'DashboardEmptyState'));
});
for(const status of ['idle','loading','error','stale','refreshing'] as const)test(`selected ${status}: no monthly derivations or retained rows; balance and goals remain independent`,()=>{
 const h=dashboardHarness();const retainedResult={completeness:'complete' as const,range,items:[transaction({description:'Obsolete retained',amount:999})]};
 h.states.set(key(range),status==='error'?{...failed(),retainedResult} as any:status==='stale'||status==='refreshing'?{status,retainedResult}:{status});
 const tree=h.render(),kpi=h.component(tree,'DashboardKpiCards').props;
 assert.equal(kpi.income,null);assert.equal(kpi.expenses,null);assert.equal(kpi.aggregationAvailable,false);assert.equal(kpi.accountBalance,456);assert.equal(h.data.accountBalance,456);
 assert.ok(!h.component(tree,'FinancialFlow'));
 for(const name of ['calculateDashboardTransactionSummary','calculateBudgetProjection','calculateGoalSavingsCapacity','calculateNextBestAction'])assert.ok(!h.calls.includes(name),name);
 assert.equal(h.component(tree,'GoalsStatusCard').props.availability,'ready');
 assert.equal(h.component(tree,'MonthlyStatusCard').props.availability,status==='error'?'error':'loading');
});
test('selected recovery restores metrics without changing account balance',()=>{
 const h=dashboardHarness();h.states.set(key(range),failed());assert.equal(h.component(h.render(),'DashboardKpiCards').props.expenses,null);
 h.states.set(key(range),ready());assert.equal(h.component(h.render(),'DashboardKpiCards').props.expenses,20);assert.equal(h.data.accountBalance,456);
});
test('wrong selected range, including empty, cannot supply metrics or positive existence',()=>{
 const h=dashboardHarness();h.states.set(key(range),ready(grid,[]));assert.equal(h.view().status,'error');assert.equal(h.view().metrics,null);
 h.states.set(key(range),ready(grid));assert.equal(h.view().rows,null);
});
test('contradictory global rows cannot change monthly KPIs, flow, projection, savings or recommendation',()=>{
 const h=dashboardHarness(),baseline=h.view();h.data.transactions=[transaction({amount:900000,id:'wrong'}),transaction({amount:800000,dateISO:'2026-08-01',id:'old'})];
 const next=h.view();assert.deepEqual(next,baseline);
 const tree=h.render();assert.equal(h.component(tree,'DashboardKpiCards').props.expenses,20);assert.ok(h.component(tree,'FinancialFlow').props.transactions.every((r:any)=>r.id!=='wrong'));
});
for(const resource of ['budgets','budgetAdjustments','goals','goalContributionPlans','investments','categories'] as const)test(`${resource} failure blocks only dependent sections`,()=>{
 const h=dashboardHarness();h.data.resourceStatuses=withStatus(resource,'error',true);
 h.data[resource]=new Proxy(resource==='budgetAdjustments'||resource==='goalContributionPlans'?{}:[],{get(){throw new Error(`Unavailable ${resource} read`);}});
 const view=h.view();assert.equal(view.metrics.expenses,20);
 if(resource==='budgets'){assert.equal(view.projection,null);assert.equal(view.savings,null);}
 else assert.ok(view.projection);
 if(resource==='budgetAdjustments'){assert.equal(view.savings,null);assert.equal(view.action,null);}
 if(resource==='goals'){assert.equal(view.primaryGoal,null);assert.equal(view.goalsStatus,'error');}
 if(resource==='goalContributionPlans'){assert.ok(view.primaryGoal);assert.equal(view.plansStatus,'error');}
 if(resource==='investments'||resource==='categories')assert.ok(view.action);
 const tree=h.render();assert.equal(h.component(tree,'DashboardKpiCards').props.expenses,20);
});
test('stored plans remain visible but review is unavailable without selected coverage',()=>{
 const h=dashboardHarness();h.data.goalContributionPlans={goal:{goalId:'goal',monthlyTarget:50,baselineRequiredMonthlyContribution:25,savingsBoost:25,createdAt:'2026-09-01T00:00:00Z'}};
 h.states.set(key(range),failed());const v=h.view();assert.equal(v.primaryGoal.contributionPlan.monthlyTarget,50);assert.equal(v.planReviewStatus,'error');
 const details=h.renderChild(h.render(),'GoalsStatusCard');const child=nodes(details).find(n=>n.type?.name==='GoalDetails');const rendered=h.mountComponent(child.type,child.props).render();
 assert.ok(text(rendered).includes('50'));assert.ok(!text(rendered).includes('Active'));
});

test('calendar derives exact leading/trailing spillover and month-equal grid',()=>{
 const helper=dashboardHarness().load('src/components/dashboard/dashboard-view-state.ts');
 assert.deepEqual(structuredClone(helper.dashboardCalendarRange('2026-09')),grid);
 assert.deepEqual(structuredClone(helper.dashboardCalendarRange('2021-02')),{startISO:'2021-02-01',endExclusiveISO:'2021-03-01'});
 assert.equal(helper.dashboardCalendarRange('bad'),null);assert.equal(helper.dashboardFinancialRange('9998-12'),null);
});
test('calendar indicators and daily details use only verified grid rows, including both spillovers',()=>{
 const h=dashboardHarness();const calendarRows=[transaction({id:'leading',dateISO:'2026-08-31',description:'Leading'}),transaction({id:'trailing',dateISO:'2026-10-04',description:'Trailing'}),transaction({id:'grid-month',dateISO:'2026-09-10',description:'Grid month'})];
 h.states.set(key(grid),ready(grid,calendarRows));h.data.transactions=[transaction({id:'wrong-global',description:'Wrong global'})];
 h.states.set(key(range),ready(range,[transaction({id:'wrong-month',description:'Wrong monthly'})]));h.openCalendar();
 const tree=h.render(),calendar=h.component(tree,'FinancialCalendar');assert.deepEqual(Array.from(calendar.props.events,(e:any)=>e.id),['leading','grid-month','trailing']);
 const rendered=h.renderChild(tree,'FinancialCalendar');const gridComponent=h.component(rendered,'CalendarGrid');const cells=h.mountComponent(gridComponent.type,gridComponent.props).render();
 for(const id of ['31 August','4 October'])assert.ok(nodes(cells).some(n=>n.props['aria-label']?.includes(id)&&n.props['aria-label'].includes('Paid')));
 assert.ok(!text(rendered).includes('Wrong global'));
 // Existing paid-month calculation must exclude both adjacent-month amounts.
 const summaries=nodes(rendered).filter(n=>n.type?.name==='Summary');assert.equal(summaries[1].props.value,'20');
});
for(const failedSide of ['month','calendar'] as const)test(`${failedSide} failure does not block the other range; recovery is independent`,()=>{
 const h=dashboardHarness();h.states.set(key(failedSide==='month'?range:grid),failed());
 const tree=h.render();assert.equal(h.component(tree,'DashboardKpiCards').props.expenses,failedSide==='month'?null:20);
 h.openCalendar();const cal=h.render();assert.equal(Boolean(h.component(cal,'FinancialCalendar')),failedSide==='month');
 h.states.set(key(failedSide==='month'?range:grid),ready(failedSide==='month'?range:grid));assert.ok(h.component(h.render(),'FinancialCalendar'));
 nodes(h.render()).find(n=>n.type==='button'&&n.props.className==='dashboard-cta-button').props.onClick();assert.equal(h.component(h.render(),'DashboardKpiCards').props.expenses,20);
});
for(const status of ['loading','stale','refreshing','error'] as const)test(`calendar ${status} never derives events from retained, global or monthly rows`,()=>{
 const h=dashboardHarness();h.states.set(key(grid),status==='error'?failed():status==='loading'?{status}:{status,retainedResult:{completeness:'complete',range:grid,items:[transaction()]}});h.openCalendar();
 const tree=h.render();assert.ok(!h.component(tree,'FinancialCalendar'));assert.ok(!h.calls.includes('eventsFromTransactions'));
});
test('wrong calendar range is rejected independently',()=>{
 const h=dashboardHarness();h.states.set(key(grid),ready(range));h.openCalendar();assert.ok(!h.component(h.render(),'FinancialCalendar'));
});
test('financial request is immediate; calendar is lazy; month and adjacent-day navigation request exact ranges',()=>{
 const h=dashboardHarness();h.render();assert.deepEqual(structuredClone(h.data.requests),[range]);h.openCalendar();h.render();assert.deepEqual(structuredClone(h.data.requests),[range,grid]);
 h.component(h.render(),'FinancialCalendar').props.onSelectDay('2026-10-04');h.render();
 assert.deepEqual(structuredClone(h.data.requests.slice(-2)),[{startISO:'2026-10-01',endExclusiveISO:'2026-11-01'},{startISO:'2026-09-28',endExclusiveISO:'2026-11-02'}]);
 h.component(h.render(),'DashboardMonthSelector').props.onMonthChange('2026-01');h.render();assert.deepEqual(structuredClone(h.data.requests.slice(-2)),[{startISO:'2026-01-01',endExclusiveISO:'2026-02-01'},{startISO:'2025-12-29',endExclusiveISO:'2026-02-02'}]);
});
for(const which of ['financial','calendar'] as const)test(`${which} stale requests again; persistent errors do not loop`,()=>{
 const h=dashboardHarness();h.openCalendar();h.render();const target=which==='financial'?range:grid;h.states.set(key(target),{status:'stale'});h.render();assert.equal(h.data.requests.length,3);
 h.states.set(key(target),failed());h.render();h.render();assert.equal(h.data.requests.length,3);
});
test('actual provider deduplicates identical month/grid and shares ready result, including auth transition',async()=>{
 const provider=financeProviderHarness();const h=dashboardHarness('dark',new Date(2021,1,15));
 const connect=()=>{const api=provider.render();Object.assign(h.data,{getTransactionPeriodState:api.getTransactionPeriodState,ensureTransactionPeriod:api.ensureTransactionPeriod});};
 connect();h.openCalendar();h.render();assert.equal(provider.periods.length,0);await provider.flush();connect();h.render();await provider.flush();assert.equal(provider.periods.length,1);
 const scope={startISO:'2021-02-01',endExclusiveISO:'2021-03-01'};assert.deepEqual(structuredClone(provider.periods[0].range),scope);
 provider.periods[0].resolve({completeness:'complete',range:scope,items:[]});await provider.flush();connect();assert.ok(h.component(h.render(),'FinancialCalendar'));await provider.flush();assert.equal(provider.periods.length,1);provider.dispose();
});

function existenceFixture(){const h=dashboardHarness();h.data.transactions=[];h.data.budgets=[];h.data.goals=[];h.data.accountBalanceSettings=null;return h;}
const exists=(h:ReturnType<typeof dashboardHarness>,selectedRows:any=null)=>h.load('src/components/dashboard/dashboard-view-state.ts').dashboardFinancialExistence({...h.data,selectedRows});
test('verified selected activity proves existence despite unavailable global history',()=>{const h=existenceFixture();h.data.resourceStatuses=withStatus('transactions','error');assert.equal(exists(h,[transaction()]),true);});
for(const resource of ['transactions','budgets','goals','accountBalanceSettings'] as const)test(`ready ${resource} independently proves existence; retained evidence does not`,()=>{
 const h=existenceFixture();h.data[resource]=resource==='accountBalanceSettings'?{openingBalance:0,openingDate:'2020-01-01'}:[transaction()];assert.equal(exists(h),true);
 h.data.resourceStatuses=withStatus(resource,'error',true);assert.equal(exists(h),null);
});
test('all ready empty is false and shows first-access only after selected ready empty',()=>{
 const h=existenceFixture();h.states.set(key(range),ready(range,[]));assert.equal(exists(h),false);assert.ok(h.component(h.render(),'DashboardEmptyState'));
});
test('unknown existence is not false absence and unavailable global arrays are not inspected',()=>{
 const h=existenceFixture();h.states.set(key(range),ready(range,[]));h.data.resourceStatuses=withStatus('transactions','error',true);
 h.data.transactions=new Proxy([],{get(){throw new Error('unavailable global history read');}});assert.equal(exists(h),null);const tree=h.render();assert.ok(!h.component(tree,'DashboardEmptyState'));assert.equal(h.component(tree,'DashboardKpiCards').props.expenses,0);
 assert.equal(h.component(tree,'DashboardMonthSelector').props.transactionDates.length,0);
});
test('historical month indicators remain global while selected totals stay bounded',()=>{
 const h=dashboardHarness();h.data.transactions=[transaction({dateISO:'2020-01-01',amount:900})];const tree=h.render();assert.deepEqual(Array.from(h.component(tree,'DashboardMonthSelector').props.transactionDates),['2020-01-01']);assert.equal(h.component(tree,'DashboardKpiCards').props.expenses,20);
});
for(const theme of ['light','dark'] as const)test(`${theme} card shells preserve unavailable versus legitimate absence`,()=>{
 const h=dashboardHarness(theme);h.data.goals=[];h.data.budgets=[];let tree=h.render();
 const readyGoal=h.renderChild(tree,'GoalsStatusCard'),readyMonthly=h.renderChild(tree,'MonthlyStatusCard');
 assert.ok(text(readyGoal).includes('goal'));assert.ok(!h.component(readyGoal,'DashboardSectionState'));
 h.data.resourceStatuses={...withStatus('goals','error'),budgets:withStatus('budgets','error').budgets};tree=h.render();
 const unavailableGoal=h.renderChild(tree,'GoalsStatusCard'),unavailableMonthly=h.renderChild(tree,'MonthlyStatusCard'),unavailableAction=h.renderChild(tree,'NextBestActionCard');
 assert.ok(h.component(unavailableGoal,'DashboardSectionState'));assert.ok(h.component(unavailableMonthly,'DashboardSectionState'));assert.ok(h.component(unavailableAction,'DashboardSectionState'));
 assert.equal(unavailableGoal.props.className,readyGoal.props.className);assert.equal(unavailableMonthly.props.className,readyMonthly.props.className);
 assert.ok(!text(unavailableMonthly).includes('Create budget'));assert.ok(!nodes(unavailableAction).some(n=>n.props.href));
});
test('plans failure preserves goal metrics without presenting plan absence as a current assessment',()=>{
 const h=dashboardHarness();h.data.resourceStatuses=withStatus('goalContributionPlans','error');const tree=h.renderChild(h.render(),'GoalsStatusCard');assert.ok(!text(tree).includes('No goal'));
 const details=h.component(tree,'GoalDetails'),rendered=h.mountComponent(details.type,details.props).render();assert.ok(h.component(rendered,'DashboardSectionState'));assert.ok(!text(rendered).includes('On schedule'));
});
