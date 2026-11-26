// C3 (Home screen): date and label helpers. Pure functions; dates are the
// API's "YYYY-MM-DD" strings in the user's own calendar.
import { formatDayWithWeekday, parseDay } from "@/utils/format";
import { dollarsUp, toCents } from "@/utils/money";
import type { BillItem, GoalThisWeek } from "@/utils/homeApi";

const WEEKDAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-11-22" → "Sunday, Nov 22" (Home's date line). */
export function longDate(day: string): string {
  const d = parseDay(day);
  return `${WEEKDAYS_LONG[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** The user's week days, from the API's week: "Mon–Sun", "Sun–Sat". */
export function weekDays(week: { start: string; end: string }): string {
  return `${WEEKDAYS[parseDay(week.start).getDay()]}–${WEEKDAYS[parseDay(week.end).getDay()]}`;
}

/** A bill's line under its name. */
export function billDueLabel(bill: BillItem, today: string): string {
  const now = parseDay(today);
  if (bill.paid) return bill.paid_on ? `Paid ${formatDayWithWeekday(bill.paid_on, now)}` : "Paid";
  if (bill.overdue) return `Was due ${formatDayWithWeekday(bill.due_on, now)}, mark paid if done`;
  if (bill.due_on === today) return "Due today";
  return `Due ${formatDayWithWeekday(bill.due_on, now)}`;
}

/** "$25 more toward Car insurance this week", or done for the week. */
export function goalLine(goal: GoalThisWeek): string {
  if (toCents(goal.still_needed_this_week) <= 0) return `${goal.name}: set aside for this week`;
  return `${dollarsUp(goal.still_needed_this_week)} more toward ${goal.name} this week`;
}

/** The outlook's message for its state (spec §4.1), or null for none. */
export function stateMessage(state: string, dataThrough: string | null, today: string): string | null {
  const now = parseDay(today);
  if (state === "stale")
    return dataThrough
      ? `Your latest transactions are from ${formatDayWithWeekday(dataThrough, now)}. Import new ones to keep this up to date.`
      : "Import your bank exports to see what you've spent.";
  if (state === "no_data_this_week") return "No transactions imported for this week yet.";
  if (state === "ok" && dataThrough && dataThrough < today) return `Spending counted through ${formatDayWithWeekday(dataThrough, now)}.`;
  return null;
}
