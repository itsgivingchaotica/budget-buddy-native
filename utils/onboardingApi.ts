// C5 (onboarding screens): typed calls through utils/api.ts (C0) for ON1
// (GET /onboarding, PUT /onboarding/answers). Facts and question text come
// from Rails; the app shows them and saves answers.
import { api } from "@/utils/api";

export type Step = "accounts" | "interview" | "merchants" | "plan" | "done";
export type PayFrequency = "weekly" | "biweekly" | "semimonthly" | "monthly" | "irregular";
export type Appetite = "keep" | "trim" | "push";
export type GoalKind = "upcoming_payment" | "purchase" | "emergency_fund" | "debt_payoff";

export type Option = { value: string; label: string };

export type PayAnswer = { frequency: PayFrequency | null; next_pay_on: string | null; typical_amount: string | null };
export type BillAnswer = { name: string; amount: string; day: number; category: string; detected?: boolean };
export type GoalAnswer = {
  kind: GoalKind;
  name?: string;
  amount?: string;
  date?: string | null;
  balance?: string;
  apr?: string;
  monthly_payment?: string;
};

export type Question =
  | { id: "pay"; text: string; hint: string | null; options: Option[]; prefill: PayAnswer }
  | { id: "side_income"; text: string; options: Option[]; prefill: string | null }
  | { id: "bills"; text: string; prefill: BillAnswer[] }
  | { id: "goals"; text: string; options: Option[]; prefill: GoalAnswer[] }
  | { id: "change_appetite"; text: string; options: Option[]; prefill: Appetite };

/** A bill Rails found in the imports (facts.likely_bills). */
export type DetectedBill = { name: string; amount: string; day: number; category: string };

/** ON2: a coach follow-up, worded by the model, with options from Rails. */
export type FollowUp =
  | { slot: string; question: string; input: "choice"; options: Option[]; category?: { slug: string; name: string } }
  | { slot: "irregular_income_floor"; question: string; input: "amount"; label: string }
  | { slot: "goal_priority"; question: string; input: "order"; goals: { index: number; name: string }[] };

export type FollowUpAnswer = string | number[];

export type OnboardingState = {
  version: number;
  step: Step;
  has_import: boolean;
  facts: { likely_bills: DetectedBill[] };
  questions: Question[];
  /** ON2: the follow-ups already asked (null until asked). */
  follow_ups: FollowUp[] | null;
  answers: Record<string, unknown>;
};

export type AnswersInput = {
  step?: Step;
  pay?: PayAnswer;
  side_income?: string;
  bills?: BillAnswer[];
  goals?: GoalAnswer[];
  change_appetite?: Appetite;
  follow_ups?: Record<string, FollowUpAnswer>;
};

export async function getOnboarding(): Promise<OnboardingState> {
  const { data } = await api.get<OnboardingState>("/onboarding");
  return data;
}

/** ON2: asks for (or returns the stored) coach follow-ups; [] when there are none or the AI is unavailable. */
export async function getFollowUps(): Promise<FollowUp[]> {
  const { data } = await api.post<{ follow_ups: FollowUp[] }>("/onboarding/follow_ups");
  return data.follow_ups;
}

/** Saves a partial answer (and/or the step); returns the updated state. */
export async function saveAnswers(input: AnswersInput): Promise<OnboardingState> {
  const { data } = await api.put<OnboardingState>("/onboarding/answers", input);
  return data;
}
