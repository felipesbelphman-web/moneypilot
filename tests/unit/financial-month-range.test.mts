import assert from 'node:assert/strict';
import test from 'node:test';
import { financialMonthRange } from '../../src/lib/dates/financial-month-range.ts';
for (const [month, end] of [['2026-09','2026-10-01'],['2026-12','2027-01-01'],['2028-02','2028-03-01']]) test(`civil financial range ${month}`,()=>{
 assert.deepEqual(financialMonthRange(month),{startISO:`${month}-01`,endExclusiveISO:end}); assert.ok(Object.isFrozen(financialMonthRange(month)));
});
for(const month of ['2026-00','2026-13','2026-2',' 2026-02','2026-02-01','0099-01','9998-12','9999-01','invalid']) test(`invalid/non-advancing month ${month}`,()=>assert.throws(()=>financialMonthRange(month)));
test('civil query strings are unchanged across timezones',()=>{
 const previous=process.env.TZ;
 try {for(const timezone of ['Pacific/Kiritimati','America/Los_Angeles','Europe/London']) {process.env.TZ=timezone;assert.deepEqual(financialMonthRange('2028-02'),{startISO:'2028-02-01',endExclusiveISO:'2028-03-01'});}}
 finally {if(previous===undefined)delete process.env.TZ;else process.env.TZ=previous;}
});
