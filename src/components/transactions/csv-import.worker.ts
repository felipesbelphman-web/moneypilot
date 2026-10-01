import { parseTransactionCsv } from "./csv-import";

self.onmessage = async ({ data: file }: MessageEvent<File>) => {
  try {
    self.postMessage({ step: 0 });
    const text = await file.text();
    const drafts = parseTransactionCsv(text, (step) => self.postMessage({ step }));
    self.postMessage({ drafts });
  } catch {
    self.postMessage({ error: "csv_analysis_failed" });
  }
};
