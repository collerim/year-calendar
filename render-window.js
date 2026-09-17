export const RENDER_LOOKAHEAD_DAYS = 7;

export function parseDateKey(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) throw new Error(`Invalid date: ${value}`);
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`Invalid date: ${value}`);
  }
  return date;
}

export function renderWindow(baseDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())) {
  const end = parseDateKey(baseDate);
  end.setUTCDate(end.getUTCDate() + RENDER_LOOKAHEAD_DAYS);
  return { start: baseDate, end: end.toISOString().slice(0, 10) };
}
