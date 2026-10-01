import assert from 'node:assert/strict';
import test from 'node:test';
import { TransactionPeriodCache, transactionPeriodKey, readyTransactionPeriod } from '../../src/lib/persistence/transaction-period-state.ts';
import type { CompletePeriodResult, TransactionDateRange } from '../../src/lib/persistence/finance-query-contracts.ts';
import type { Transaction } from '../../src/components/transactions/transaction-model.ts';
const sep = { startISO: '2026-09-01', endExclusiveISO: '2026-10-01' };
const aug = { startISO: '2026-08-01', endExclusiveISO: '2026-09-01' };
const complete = (range = sep): CompletePeriodResult<Transaction> => ({ completeness: 'complete', range, items: [] });
function setup() {
 const calls: { range: TransactionDateRange; resolve: (r: CompletePeriodResult<Transaction>) => void; reject: (e: unknown) => void }[] = [];
 const cache = new TransactionPeriodCache(() => {}); cache.synchronizeOwner('a', 1);
 const fetch = (_owner: string, range: TransactionDateRange) => new Promise<CompletePeriodResult<Transaction>>((resolve,reject)=>calls.push({range,resolve,reject}));
 return {cache,calls,fetch};
}
test('keys include owner and both validated boundaries',()=>{
 const a = transactionPeriodKey('a',sep);
 for(const key of [transactionPeriodKey('a',aug),transactionPeriodKey('b',sep),transactionPeriodKey('a',{...sep,endExclusiveISO:'2026-10-02'})]) assert.notEqual(a,key);
 assert.equal(a,transactionPeriodKey('a',{...sep}));
 assert.throws(()=>transactionPeriodKey('',sep));
 assert.throws(()=>transactionPeriodKey('a',{...sep,startISO:'2026-09-31'}));
});
test('initial loading, empty ready, reuse, refresh failure, recovery and stale selector',async()=>{
 const {cache,calls,fetch}=setup(); assert.equal(cache.get(sep).status,'idle');
 const first=cache.request(sep,false,fetch); assert.equal(cache.get(sep).status,'loading'); await Promise.resolve(); calls[0].resolve(complete()); await first;
 const previous=readyTransactionPeriod(cache.get(sep)); assert.equal(previous?.items.length,0);
 await cache.request(sep,false,fetch); assert.equal(calls.length,1);
 const refresh=cache.request(sep,true,fetch); assert.equal(cache.get(sep).status,'refreshing'); assert.equal(readyTransactionPeriod(cache.get(sep)),null);
 await Promise.resolve(); calls[1].reject(new Error('secret')); await refresh;
 const error=cache.get(sep); assert.equal(error.status,'error'); assert.ok('retainedResult' in error); assert.equal(error.retainedResult,previous); assert.ok(!('result' in error));
 const retry=cache.request(sep,false,fetch); await Promise.resolve(); calls[2].resolve(complete()); await retry;
 cache.invalidate(['2026-09-15']); assert.equal(cache.get(sep).status,'stale'); assert.equal(readyTransactionPeriod(cache.get(sep)),null);
});
for(const outcome of ['success','error']) test(`older ${outcome} and cleanup cannot replace newer request`,async()=>{
 const {cache,calls,fetch}=setup(); const old=cache.request(sep,false,fetch); assert.equal(cache.request(sep,false,fetch),old);
 await Promise.resolve(); const newer=cache.request(sep,true,fetch); await Promise.resolve();
 if(outcome==='success') calls[0].resolve(complete()); else calls[0].reject(new Error('old'));
 await old; assert.equal(cache.request(sep,false,fetch),newer); assert.equal(cache.get(sep).status,'loading');
 calls[1].resolve(complete()); await newer; assert.equal(cache.get(sep).status,'ready');
});
test('independent periods and wrong range fail closed',async()=>{
 const {cache,calls,fetch}=setup(); const a=cache.request(sep,false,fetch),b=cache.request(aug,false,fetch); await Promise.resolve();
 calls[0].resolve(complete()); calls[1].resolve(complete()); await Promise.all([a,b]);
 assert.equal(cache.get(sep).status,'ready'); assert.equal(cache.get(aug).status,'error'); assert.equal(readyTransactionPeriod(cache.get(aug)),null);
});
test('range copied, invalidation obsoletes loading, and account epoch prevents ABA',async()=>{
 const {cache,calls,fetch}=setup(); const input={...sep}; const p=cache.request(input,false,fetch); input.startISO='2026-08-01'; await Promise.resolve();
 assert.deepEqual(calls[0].range,sep); cache.invalidate(['2026-09-02']); calls[0].resolve(complete()); await p; assert.equal(cache.get(sep).status,'stale');
 const old=cache.request(sep,false,fetch); await Promise.resolve(); cache.synchronizeOwner('b',2); cache.synchronizeOwner('a',3);
 calls[1].resolve(complete()); await old; assert.equal(cache.get(sep).status,'idle');
 cache.synchronizeOwner(null,4); await cache.request(sep,false,fetch); assert.equal(calls.length,2);
});
test('overlapping ranges invalidate; exclusive end and unrelated ranges remain ready',async()=>{
 const {cache}=setup(); const overlap={startISO:'2026-08-15',endExclusiveISO:'2026-09-15'};
 for(const range of [sep,aug,overlap]) await cache.request(range,false,async()=>complete(range));
 cache.invalidate(['2026-09-01']); assert.equal(cache.get(sep).status,'stale'); assert.equal(cache.get(overlap).status,'stale'); assert.equal(cache.get(aug).status,'ready');
 cache.invalidate(null); assert.equal(cache.get(aug).status,'stale');
});
test('newer response finishing first remains ready after older success/error',async()=>{
 for(const error of [false,true]) {
  const {cache,calls,fetch}=setup(); const a=cache.request(sep,false,fetch); await Promise.resolve(); const b=cache.request(sep,true,fetch); await Promise.resolve();
  const newest=complete(); calls[1].resolve(newest); await b;
  if(error)calls[0].reject(new Error('old'));else calls[0].resolve(complete()); await a;
  assert.equal(readyTransactionPeriod(cache.get(sep)),newest);
 }
});
