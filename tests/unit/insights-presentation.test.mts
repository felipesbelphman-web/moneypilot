import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import { supportedLanguages } from "../../src/i18n/config.ts";

const source = readFileSync(new URL("../../src/app/insights/page.tsx", import.meta.url), "utf8");
const parsed = ts.createSourceFile("page.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

test("Insights new presentation copy is explicit and valid in all supported languages", () => {
  const localized = new Map<string, Map<string, string>>();
  const visit = (node: ts.Node) => {
    if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name) && supportedLanguages.some(({ code }) => code === node.name.getText(parsed)) && ts.isObjectLiteralExpression(node.initializer)) {
      const strings = new Map<string, string>();
      for (const prop of node.initializer.properties) {
        if (ts.isPropertyAssignment(prop) && ts.isStringLiteral(prop.initializer)) strings.set(prop.name.getText(parsed), prop.initializer.text);
      }
      localized.set(node.name.text, strings);
    }
    ts.forEachChild(node, visit);
  };
  visit(parsed);
  for (const { code } of supportedLanguages) {
    for (const key of ["title", "analysis", "spending", "loadError"]) {
      const copy = localized.get(code)?.get(key);
      assert.ok(copy, `${code}.${key}`);
      assert.ok(copy.trim(), `${code}.${key}`);
      assert.doesNotMatch(copy, /[?\uFFFD]/, `${code}.${key} must retain Unicode characters`);
    }
  }
});

test("Insights retains honest unavailable sections and loading/error feedback", () => {
  assert.match(source, /panel\(t\.comparison, t\.notEnough, t\.comparisonHelp\)/);
  assert.match(source, /panel\(t\.patterns, t\.noPatterns, t\.patternsHelp\)/);
  assert.match(source, /aria-busy=.*statusFor\(resource\)/);
  assert.match(source, /statusFor\(resource\) === "error"\) && .*role="alert"/);
  assert.doesNotMatch(source, /€100|€34[.,]60|July|Shopping|≈ 3/);
  assert.match(source, /AccountAvatar size=\{52\}/);
  assert.doesNotMatch(source, /<main|DesktopSidebar|setTransactions|fetch\(/);
});
