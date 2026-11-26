// C2 (accounts and import screens): shared display helpers for the Activity
// tab (docs/product/SCREENS_ACTIVITY.md, "Shared rules"). Pure functions.

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_MS = 24 * 60 * 60 * 1000;

export type Money = { text: string; direction: "in" | "out" };

/**
 * Amounts arrive from the API as strings ("-64.18"). Money out shows as
 * "−$64.18" (true minus sign), money in as "+$120.00", with thousands
 * separators. Exact: no floating-point arithmetic on the digits.
 */
export function formatMoney(amount: string): Money {
  const trimmed = amount.trim();
  const negative = trimmed.startsWith("-");
  const [whole, fraction = ""] = trimmed.replace(/^[-+]/, "").split(".");
  const cents = (fraction + "00").slice(0, 2);
  const grouped = whole.replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return { text: `${negative ? "−" : "+"}$${grouped}.${cents}`, direction: negative ? "out" : "in" };
}

/** "2026-11-20" -> a local calendar date (no time-zone shift). */
export function parseDay(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** "2026-11-20" -> "Nov 20, 2026" (or "Nov 20" in the current year). */
export function formatDay(day: string, today: Date = new Date()): string {
  const date = parseDay(day);
  const short = `${MONTHS[date.getMonth()]} ${date.getDate()}`;
  return date.getFullYear() === today.getFullYear() ? short : `${short}, ${date.getFullYear()}`;
}

/** Whole calendar days from `day` to `today` (0 = today). */
export function daysAgo(day: string, today: Date = new Date()): number {
  const start = parseDay(day);
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((end.getTime() - start.getTime()) / DAY_MS);
}

export type Freshness = { label: string; fresh: boolean };

/** Account freshness chip: "Up to date" within 7 days, else "N days old". */
export function freshness(dataThrough: string | null, today: Date = new Date()): Freshness {
  if (!dataThrough) return { label: "No data yet", fresh: false };
  const days = daysAgo(dataThrough, today);
  if (days <= 7) return { label: "Up to date", fresh: true };
  return { label: `${days} days old`, fresh: false };
}

/** Earliest non-null date, as "data through" across accounts. */
export function earliestDay(days: (string | null)[]): string | null {
  const known = days.filter((d): d is string => !!d).sort();
  return known[0] ?? null;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${formatCount(n)} ${n === 1 ? one : many}`;
}

/** Transactions grouped by posted day, newest day first (Activity list). */
export function groupByDay<T extends { posted_on: string }>(rows: T[]): { title: string; data: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const list = groups.get(row.posted_on) ?? [];
    list.push(row);
    groups.set(row.posted_on, list);
  }
  return [...groups.entries()].sort(([a], [b]) => (a < b ? 1 : -1)).map(([title, data]) => ({ title, data }));
}

/** "2026-11-21" -> "Sat, Nov 21" (Activity summary and day headers). */
export function formatDayWithWeekday(day: string, today: Date = new Date()): string {
  return `${WEEKDAYS[parseDay(day).getDay()]}, ${formatDay(day, today)}`;
}

/** "2024-12-01" -> "Dec 1, 2024" (always with the year: import date ranges). */
export function formatDayLong(day: string): string {
  const date = parseDay(day);
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/** 1082 -> "1,082". */
export function formatCount(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
