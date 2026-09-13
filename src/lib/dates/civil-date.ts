const civilDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;

export function civilDateToUtcTimestamp(dateISO: string) {
  const match = civilDatePattern.exec(dateISO);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const timestamp = Date.UTC(year, month - 1, day);
  const date = new Date(timestamp);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? timestamp : null;
}

export function getLocalCivilDateISO(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function subtractCivilDays(dateISO: string, days: number) {
  const timestamp = civilDateToUtcTimestamp(dateISO);
  if (timestamp === null) return null;
  const date = new Date(timestamp);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

export function isCivilDateInRange(dateISO: string, firstDateISO: string, lastDateISO: string) {
  return civilDateToUtcTimestamp(dateISO) !== null && dateISO >= firstDateISO && dateISO <= lastDateISO;
}
