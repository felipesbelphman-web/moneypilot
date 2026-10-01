import { PDF_STATEMENT_LIMITS, type PdfTextPage } from "./pdf-statement-contract.ts";

type PositionedText = { text: string; x: number; y: number };

export function groupPageLines(items: PositionedText[]) {
  const rows: Array<{ y: number; items: PositionedText[] }> = [];
  for (const item of items.sort((left, right) => right.y - left.y || left.x - right.x)) {
    const row = rows.find((candidate) => Math.abs(candidate.y - item.y) <= 2);
    if (row) row.items.push(item);
    else rows.push({ y: item.y, items: [item] });
  }
  return rows
    .sort((left, right) => right.y - left.y)
    .map((row) => row.items.sort((left, right) => left.x - right.x).map((item) => item.text).join(" ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

export async function extractPdfText(file: File): Promise<PdfTextPage[]> {
  if (file.size === 0) throw new Error("empty_pdf");
  if (file.size > PDF_STATEMENT_LIMITS.maxFileBytes) throw new Error("pdf_too_large");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (new TextDecoder("ascii").decode(bytes.slice(0, 5)) !== "%PDF-") throw new Error("invalid_pdf");

  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const loadingTask = pdfjs.getDocument({ data: bytes });

  try {
    const document = await loadingTask.promise;
    if (document.numPages > PDF_STATEMENT_LIMITS.maxPages) throw new Error("pdf_too_many_pages");
    const pages: PdfTextPage[] = [];
    let characterCount = 0;
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const items = content.items.flatMap((item) => "str" in item && item.str.trim()
        ? [{ text: item.str, x: item.transform[4], y: item.transform[5] }]
        : []);
      const lines = groupPageLines(items);
      characterCount += lines.reduce((total, line) => total + line.length, 0);
      if (characterCount > PDF_STATEMENT_LIMITS.maxTextCharacters) throw new Error("pdf_text_too_large");
      pages.push({ pageNumber, lines });
      page.cleanup();
    }
    return pages;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("pdf_")) throw error;
    throw new Error(error instanceof Error && error.name === "PasswordException" ? "password_protected_pdf" : "unreadable_pdf");
  } finally {
    await loadingTask.destroy();
  }
}
