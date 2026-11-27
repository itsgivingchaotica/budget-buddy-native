// C5 (onboarding screens): pure helpers, tested. No money maths: amounts
// are typed by the user or come from Rails.
import { isoDay, longDay } from "@/utils/plan";
import type { BillAnswer, GoalAnswer, Question, Step } from "@/utils/onboardingApi";
import { parseDay } from "@/utils/format";

/** "Step N of 4" for a step (the draft plan is step 4). */
export function stepNumber(step: Step): number {
  return { accounts: 1, interview: 2, merchants: 3, plan: 4, done: 4 }[step];
}

/** The first question without a saved answer (resume), or the last one. */
export function firstUnanswered(questions: Question[], answers: Record<string, unknown>): number {
  const i = questions.findIndex((q) => answers[q.id] === undefined || answers[q.id] === null);
  return i === -1 ? questions.length - 1 : i;
}

/** Bills the user ticked (the prefill list with their choices). */
export function keptBills(bills: BillAnswer[], kept: Record<number, boolean>): BillAnswer[] {
  return bills.filter((_, i) => kept[i] !== false);
}

/** A goal's target date `months` ahead, on the last day of that month ("by the end of June"). */
export function monthsAhead(today: string, months: number): string {
  const t = parseDay(today);
  return isoDay(new Date(t.getFullYear(), t.getMonth() + months + 1, 0));
}

export const GOAL_DATE_CHOICES = [3, 6, 12, 24];

/** "By Feb 28" this year, "By Nov 30, 2027" otherwise (goal date chips). */
export function goalDateLabel(date: string, today: string): string {
  const full = longDay(date);
  return `By ${parseDay(date).getFullYear() === parseDay(today).getFullYear() ? full.replace(/, \d{4}$/, "") : full}`;
}

/** A short form is complete enough to send (Rails validates the rest). */
export function goalReady(goal: GoalAnswer): boolean {
  const filled = (s?: string | null) => !!s && s.trim() !== "";
  switch (goal.kind) {
    case "debt_payoff":
      return filled(goal.name) && filled(goal.balance) && filled(goal.apr) && filled(goal.monthly_payment);
    case "emergency_fund":
      return filled(goal.amount);
    case "upcoming_payment":
      return filled(goal.name) && filled(goal.amount) && filled(goal.date);
    default:
      return filled(goal.name) && filled(goal.amount);
  }
}
