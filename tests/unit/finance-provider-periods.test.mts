import assert from 'node:assert/strict';
import test from 'node:test';
import { financeProviderHarness } from './finance-provider-harness.mts';
import { createEmptyFinanceData, settleFinanceResourceLoaders, type FinanceResourceLoaders } from '../../src/lib/persistence/finance-hydration.ts';
import { financeResourceNames } from '../../src/lib/persistence/finance-persistence-model.ts';
import type { Transaction } from '../../src/components/transactions/transaction-model.ts';
const sep={startISO:'2026-09-01',endExclusiveISO:'2026-10-01'}, aug={startISO:'2026-08-01',endExclusiveISO:'2026-09-01'};
const row=(dateISO='2026-09-10',id='t'): Transaction & { category: string; categoryColor: string }=>({id,dateISO,description:'Synthetic',category:'Food',categoryColor:'#000',classification:{kind:'legacy',categoryId:null,categoryNameSnapshot:'Food',categoryColorSnapshot:'#000',normalizedCategorySnapshot:'food'},payment:'Card',date:dateISO,origin:'Manual',type:'expense',amount:1});
const complete=(range=sep,items: Transaction[]=[])=>({completeness:'complete' as const,range,items});
async function setup(){const h=financeProviderHarness(); await h.flush(); h.controlWrites(); return h;}
async function ready(h: Awaited<ReturnType<typeof setup>>,range=sep,items:Transaction[]=[]){const p=h.render().ensureTransactionPeriod(range); await h.flush(); h.periods.at(-1)!.resolve(complete(range,items)); await p; return h.flush();}
test('on demand only; populated and empty independent of global hydration',async()=>{
 const h=await setup(); assert.equal(h.periods.length,0); const state=await ready(h,sep,[row()]);
 assert.equal(state.getTransactionPeriodState(sep).status,'ready'); assert.equal(state.transactions.length,0); assert.equal(state.resourceStatuses.transactions.status,'loading');
 const data=createEmptyFinanceData(); data.transactions=[row('2026-08-01')];
 h.loads[0].resolve(await settleFinanceResourceLoaders(Object.fromEntries(financeResourceNames.map(key=>[key,async()=>data[key]])) as FinanceResourceLoaders));
 const next=await h.flush(); assert.equal(next.transactions[0].dateISO,'2026-08-01'); assert.equal(next.getTransactionPeriodState(aug).status,'idle'); assert.equal(next.getTransactionPeriodState(sep).status,'ready');
 await ready(h,aug); h.dispose();
});
test('initial failure, refresh retention, explicit recovery and independent errors',async()=>{
 const h=await setup(); const first=h.render().ensureTransactionPeriod(aug); await h.flush(); h.periods[0].reject(new Error('private')); await first;
 const state=h.render().getTransactionPeriodState(aug); assert.equal(state.status,'error'); assert.ok(!('result' in state));
 await ready(h,sep,[row()]); const p=h.render().refreshTransactionPeriod(sep); assert.equal(h.render().getTransactionPeriodState(sep).status,'refreshing'); await h.flush(); h.periods.at(-1)!.reject(new Error('private')); await p;
 const failed=h.render().getTransactionPeriodState(sep); assert.equal(failed.status,'error'); assert.ok('retainedResult' in failed); assert.ok(!('result' in failed)); assert.equal(h.render().hydrationError,null);
 await ready(h,sep); assert.equal(h.render().getTransactionPeriodState(aug).status,'error'); h.dispose();
});
for(const mode of ['logout','switch','aba','unmount']) test(`owner isolation: ${mode}`,async()=>{
 const h=await setup(); const p=h.render().ensureTransactionPeriod(sep); await h.flush();
 if(mode==='unmount') h.dispose(); else {h.auth(mode==='logout'?null:'user-b'); assert.equal(h.render().getTransactionPeriodState(sep).status,'idle'); if(mode==='aba')h.auth('user-a');}
 h.periods[0].resolve(complete(sep,[row()])); await p; await h.flush(); assert.equal(h.render().getTransactionPeriodState(sep).status,'idle');
 if(mode!=='unmount')h.dispose();
});
test('unresolved auth cannot request period',async()=>{const h=financeProviderHarness(); await h.render().ensureTransactionPeriod(sep); assert.equal(h.periods.length,0); await h.flush(); h.dispose();});
for(const oldFails of [false,true]) test(`provider refresh supersedes, deduplicates and ignores old ${oldFails?'error':'success'}`,async()=>{
 const h=await setup(); const a=h.render().ensureTransactionPeriod(sep); assert.equal(h.render().ensureTransactionPeriod(sep),a); await h.flush();
 const b=h.render().refreshTransactionPeriod(sep); await h.flush(); if(oldFails)h.periods[0].reject(new Error('old'));else h.periods[0].resolve(complete()); await a;
 assert.equal(h.render().ensureTransactionPeriod(sep),b); h.periods[1].resolve(complete(sep,[row()])); await b; assert.equal(h.render().getTransactionPeriodState(sep).status,'ready'); h.dispose();
});
for(const operation of ['create','delete','update','move','link','unlink','import','unknown','failure']) test(`mutation invalidation: ${operation}`,async()=>{
 const h=await setup(); await ready(h,sep,[row()]); await ready(h,aug,[row('2026-08-10','a')]);
 const api=h.render(); let p:Promise<unknown>;
 if(operation==='create'||operation==='failure')p=api.createTransaction(row());
 else if(operation==='delete')p=api.deleteTransaction('t');
 else if(operation==='unknown')p=api.deleteTransaction('missing');
 else if(operation==='update'||operation==='move')p=api.updateTransaction(row(operation==='move'?'2026-08-10':'2026-09-10'));
 else if(operation==='link')p=api.linkTransactionCategory('t',{kind:'linked',categoryId:'c',legacyName:'Food',legacyColor:'#000'});
 else if(operation==='unlink')p=api.unlinkTransactionCategory('t');
 else p=api.importTransactions([row(),row('2026-08-10','a')]);
 const rejection=operation==='failure'?assert.rejects(p):null;
 const write=h.writes.at(-1)!;
 if(operation==='failure')write.reject(new TypeError('network private'));
 else write.resolve(operation==='import'?[row(),row('2026-08-10','a')]:operation==='delete'||operation==='unknown'?undefined:row(operation==='move'?'2026-08-10':'2026-09-10'));
 if(rejection)await rejection;else await p;
 assert.equal(h.render().getTransactionPeriodState(sep).status,'stale');
 assert.equal(h.render().getTransactionPeriodState(aug).status,['move','import','unknown'].includes(operation)?'stale':'ready');
 if(operation==='failure')assert.equal(h.render().mutationState.status,'error'); h.dispose();
});
test('mutation during retrieval invalidates old response; later edit failure cannot restore ready',async()=>{
 const h=await setup(); await ready(h,sep,[row()]); const request=h.render().refreshTransactionPeriod(sep); await h.flush();
 const mutation=h.render().unlinkTransactionCategory('t'); h.writes.at(-1)!.resolve(row()); await mutation;
 h.periods.at(-1)!.resolve(complete(sep,[row()])); await request; assert.equal(h.render().getTransactionPeriodState(sep).status,'stale');
 const later=h.render().updateTransaction(row()); const rejected=assert.rejects(later); h.writes.at(-1)!.reject(new Error('ambiguous')); await rejected;
 assert.equal(h.render().getTransactionPeriodState(sep).status,'stale'); h.dispose();
});
test('provider rejects wrong range result',async()=>{const h=await setup(); const p=h.render().ensureTransactionPeriod(sep); await h.flush(); h.periods[0].resolve(complete(aug)); await p; assert.equal(h.render().getTransactionPeriodState(sep).status,'error'); h.dispose();});
test('back-to-back mutation callbacks use current global dates without rerender',async()=>{
 const h=await setup(); await ready(h,sep); await ready(h,aug); const api=h.render(); const create=api.createTransaction(row()); h.writes.at(-1)!.resolve(row()); await create;
 await ready(h,sep); const move=api.updateTransaction(row('2026-08-10')); h.writes.at(-1)!.resolve(row('2026-08-10')); await move;
 assert.equal(h.render().getTransactionPeriodState(sep).status,'stale'); assert.equal(h.render().getTransactionPeriodState(aug).status,'stale'); h.dispose();
});
test('confirmed date after move overrides older retained snapshots for later classification',async()=>{
 const h=await setup(); await ready(h,sep,[row()]); await ready(h,aug);
 const move=h.render().updateTransaction(row('2026-08-10')); h.writes.at(-1)!.resolve(row('2026-08-10')); await move;
 await ready(h,sep); await ready(h,aug,[row('2026-08-10')]);
 const classify=h.render().unlinkTransactionCategory('t'); h.writes.at(-1)!.resolve(row('2026-08-10')); await classify;
 assert.equal(h.render().getTransactionPeriodState(sep).status,'ready'); assert.equal(h.render().getTransactionPeriodState(aug).status,'stale'); h.dispose();
});
test('provider invalidates overlapping ranges but not exclusive-end neighbor using confirmed creation date',async()=>{
 const h=await setup(); const overlap={startISO:'2026-08-15',endExclusiveISO:'2026-09-15'};
 await ready(h,sep); await ready(h,aug); await ready(h,overlap);
 const create=h.render().createTransaction(row('2026-08-01')); h.writes.at(-1)!.resolve(row('2026-09-01')); await create;
 assert.equal(h.render().getTransactionPeriodState(sep).status,'stale'); assert.equal(h.render().getTransactionPeriodState(overlap).status,'stale'); assert.equal(h.render().getTransactionPeriodState(aug).status,'ready'); h.dispose();
});

