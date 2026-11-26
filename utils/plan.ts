// C8 (Plan tab): labels and small date helpers. Pure functions; no money
// maths beyond the conservative display rounding in utils/money.ts.
import { formatDayWithWeekday, parseDay } from "@/utils/format";
import { dollarsDown, dollarsUp, toCents } from "@/utils/money";
import type { Bill, BudgetRow } from "@/utils/planApi";

const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** 1 → "1st", 2 → "2nd", 23 → "23rd", 11 → "11th". */
export function ordinal(n: number): string {
  const teen = n % 100 >= 11 && n % 100 <= 13;
  const suffix = teen ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th";
  return `${n}${suffix}`;
}

/** "2026-11" → "November"; with the year when it isn't `currentYear`. */
export function monthName(month: string, currentYear?: number): string {
  const [y, m] = month.split("-").map(Number);
  return currentYear === undefined || y === currentYear ? MONTHS_LONG[m - 1] : `${MONTHS_LONG[m - 1]} ${y}`;
}

/** "2026-11" ± n months → "2026-12". */
export function shiftMonth(month: string, by: number): string {
  const [y, m] = month.split("-").map(Number);
  const index = y * 12 + (m - 1) + by;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

/** "2027-09" → "Sep 2027" (payoff months). */
export function shortMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

/** "2027-06-01" → "Jun 1, 2027". */
export function longDay(day: string): string {
  const d = parseDay(day);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/** A budget row's right-hand label: "$124 left" (down) or "$6 over" (up). */
export function budgetLeft(row: Pick<BudgetRow, "remaining">): { text: string; over: boolean } {
  return toCents(row.remaining) < 0 ? { text: `${dollarsUp(row.remaining)} over`, over: true } : { text: `${dollarsDown(row.remaining)} left`, over: false };
}

/** Spending shown in whole dollars rounded up, so it's never understated. */
export function spentText(spent: string): string {
  return `${dollarsUp(spent)} spent`;
}

/** "Monthly · 23rd", "Every 2 weeks · Fri", "Every 3 months · 15th", "One-off · Dec 5". */
export function scheduleLabel(bill: Pick<Bill, "recurrence" | "interval" | "day_of_month" | "first_due_on">): string {
  const day = parseDay(bill.first_due_on);
  const n = bill.interval;
  switch (bill.recurrence) {
    case "monthly":
      return `${n === 1 ? "Monthly" : `Every ${n} months`} · ${ordinal(bill.day_of_month ?? day.getDate())}`;
    case "weekly":
      return `${n === 1 ? "Weekly" : `Every ${n} weeks`} · ${WEEKDAYS[day.getDay()]}`;
    case "biweekly":
      return `Every ${2 * n} weeks · ${WEEKDAYS[day.getDay()]}`;
    case "yearly":
      return `${n === 1 ? "Yearly" : `Every ${n} years`} · ${MONTHS[day.getMonth()]} ${bill.day_of_month ?? day.getDate()}`;
    default:
      return `One-off · ${MONTHS[day.getMonth()]} ${day.getDate()}`;
  }
}

export type ChipTone = "positive" | "review" | "neutral" | "overdue";

/** The status chip for a bill's current occurrence (SCREENS_PLAN §4). */
export function billChip(bill: Pick<Bill, "current">, today: string): { label: string; tone: ChipTone } | null {
  const c = bill.current;
  if (!c) return null;
  const now = parseDay(today);
  const short = (day: string) => `${MONTHS[parseDay(day).getMonth()]} ${parseDay(day).getDate()}`;
  switch (c.status) {
    case "paid":
      return { label: `Paid ${short(c.paid_on ?? c.due_on)}`, tone: "positive" };
    case "was_due":
      return { label: `Was due ${short(c.due_on)}`, tone: "overdue" };
    case "due_soon":
      return { label: `Due ${formatDayWithWeekday(c.due_on, now)}`, tone: "review" };
    default:
      return { label: `Due ${short(c.due_on)}`, tone: "neutral" };
  }
}

/** Monthly bills: the next date on `day` (29–31 fall on a shorter month's last day), today or later. */
export function nextMonthlyDue(day: number, today: string): string {
  const t = parseDay(today);
  for (let add = 0; add < 2; add++) {
    const y = t.getFullYear();
    const m = t.getMonth() + add;
    const last = new Date(y, m + 1, 0).getDate();
    const date = new Date(y, m, Math.min(day, last));
    if (date >= new Date(t.getFullYear(), t.getMonth(), t.getDate())) return isoDay(date);
  }
  throw new Error("unreachable");
}

/** A Date (local) → "YYYY-MM-DD". */
export function isoDay(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** `count` days starting at `from` ("YYYY-MM-DD"), forwards (+1) or backwards (-1). */
export function dayList(from: string, count: number, step: 1 | -1): string[] {
  const start = parseDay(from);
  return Array.from({ length: count }, (_, i) => isoDay(new Date(start.getFullYear(), start.getMonth(), start.getDate() + step * i)));
}

/** "Today", "Yesterday", or "Mon, Nov 23" (day chips). */
export function dayChipLabel(day: string, today: string): string {
  if (day === today) return "Today";
  if (day === dayList(today, 2, -1)[1]) return "Yesterday";
  if (day === dayList(today, 2, 1)[1]) return "Tomorrow";
  return formatDayWithWeekday(day, parseDay(today));
}

/** Whole dollars typed by the user → a valid amount string, or null. */
export function parseWholeDollars(text: string, max: number): number | null {
  const cleaned = text.replace(/[$,\s]/g, "");
  if (!/^\d+$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return n <= max ? n : null;
}

/** A typed money amount ("12.5", "$1,200") → "12.50", or null. */
export function parseMoneyInput(text: string): string | null {
  const cleaned = text.replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, fraction = ""] = cleaned.split(".");
  return `${Number(whole)}.${(fraction + "00").slice(0, 2)}`;
}
