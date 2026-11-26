// C8 (Plan tab): typed calls through utils/api.ts (C0). Every figure comes
// from the server (AN1/AN2, OB1, G1/G2); the app only formats.
import { api } from "@/utils/api";

// --- budgets (DM-3, AN2) ---------------------------------------------------------

export type BudgetRow = { category: string; name: string; budget: string; spent: string; remaining: string; status: "under" | "near" | "over" };
export type UnbudgetedRow = { category: string; name: string; spent: string };

export type BudgetMonth = {
  month: string; // "2026-11"
  plan_exists: boolean;
  categories: BudgetRow[];
  unbudgeted: UnbudgetedRow[];
  uncategorized: string;
  totals: { budget: string; spent: string; remaining: string; everyday_spent: string };
  data_through: string | null;
};

export type BudgetContext = {
  category: string;
  name: string;
  month: string;
  amount: string | null;
  weekly_equivalent: string | null;
  average_last_3_months: string | null;
  months_averaged: number;
  spent_this_month: string;
};

export async function budgetMonth(month?: string): Promise<BudgetMonth> {
  const { data } = await api.get<BudgetMonth>("/analytics/budget_vs_actual", { params: month ? { month } : {} });
  return data;
}

export async function budgetContext(slug: string, amount?: number): Promise<BudgetContext> {
  const { data } = await api.get<BudgetContext>(`/category_budgets/${slug}/context`, {
    params: amount === undefined ? {} : { amount: String(amount) },
  });
  return data;
}

/** Applies to the whole current month (SCREENS_PLAN §6.1). */
export async function saveBudget(slug: string, amount: number): Promise<void> {
  await api.put(`/category_budgets/${slug}`, { amount: String(amount) });
}

// --- bills (OB1) ----------------------------------------------------------------------

export type Recurrence = "none" | "weekly" | "biweekly" | "monthly" | "yearly";
export type BillStatus = "paid" | "was_due" | "due_soon" | "due";

export type Bill = {
  id: number;
  name: string;
  amount: string;
  category: string;
  category_name: string;
  account_id: number | null;
  first_due_on: string;
  recurrence: Recurrence;
  interval: number;
  day_of_month: number | null;
  ends_on: string | null;
  archived_at: string | null;
  next_due_on: string | null;
  current: { due_on: string; status: BillStatus; paid_on: string | null } | null;
};

export type BillList = {
  today: string;
  summary: { monthly_total: string; due_in_next_7_days: number };
  obligations: Bill[];
};

export type BillInput = {
  name: string;
  amount: string;
  category: string;
  recurrence: Recurrence;
  first_due_on: string;
  day_of_month?: number | null;
  account_id?: number | null;
};

export async function listBills(): Promise<BillList> {
  const { data } = await api.get<BillList>("/obligations");
  return data;
}

export async function createBill(input: BillInput): Promise<Bill> {
  const { data } = await api.post<Bill>("/obligations", input);
  return data;
}

export async function updateBill(id: number, input: Partial<BillInput>): Promise<Bill> {
  const { data } = await api.patch<Bill>(`/obligations/${id}`, input);
  return data;
}

export async function archiveBill(id: number): Promise<void> {
  await api.post(`/obligations/${id}/archive`);
}

export async function payBill(id: number, dueOn: string): Promise<void> {
  await api.post(`/obligations/${id}/payments`, { due_on: dueOn });
}

export async function unpayBill(id: number, dueOn: string): Promise<void> {
  await api.delete(`/obligations/${id}/payments/${dueOn}`);
}

// --- goals (G1, G2) ---------------------------------------------------------------------

export type Milestone = { percent: number; amount: string; reached: boolean; reached_on: string | null; projected_on: string | null };

export type SavingProgress = {
  kind: "saving";
  saved: string;
  target: string;
  remaining: string;
  percent: number;
  set_aside_this_week: string;
  weeks_left: number | null;
  needed_per_week: string | null;
  still_needed_this_week: string | null;
  on_track: boolean | null;
  past_target_date: boolean;
  milestones: Milestone[];
  assumptions: string[];
};

export type Payoff = { never_pays_off: boolean; months: number | null; payoff_month: string | null; total_interest: string | null };

export type DebtProgress = {
  kind: "debt";
  balance: string;
  starting_balance: string;
  percent_paid: number;
  interest_this_month: string;
  payoff: Payoff;
  what_if: Payoff & { extra: string; interest_saved: string | null; months_sooner: number | null };
  on_track: boolean;
  milestones: Milestone[];
  assumptions: string[];
};

export type Goal = {
  id: number;
  goal_type: "upcoming_payment" | "purchase" | "debt_payoff";
  name: string;
  status: string;
  target_amount: string | null;
  target_date: string | null;
  apr: string | null;
  monthly_payment: string | null;
  progress: SavingProgress | DebtProgress;
};

export const WHAT_IF_EXTRA = 50; // the fixed MVP what-if step (SCREENS_PLAN §5)

export async function listGoals(): Promise<Goal[]> {
  const { data } = await api.get<{ goals: Goal[] }>("/goals", { params: { what_if_extra: WHAT_IF_EXTRA } });
  return data.goals;
}

export type ContributionInput = { amount?: string; balance_after?: string; contributed_on: string; note?: string };

export async function addContribution(goalId: number, input: ContributionInput): Promise<{ contribution: { id: number } }> {
  const { data } = await api.post(`/goals/${goalId}/contributions`, input, { params: { what_if_extra: WHAT_IF_EXTRA } });
  return data;
}

export async function undoContribution(goalId: number, contributionId: number): Promise<void> {
  await api.delete(`/goals/${goalId}/contributions/${contributionId}`);
}

// --- reference data for the bill form ------------------------------------------------------

export type CategoryOption = { slug: string; name: string; fixed_variable: string | null; kind: string };

/** Fixed spending categories (bills); flexible ones have budgets. */
export async function fixedCategories(): Promise<CategoryOption[]> {
  const { data } = await api.get<CategoryOption[]>("/categories");
  return data.filter((c) => c.kind === "spending" && c.fixed_variable === "fixed");
}