import { financialMonthRange } from '../../src/lib/dates/financial-month-range.ts';
import { getCurrentFinancialMonth } from '../../src/components/goals/goal-savings-capacity.ts';
import { goalsHarness } from './goals-render-harness.mts';
import { availabilityHarness, financeData } from './finance-availability-render-harness.mts';
const contribution={goalId:'g',monthlyTarget:50,baselineRequiredMonthlyContribution:25,savingsBoost:25,createdAt:'2026-09-01T00:00:00Z'};
async function planProvider(failure: string|null='transactions') {
 const h=await setup();const data=createEmptyFinanceData();
 h.loads[0].resolve(await settleFinanceResourceLoaders(Object.fromEntries(financeResourceNames.map(key=>[key,async()=>{if(key===failure)throw new TypeError('offline');return data[key];}])) as FinanceResourceLoaders));
 await h.flush();return h;
}
test('C5A legacy plan retains global guard; ready current period authorizes additive call',async()=>{
 const h=await planProvider();const range=financialMonthRange(getCurrentFinancialMonth());await ready(h,range);
 await assert.rejects(h.render().upsertGoalContributionPlan(contribution));assert.equal(h.plans.length,0);
 await h.render().upsertGoalContributionPlan(contribution,range);assert.equal(h.plans.length,1);h.dispose();
});
for(const resource of ['goals','budgets','budgetAdjustments','goalContributionPlans'])test(`C5A period plan still requires ${resource}`,async()=>{
 const h=await planProvider(resource);const range=financialMonthRange(getCurrentFinancialMonth());await ready(h,range);
 await assert.rejects(h.render().upsertGoalContributionPlan(contribution,range));assert.equal(h.plans.length,0);h.dispose();
});
test('C5A provider rejects absent, wrong-month and refreshing period even with ready global history',async()=>{
 const h=await planProvider(null);const range=financialMonthRange(getCurrentFinancialMonth());
 await assert.rejects(h.render().upsertGoalContributionPlan(contribution,range));
 const other={startISO:'2020-01-01',endExclusiveISO:'2020-02-01'};await ready(h,other);
 await assert.rejects(h.render().upsertGoalContributionPlan(contribution,other));await assert.rejects(h.render().upsertGoalContributionPlan(contribution,range));
 await ready(h,range);const refresh=h.render().refreshTransactionPeriod(range);await h.flush();await assert.rejects(h.render().upsertGoalContributionPlan(contribution,range));
 h.periods.at(-1)!.reject(new Error('offline'));await refresh;await assert.rejects(h.render().upsertGoalContributionPlan(contribution,range));assert.equal(h.plans.length,0);h.dispose();
});
test('C5A actual Goals/Insights effects share provider request and retry after unresolved auth',async()=>{
 const provider=financeProviderHarness();const goals=goalsHarness();const insightsData=financeData();const insights=availabilityHarness(insightsData);
 const date=new Date();goals.setNow(date);insights.setNow(date);
 const connect=()=>{const {getTransactionPeriodState,ensureTransactionPeriod}=provider.render();Object.assign(goals.data,{getTransactionPeriodState,ensureTransactionPeriod});Object.assign(insightsData,{getTransactionPeriodState,ensureTransactionPeriod});};
 connect();goals.render();insights.render('src/app/insights/page.tsx');assert.equal(provider.periods.length,0);
 await provider.flush();connect();goals.render();insights.render('src/app/insights/page.tsx');await provider.flush();assert.equal(provider.periods.length,1);
 assert.deepEqual(structuredClone(provider.periods[0].range),financialMonthRange(getCurrentFinancialMonth()));
 provider.periods[0].resolve(complete(provider.periods[0].range));await provider.flush();connect();goals.render();insights.render('src/app/insights/page.tsx');await provider.flush();assert.equal(provider.periods.length,1);provider.dispose();
});

