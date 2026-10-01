/* eslint-disable @typescript-eslint/no-explicit-any */
import { p03cHarness, nodes, text } from './p03c-render-harness.mts';
import { transaction } from './finance-availability-render-harness.mts';
import { FinanceError } from '../../src/lib/domain/finance-error.ts';
import type { TransactionPeriodState } from '../../src/lib/persistence/transaction-period-state.ts';
import type { TransactionDateRange } from '../../src/lib/persistence/finance-query-contracts.ts';
import type { Transaction } from '../../src/components/transactions/transaction-model.ts';
export { nodes, text, transaction };
export const month='2026-09', range={startISO:'2026-09-01',endExclusiveISO:'2026-10-01'}, grid={startISO:'2026-08-31',endExclusiveISO:'2026-10-05'};
export const key=(r:TransactionDateRange)=>`${r.startISO}/${r.endExclusiveISO}`;
export const ready=(scope=range,items:Transaction[]=[transaction()]):TransactionPeriodState=>({status:'ready',result:{completeness:'complete',range:scope,items}});
export const failed=():TransactionPeriodState=>({status:'error',error:new FinanceError('repository_unavailable')});
export function dashboardHarness(theme:'light'|'dark'='dark', now=new Date(2026,8,15)) {
 const h=p03cHarness({theme,now});const states=new Map<string,TransactionPeriodState>();
 const rows=[transaction({id:'income',type:'income',amount:100,category:'Salary'}),transaction()];
 states.set(key(range),ready(range,rows));states.set(key(grid),ready(grid,rows));
 Object.assign(h.data,{accountBalance:456,accountBalanceSettings:null,getTransactionPeriodState:(scope:TransactionDateRange)=>states.get(key(scope))??{status:'idle'}});
 const page=h.mount('src/app/dashboard/page.tsx');
 const render=()=>{h.calls.length=0;return page.render();};
 const component=(tree:any,name:string)=>nodes(tree).find(n=>n.type?.name===name);
 const renderChild=(tree:any,name:string)=>{const child=component(tree,name);return h.mountComponent(child.type,child.props).render();};
 const view=()=>h.load('src/components/dashboard/dashboard-view-state.ts').getDashboardFinancialView({...h.data,period:h.data.getTransactionPeriodState(range),month,now});
 return {...h,states,render,component,renderChild,view,openCalendar:()=>component(render(),'DashboardMonthSelector').props.onOpenCalendar()};
}
