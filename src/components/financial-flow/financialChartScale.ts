export type FinancialChartScale = {
  max: number;
  min: number;
  tickAmount: number;
};

function niceStep(range: number, targetIntervals = 4) {
  const roughStep = range / targetIntervals;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const fraction = roughStep / magnitude;
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
  return niceFraction * magnitude;
}

export function getFinancialChartScale(series: number[][]): FinancialChartScale {
  const finiteValues = series.flat().filter(Number.isFinite);
  const dataMin = Math.min(0, ...finiteValues);
  const dataMax = Math.max(0, ...finiteValues);

  if (dataMin === dataMax) {
    const step = Math.max(1, 10 ** Math.floor(Math.log10(Math.abs(dataMax) || 1)));
    return dataMax === 0
      ? { min: 0, max: step, tickAmount: 1 }
      : { min: Math.min(0, dataMax - step), max: dataMax + step, tickAmount: 2 };
  }

  const step = niceStep(dataMax - dataMin);
  const min = Math.floor(dataMin / step) * step;
  const max = Math.ceil(dataMax / step) * step;
  return { min, max, tickAmount: Math.max(1, Math.round((max - min) / step)) };
}