import { p03cHarness, nodes } from './p03c-render-harness.mts';
test('C5B actual Transactions effects deduplicate both ranges, reuse ready coverage and resume after unresolved auth', async () => {
 const provider=financeProviderHarness();
 const first=p03cHarness(), second=p03cHarness();
 const props={initialMonth:'2026-09',currentMonth:'2026-09',openStatementImport:false};
 const pageA=first.mount('src/app/transactions/page.tsx','TransactionsPageContent',props);
 const pageB=second.mount('src/app/transactions/page.tsx','TransactionsPageContent',props);
 const connect=()=>{const {getTransactionPeriodState,ensureTransactionPeriod}=provider.render();Object.assign(first.data,{getTransactionPeriodState,ensureTransactionPeriod});Object.assign(second.data,{getTransactionPeriodState,ensureTransactionPeriod});};
 connect();pageA.render();pageB.render();assert.equal(provider.periods.length,0);
 await provider.flush();connect();pageA.render();pageB.render();await provider.flush();assert.equal(provider.periods.length,2);
 assert.deepEqual(structuredClone(provider.periods.map(p=>p.range)),[sep,aug]);
 provider.periods[0].resolve(complete(sep,[row()]));provider.periods[1].reject(new Error('offline'));
 await provider.flush();connect();const tree=pageA.render();pageB.render();await provider.flush();assert.equal(provider.periods.length,2);
 const kpi=nodes(tree).find(n=>n.type?.name==='TransactionsKpiCards');assert.equal(kpi.props.aggregates.expenses,1);assert.equal(kpi.props.aggregates.previousExpenses,null);
 connect();pageA.render();pageB.render();await provider.flush();assert.equal(provider.periods.length,2,'No persistent error retry or ready refresh');
 const third=p03cHarness();Object.assign(third.data,{getTransactionPeriodState:provider.render().getTransactionPeriodState,ensureTransactionPeriod:provider.render().ensureTransactionPeriod});
 const pageC=third.mount('src/app/transactions/page.tsx','TransactionsPageContent',{...props,initialMonth:'2026-10'});pageC.render();await provider.flush();
 assert.equal(provider.periods.length,3,'Ready September is reused as October comparison');assert.deepEqual(structuredClone(provider.periods[2].range),{startISO:'2026-10-01',endExclusiveISO:'2026-11-01'});
 provider.periods[2].resolve(complete(provider.periods[2].range));await provider.flush();provider.dispose();
});
