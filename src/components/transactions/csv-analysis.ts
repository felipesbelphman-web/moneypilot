import type { ImportedTransactionDraft } from "./csv-import";

export const CSV_ANALYSIS_TIMEOUT_MS = 15_000;

// A worker keeps malformed/large files off the UI thread and can be terminated.
export function analyseCsvFile(file: File, signal: AbortSignal, onProgress: (step: number) => void): Promise<ImportedTransactionDraft[]> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException("Aborted", "AbortError")); return; }
    const worker = new Worker(new URL("./csv-import.worker.ts", import.meta.url));
    const cleanup = () => {
      clearTimeout(timeout);
      worker.onmessage = null;
      worker.onerror = null;
      worker.onmessageerror = null;
      worker.terminate();
      signal.removeEventListener("abort", abort);
    };
    const abort = () => { cleanup(); reject(new DOMException("Aborted", "AbortError")); };
    const timeout = setTimeout(() => { cleanup(); reject(new Error("csv_analysis_timeout")); }, CSV_ANALYSIS_TIMEOUT_MS);
    signal.addEventListener("abort", abort, { once: true });
    const fail = () => { cleanup(); reject(new Error("csv_analysis_failed")); };
    worker.onerror = fail;
    worker.onmessageerror = fail;
    worker.onmessage = ({ data }: MessageEvent<{ step?: number; drafts?: ImportedTransactionDraft[]; error?: string }>) => {
      if (data.error) { cleanup(); reject(new Error(data.error)); }
      else if (data.drafts) { cleanup(); resolve(data.drafts); }
      else if (data.step !== undefined) onProgress(data.step);
    };
    try { worker.postMessage(file); }
    catch { cleanup(); reject(new Error("csv_analysis_failed")); }
  });
}
