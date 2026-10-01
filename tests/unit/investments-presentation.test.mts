import assert from "node:assert/strict";
import test from "node:test";
import type React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { elements, investmentsHarness, textOf, type Element } from "./investments-render-harness.mts";
import { investmentPresentationCopy } from "../../src/components/investments/investment-presentation.ts";
import { supportedLanguages } from "../../src/i18n/config.ts";
import type { Investment } from "../../src/components/investments/investment-model.ts";

const manual: Investment = { id: "offline", name: "Offline fund", symbol: "TEST", assetType: "etf", quantity: 2.5, averagePurchasePrice: 10, manualCurrentPrice: 12, priceMode: "manual", marketAssetKey: null, nativeCurrency: "EUR" };
const automatic: Investment = { ...manual, id: "automatic", name: "Offline automatic", assetType: "crypto", priceMode: "automatic", manualCurrentPrice: null, marketAssetKey: "offline-key" };
function component(tree: React.ReactNode, name: string) {
  const found = elements(tree).find(e => typeof e.type === "function" && e.type.name === name); assert.ok(found, name); return found;
}
function click(tree: React.ReactNode, name: string) {
  const found = elements(tree).find(e => e.type === "button" && textOf(e) === name); assert.ok(found, name); (found.props.onClick as () => void)();
}
function field(tree: React.ReactNode, id: string, value: string) {
  const found = elements(tree).find(e => e.props.id === id); assert.ok(found, id); (found.props.onChange as (e: { target: { value: string } }) => void)({ target: { value } });
}
async function submit(tree: React.ReactNode) {
  const form = elements(tree).find(e => e.type === "form"); assert.ok(form);
  await (form.props.onSubmit as (e: { preventDefault: () => void }) => Promise<void>)({ preventDefault() {} });
}

test("Investments localizes empty, loading, partial/error, filters and the manual form in all languages", () => {
  for (const { code } of supportedLanguages) {
    const ui = investmentPresentationCopy[code];
    const h = investmentsHarness({ language: code });
    const html = renderToStaticMarkup(h.render());
    assert.ok(html.includes(ui.comingSoon)); assert.ok(html.includes(ui.planned));
    assert.doesNotMatch(html, /12.840|1.240|NVDA|AAPL|BTC|ETH|46%|62%|<svg/);
    click(h.render(), ui.add);
    const modal = h.expand(component(h.render(), "ManualInvestmentModal"));
    assert.ok(textOf(modal).includes(ui.manualTitle)); assert.ok(textOf(modal).includes(ui.manualHelp));
    assert.equal(elements(modal).filter(e => e.type === "input").length, 6);
    const loading = investmentsHarness({ language: code, isHydrating: true }).render();
    assert.ok(textOf(loading).includes(ui.loading)); assert.equal(elements(loading).filter(e => e.type === "article").length, 0);
    const partial = investmentsHarness({ language: code, investments: [manual, { ...automatic, nativeCurrency: "USD" }], hydrationError: new Error("private error") }).render();
    assert.ok(textOf(partial).includes(ui.partial)); assert.ok(!textOf(partial).includes(ui.loadError)); assert.ok(!textOf(partial).includes("private error"));
  }
});

test("Investments preserves per-asset manual valuations and never substitutes missing quotes or sums currencies", () => {
  const h = investmentsHarness({ investments: [manual, { ...automatic, nativeCurrency: "USD" }] });
  const list = h.expand(component(h.render(), "InvestmentAssetsList"));
  const rows = elements(list).filter(e => e.type === "tr");
  assert.match(textOf(rows[1]), /€25\.00/); assert.match(textOf(rows[1]), /€30\.00/);
  assert.match(textOf(rows[2]), /\$25\.00/); assert.match(textOf(rows[2]), /Unavailable/);
  assert.doesNotMatch(textOf(h.render()), /€55|€50|\$55|\$50/);
  assert.equal(h.writes.length, 0);
});

test("Investment filters retain ETF/stock membership, selection semantics and an honest no-results state", () => {
  const h = investmentsHarness({ investments: [manual] });
  click(h.render(), "Stocks");
  assert.equal((component(h.render(), "InvestmentAssetsList").props.investments as Investment[]).length, 1);
  assert.equal(elements(h.render()).find(e => textOf(e) === "Stocks")?.props["aria-pressed"], true);
  click(h.render(), "Crypto");
  assert.ok(textOf(h.expand(component(h.render(), "InvestmentAssetsList"))).includes("No assets match this filter"));
  click(h.render(), "All");
  assert.equal((component(h.render(), "InvestmentAssetsList").props.investments as Investment[]).length, 1);
});

function validForm(h: ReturnType<typeof investmentsHarness>) {
  click(h.render(), "Add investment");
  const modal = () => h.expand(component(h.render(), "ManualInvestmentModal"));
  for (const [id, value] of Object.entries({ name: " Offline position ", symbol: " abc ", type: "crypto", quantity: "0.5", "average-price": "10.25", "current-price": "11.5", currency: "usd" })) field(modal(), `investment-${id}`, value);
  return modal;
}
test("Manual creation preserves parsers, normalization, provider fields and refresh after confirmation", async () => {
  const h = investmentsHarness(); const modal = validForm(h); await submit(modal());
  assert.equal(h.writes.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(h.writes[0])), { name: "Offline position", symbol: "ABC", assetType: "crypto", quantity: 0.5, averagePurchasePrice: 10.25, manualCurrentPrice: 11.5, nativeCurrency: "USD", id: "offline-investment-id", priceMode: "manual", marketAssetKey: null });
  assert.equal(component(h.render(), "ManualInvestmentModal").props.open, false);
  assert.match(textOf(h.expand(component(h.render(), "InvestmentAssetsList"))), /Offline position/);
});

test("Manual form rejects invalid inputs, preserves draft on failure and shows a safe localized error", async () => {
  const h = investmentsHarness({ failSave: true }); const modal = validForm(h);
  field(modal(), "investment-quantity", "0"); await submit(modal()); assert.equal(h.writes.length, 0);
  assert.match(textOf(modal()), /quantity greater than zero/);
  field(modal(), "investment-quantity", "0.5"); await submit(modal());
  assert.equal(component(h.render(), "ManualInvestmentModal").props.open, true);
  assert.ok(textOf(modal()).includes(investmentPresentationCopy.en.saveError));
  assert.doesNotMatch(textOf(modal()), /private database detail/);
  const name = elements(modal()).find(e => e.props.id === "investment-name") as Element;
  assert.equal(name.props.value, " Offline position ");
});

test("Unavailable and unsafe valuations do not become zero balances", () => {
  const h = investmentsHarness({ investments: [{ ...manual, quantity: Number.NaN }, automatic] });
  const list = h.expand(component(h.render(), "InvestmentAssetsList"));
  assert.match(textOf(list), /Unavailable/); assert.doesNotMatch(textOf(list), /€0\.00/);
});
