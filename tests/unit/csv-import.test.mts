import assert from "node:assert/strict";
import { test } from "node:test";
import { parseImportedDate, parseTransactionCsv, validateImportedDraft } from "../../src/components/transactions/csv-import.ts";
import { analyseCsvFile, CSV_ANALYSIS_TIMEOUT_MS } from "../../src/components/transactions/csv-analysis.ts";

const csv = "date;description;amount;type\n2026-09-17;Coffee;2.50;expense\n31/02/2026;Invalid date;5;expense";
test("normalizes supported civil dates without timezone conversion", () => {
  for (const [input, expected] of [["2026-09-17", "2026-09-17"], ["17/09/2026", "2026-09-17"], ["17-09-2026", "2026-09-17"], ["29/02/2024", "2024-02-29"]]) assert.equal(parseImportedDate(input), expected);
});
test("impossible and unsupported dates return controlled row errors", () => {
  for (const input of ["31/02/2026", "29/02/2025", "2026-13-01", "", "tomorrow", "2026-09-17T00:00:00Z"]) assert.equal(parseImportedDate(input), null);
  const progress: number[] = [];
  const drafts = parseTransactionCsv(csv, (step) => progress.push(step));
  assert.deepEqual(progress, [1, 2, 3, 4]);
  assert.equal(drafts.length, 2); assert.equal(drafts[0].errors.length, 0);
  assert.equal(drafts[1].dateISO, null); assert.equal(drafts[1].rawDate, "31/02/2026"); assert.equal(drafts[1].errors.length, 1);
  assert.deepEqual(validateImportedDraft({ ...drafts[1], dateISO: "2026-02-28" }), []);
});
test("counts quoted multiline records and rejects incomplete CSV quotes", () => {
  const drafts = parseTransactionCsv('date,description,amount\r\n2026-09-17,"Two\nlines",-4.25\r\n');
  assert.equal(drafts.length, 1); assert.equal(drafts[0].description, "Two\nlines"); assert.equal(drafts[0].type, "expense");
  assert.throws(() => parseTransactionCsv('date,description,amount\n2026-09-17,"unfinished,4'), /csv_unclosed_quote/);
  assert.throws(() => parseTransactionCsv("unknown,header\nvalue,value"));
});

class FakeWorker {
  static last: FakeWorker;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;
  terminated = false;
  constructor() { FakeWorker.last = this; }
  postMessage() {}
  terminate() { this.terminated = true; }
}

function installWorker(t: import("node:test").TestContext) {
  const original = Object.getOwnPropertyDescriptor(globalThis, "Worker");
  Object.defineProperty(globalThis, "Worker", { configurable: true, writable: true, value: FakeWorker });
  t.after(() => { if (original) Object.defineProperty(globalThis, "Worker", original); else Reflect.deleteProperty(globalThis, "Worker"); });
}
test("worker completes with actual parser rows and releases resources", async (t) => {
  installWorker(t);
  const progress: number[] = [];
  const promise = analyseCsvFile(new File([csv], "valid.csv"), new AbortController().signal, (step) => progress.push(step));
  const worker = FakeWorker.last;
  worker.onmessage?.({ data: { step: 2 } });
  const drafts = parseTransactionCsv(csv);
  worker.onmessage?.({ data: { drafts } });
  assert.deepEqual(await promise, drafts); assert.deepEqual(progress, [2]); assert.equal(worker.terminated, true);
});
test("cancel terminates pending parsing without accepting late results", async (t) => {
  installWorker(t);
  const controller = new AbortController();
  const promise = analyseCsvFile(new File([csv], "valid.csv"), controller.signal, () => {});
  const rejected = assert.rejects(promise, { name: "AbortError" });
  controller.abort();
  FakeWorker.last.onmessage?.({ data: { drafts: parseTransactionCsv(csv) } });
  await rejected; assert.equal(FakeWorker.last.terminated, true);
});
test("stalled worker times out instead of remaining in normalization", async (t) => {
  installWorker(t); t.mock.timers.enable({ apis: ["setTimeout"] });
  const promise = analyseCsvFile(new File([csv], "valid.csv"), new AbortController().signal, () => {});
  const rejected = assert.rejects(promise, /csv_analysis_timeout/);
  t.mock.timers.tick(CSV_ANALYSIS_TIMEOUT_MS);
  await rejected; assert.equal(FakeWorker.last.terminated, true);
});
test("worker failures are surfaced and resources are released", async (t) => {
  installWorker(t);
  const promise = analyseCsvFile(new File([csv], "valid.csv"), new AbortController().signal, () => {});
  const rejected = assert.rejects(promise, /csv_analysis_failed/);
  FakeWorker.last.onerror?.(); await rejected; assert.equal(FakeWorker.last.terminated, true);
});
