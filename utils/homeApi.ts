// C3 (Home screen): typed calls for Home, through utils/api.ts (C0). The
// figures come from W1 (GET /outlook/week); the app only formats them.
import { api } from "@/utils/api";

export type OutlookState = "ok" | "no_plan" | "stale" | "no_data_this_week";

export type CategoryLine = { category: string; name: string; allowance: string; spent: string; left: string };

export type BillItem = {
  obligation_id: number;
  name: string;
  amount: string;
  due_on: string;
  paid: boolean;
  paid_on: string | null;
  overdue: boolean;
};

export type GoalThisWeek = {
  goal_id: number;
  name: string;
  needed_this_week: string;
  set_aside_this_week: string;
  still_needed_this_week: string;
  target_date: string;
};

export type WeekOutlook = {
  state: OutlookState;
  today: string;
  week: { start: string; end: string };
  data_through: string | null;
  left_to_spend: {
    allowance: string;
    spent: string;
    left: string;
    uncategorized_spent: string;
    uncategorized_count: number;
    by_category: CategoryLine[];
  };
  bills_due: { window: { start: string; end: string }; items: BillItem[] };
  goal_contributions: GoalThisWeek[];
  assumptions: string[];
};

export async function weekOutlook(): Promise<WeekOutlook> {
  const { data } = await api.get<WeekOutlook>("/outlook/week");
  return data;
}

/** Mark paid / unpaid: the same endpoints as Plan → Bills (OB1), so both stay in sync. */
export async function markBillPaid(obligationId: number, dueOn: string): Promise<void> {
  await api.post(`/obligations/${obligationId}/payments`, { due_on: dueOn });
}

export async function markBillUnpaid(obligationId: number, dueOn: string): Promise<void> {
  await api.delete(`/obligations/${obligationId}/payments/${dueOn}`);
}
