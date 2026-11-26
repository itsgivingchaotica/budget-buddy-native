import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { billInput } from "@/components/plan/BillSheet";
import { stepAmount } from "@/components/plan/BudgetSheet";
import { contributionInput } from "@/components/plan/ContributionSheet";
import { goalLines } from "@/components/plan/GoalsSection";
import { billAmount } from "@/components/plan/BillsSection";
import { billChip, budgetLeft, dayChipLabel, nextMonthlyDue, ordinal, scheduleLabel, shiftMonth, spentText } from "@/utils/plan";
import type { Bill, BillList, BudgetMonth, Goal } from "@/utils/planApi";

const mockPlan = {
  budgetMonth: jest.fn(),
  listBills: jest.fn(),
  listGoals: jest.fn(),
  budgetContext: jest.fn(),
  saveBudget: jest.fn(),
  createBill: jest.fn(),
  updateBill: jest.fn(),
  archiveBill: jest.fn(),
  payBill: jest.fn(),
  unpayBill: jest.fn(),
  addContribution: jest.fn(),
  undoContribution: jest.fn(),
  fixedCategories: jest.fn(),
};
jest.mock("@/utils/planApi", () => {
  const out: Record<string, unknown> = { WHAT_IF_EXTRA: 50 };
  const names = ["budgetMonth", "listBills", "listGoals", "budgetContext", "saveBudget", "createBill", "updateBill", "archiveBill", "payBill", "unpayBill", "addContribution", "undoContribution", "fixedCategories"];
  for (const k of names) out[k] = (...a: unknown[]) => (mockPlan as Record<string, jest.Mock>)[k](...a);
  return out;
});
jest.mock("@/utils/activityApi", () => ({ listAccounts: jest.fn(async () => [{ id: 1, name: "Everyday Checking" }]) }));
jest.mock("@/utils/api", () => ({ api: {} }));
const mockPush = jest.fn();
jest.mock("expo-router", () => {
  const { useEffect } = jest.requireActual("react");
  return {
    useRouter: () => ({ push: mockPush }),
    useLocalSearchParams: () => ({}),
    useFocusEffect: (cb: () => void) => useEffect(cb, [cb]),
  };
});
jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);
jest.mock("@/components/brand/Mascot", () => ({ Mascot: () => null }));

import PlanScreen from "@/app/(tabs)/plan";

const TODAY = "2026-11-26";

const budgets = (over: Partial<BudgetMonth> = {}): BudgetMonth => ({
  month: "2026-11",
  plan_exists: true,
  categories: [
    { category: "groceries", name: "Groceries", budget: "480.00", spent: "356.20", remaining: "123.80", status: "under" },
    { category: "dining-out", name: "Dining Out", budget: "180.00", spent: "185.40", remaining: "-5.40", status: "over" },
  ],
  unbudgeted: [{ category: "clothing", name: "Clothing", spent: "63.50" }],
  uncategorized: "18.00",
  totals: { budget: "660.00", spent: "541.60", remaining: "118.40", everyday_spent: "623.10" },
  data_through: "2026-11-21",
  ...over,
});

const bill = (over: Partial<Bill> = {}): Bill => ({
  id: 3,
  name: "Phone",
  amount: "45.00",
  category: "utilities",
  category_name: "Utilities",
  account_id: null,
  first_due_on: "2026-01-24",
  recurrence: "monthly",
  interval: 1,
  day_of_month: 24,
  ends_on: null,
  archived_at: null,
  next_due_on: "2026-12-24",
  current: { due_on: "2026-11-24", status: "was_due", paid_on: null },
  ...over,
});

const bills = (items: Bill[] = [bill()]): BillList => ({ today: TODAY, summary: { monthly_total: "1596.99", due_in_next_7_days: 3 }, obligations: items });

const carFund: Goal = {
  id: 7,
  goal_type: "purchase",
  name: "Car fund",
  status: "active",
  target_amount: "3000.00",
  target_date: "2027-06-01",
  apr: null,
  monthly_payment: null,
  progress: {
    kind: "saving",
    saved: "1260.00",
    target: "3000.00",
    remaining: "1740.00",
    percent: 42,
    set_aside_this_week: "0.00",
    weeks_left: 28,
    needed_per_week: "62.15",
    still_needed_this_week: "62.15",
    on_track: true,
    past_target_date: false,
    milestones: [25, 50, 75, 100].map((p) => ({ percent: p, amount: "0", reached: p === 25, reached_on: null, projected_on: null })),
    assumptions: [],
  },
};

const card: Goal = {
  id: 8,
  goal_type: "debt_payoff",
  name: "Pay off the card",
  status: "active",
  target_amount: null,
  target_date: null,
  apr: "22.90",
  monthly_payment: "120.00",
  progress: {
    kind: "debt",
    balance: "1840.00",
    starting_balance: "2560.00",
    percent_paid: 28,
    interest_this_month: "35.12",
    payoff: { never_pays_off: false, months: 19, payoff_month: "2028-06", total_interest: "357.75" },
    what_if: { extra: "50.00", never_pays_off: false, months: 13, payoff_month: "2027-12", total_interest: "143.70", interest_saved: "214.05", months_sooner: 6 },
    on_track: false,
    milestones: [25, 50, 75, 100].map((p) => ({ percent: p, amount: "0", reached: p === 25, reached_on: null, projected_on: null })),
    assumptions: [],
  },
};

describe("Plan labels (utils/plan.ts)", () => {
  it("ordinals, schedules and months", () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 31].map(ordinal)).toEqual(["1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "23rd", "31st"]);
    expect(scheduleLabel(bill())).toBe("Monthly · 24th");
    expect(scheduleLabel(bill({ recurrence: "biweekly", day_of_month: null, first_due_on: "2026-11-27" }))).toBe("Every 2 weeks · Fri");
    expect(scheduleLabel(bill({ recurrence: "monthly", interval: 3, day_of_month: 15 }))).toBe("Every 3 months · 15th");
    expect(shiftMonth("2026-11", 1)).toBe("2026-12");
    expect(shiftMonth("2027-01", -1)).toBe("2026-12");
  });

  it("budget rows: left rounded down, over rounded up and in words, spent rounded up", () => {
    expect(budgetLeft({ remaining: "123.80" })).toEqual({ text: "$123 left", over: false });
    expect(budgetLeft({ remaining: "-5.40" })).toEqual({ text: "$6 over", over: true });
    expect(spentText("356.20")).toBe("$357 spent");
  });

  it("bill chips: paid, was due, due soon, due", () => {
    expect(billChip(bill({ current: { due_on: "2026-11-01", status: "paid", paid_on: "2026-11-01" } }), TODAY)).toEqual({ label: "Paid Nov 1", tone: "positive" });
    expect(billChip(bill(), TODAY)).toEqual({ label: "Was due Nov 24", tone: "overdue" });
    expect(billChip(bill({ current: { due_on: "2026-11-28", status: "due_soon", paid_on: null } }), TODAY)).toEqual({ label: "Due Sat, Nov 28", tone: "review" });
    expect(billChip(bill({ current: { due_on: "2026-12-12", status: "due", paid_on: null } }), TODAY)).toEqual({ label: "Due Dec 12", tone: "neutral" });
    expect(billAmount("1250.00")).toBe("$1,250");
    expect(billAmount("15.99")).toBe("$15.99");
  });

  it("monthly bills on the 29th–31st fall on a shorter month's last day", () => {
    expect(nextMonthlyDue(31, "2026-11-26")).toBe("2026-11-30");
    expect(nextMonthlyDue(31, "2027-02-10")).toBe("2027-02-28");
    expect(nextMonthlyDue(5, "2026-11-26")).toBe("2026-12-05");
    expect(nextMonthlyDue(26, "2026-11-26")).toBe("2026-11-26");
    expect(dayChipLabel("2026-11-25", TODAY)).toBe("Yesterday");
  });
});

describe("Plan forms", () => {
  it("the budget stepper moves by $10 within $0–$10,000", () => {
    expect([stepAmount(180, 10), stepAmount(5, -10), stepAmount(9995, 10)]).toEqual([190, 0, 10000]);
  });

  it("bill input: monthly with its day, or a weekly start date; refuses incomplete forms", () => {
    const base = { name: " Phone ", amount: "$45", category: "utilities", schedule: "monthly" as const, day: 31, nextDue: TODAY, accountId: null, today: TODAY };
    expect(billInput(base)).toEqual({ name: "Phone", amount: "45.00", category: "utilities", account_id: null, recurrence: "monthly", day_of_month: 31, first_due_on: "2026-11-30" });
    expect(billInput({ ...base, schedule: "weekly", nextDue: "2026-11-27" })).toMatchObject({ recurrence: "weekly", day_of_month: null, first_due_on: "2026-11-27" });
    expect(billInput({ ...base, amount: "0" })).toBeNull();
    expect(billInput({ ...base, category: "" })).toBeNull();
    expect(billInput({ ...base, name: "  " })).toBeNull();
  });

  it("contribution input: amount > 0 for saving, any balance ≥ 0 for debt", () => {
    expect(contributionInput(false, "50", TODAY, " paycheck ")).toEqual({ amount: "50.00", contributed_on: TODAY, note: "paycheck" });
    expect(contributionInput(false, "0", TODAY, "")).toBeNull();
    expect(contributionInput(true, "0", TODAY, "")).toEqual({ balance_after: "0.00", contributed_on: TODAY });
    expect(contributionInput(true, "abc", TODAY, "")).toBeNull();
  });

  it("goal card lines: saving with its weekly amount; debt with payoff and what-if", () => {
    expect(goalLines(carFund)).toMatchObject({
      subtitle: "Purchase · by Jun 1, 2027",
      chip: { label: "On track", good: true },
      headline: "$1,260",
      headlineSuffix: "of $3,000",
      percent: "42%",
      weekly: "Set aside $63 a week to get there on time.",
    });
    expect(goalLines(card)).toMatchObject({
      subtitle: "Debt · 22.9% APR",
      chip: { label: "Behind", good: false },
      headline: "$1,840",
      headlineSuffix: "left to pay",
      percent: "28% paid",
      payoff: "Paid off in Jun 2028 at $120 a month · $35.12 interest this month",
      whatIf: "Paying $50 more a month: paid off Dec 2027, saving $214 in interest.",
    });
    const never = { ...card, progress: { ...card.progress, payoff: { never_pays_off: true, months: null, payoff_month: null, total_interest: null } } } as Goal;
    expect(goalLines(never).payoff).toContain("never gets paid off");
    const undated = { ...carFund, target_date: null, progress: { ...carFund.progress, on_track: null, needed_per_week: null } } as Goal;
    expect(goalLines(undated)).toMatchObject({ subtitle: "Purchase", chip: null, weekly: null });
  });
});

describe("Plan screen (C8)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPlan.budgetMonth.mockResolvedValue(budgets());
    mockPlan.listBills.mockResolvedValue(bills());
    mockPlan.listGoals.mockResolvedValue([carFund, card]);
    mockPlan.budgetContext.mockResolvedValue({ category: "dining-out", name: "Dining Out", month: "2026-11", amount: "180.00", weekly_equivalent: "41.00", average_last_3_months: "213.40", months_averaged: 3, spent_this_month: "185.40" });
    mockPlan.fixedCategories.mockResolvedValue([{ slug: "utilities", name: "Utilities", fixed_variable: "fixed", kind: "spending" }]);
  });

  it("Budgets: the summary, an over row in words, No budget yet, uncategorized", async () => {
    render(<PlanScreen />);
    expect(await screen.findByText("Everyday budgets · November")).toBeTruthy();
    expect(screen.getByText("$624 spent\nthrough Nov 21")).toBeTruthy();
    expect(screen.getByText("$6 over")).toBeTruthy();
    expect(screen.getByText("$123 left")).toBeTruthy();
    expect(screen.getByText("No budget yet")).toBeTruthy();
    expect(screen.getByText("Not yet categorized · $18")).toBeTruthy();
  });

  it("changing a budget: −/+ by $10, the API's figures for the amount shown, saves the whole month", async () => {
    mockPlan.saveBudget.mockResolvedValue(undefined);
    render(<PlanScreen />);
    fireEvent.press(await screen.findByLabelText(/Dining Out, \$180 a month/));
    fireEvent.press(screen.getByLabelText("Increase by $10"));
    fireEvent.press(screen.getByLabelText("Increase by $10"));
    await waitFor(() => expect(mockPlan.budgetContext).toHaveBeenLastCalledWith("dining-out", 200));
    expect(await screen.findByText("$214")).toBeTruthy();
    expect(screen.getByText("Applies to all of November, including this week's Left to spend.")).toBeTruthy();
    fireEvent.press(screen.getByText("Save $200 a month"));
    await waitFor(() => expect(mockPlan.saveBudget).toHaveBeenCalledWith("dining-out", 200));
  });

  it("No budget yet: tapping a category opens the sheet at $0", async () => {
    render(<PlanScreen />);
    fireEvent.press(await screen.findByLabelText(/Clothing/));
    expect(await screen.findByText("Save $0 a month")).toBeTruthy();
  });

  it("previous month is read only; the next arrow returns", async () => {
    render(<PlanScreen />);
    await screen.findByText("Everyday budgets · November");
    mockPlan.budgetMonth.mockResolvedValueOnce(budgets({ month: "2026-10" }));
    fireEvent.press(screen.getByLabelText("Previous month"));
    await waitFor(() => expect(mockPlan.budgetMonth).toHaveBeenLastCalledWith("2026-10"));
    expect(await screen.findByText("October · read only")).toBeTruthy();
  });

  it("Bills: the summary and chips; mark paid from the bill sheet", async () => {
    mockPlan.payBill.mockResolvedValue(undefined);
    render(<PlanScreen />);
    fireEvent.press(await screen.findByLabelText("Bills"));
    expect(screen.getByText("$1,596.99")).toBeTruthy();
    expect(screen.getByText("Was due Nov 24")).toBeTruthy();
    fireEvent.press(screen.getByLabelText(/Phone, \$45/));
    fireEvent.press(await screen.findByText("Mark paid"));
    await waitFor(() => expect(mockPlan.payBill).toHaveBeenCalledWith(3, "2026-11-24"));
  });

  it("Add a bill due on the 31st sends day 31 and this month's last day", async () => {
    mockPlan.createBill.mockResolvedValue(bill());
    render(<PlanScreen />);
    fireEvent.press(await screen.findByLabelText("Bills"));
    fireEvent.press(screen.getByLabelText("Add a bill"));
    fireEvent.changeText(screen.getByLabelText("Bill name"), "Gym");
    fireEvent.changeText(screen.getByLabelText("Amount in dollars"), "30");
    for (let i = 0; i < 5; i++) fireEvent.press(screen.getByLabelText("Later day")); // 26 → 31
    fireEvent.press(await screen.findByText("Utilities"));
    fireEvent.press(screen.getByText("Add bill"));
    await waitFor(() =>
      expect(mockPlan.createBill).toHaveBeenCalledWith(expect.objectContaining({ name: "Gym", amount: "30.00", day_of_month: 31, first_due_on: "2026-11-30" }))
    );
  });

  it("Goals: set aside, then Undo within 5 seconds", async () => {
    mockPlan.addContribution.mockResolvedValue({ contribution: { id: 55 } });
    mockPlan.undoContribution.mockResolvedValue(undefined);
    render(<PlanScreen />);
    fireEvent.press(await screen.findByLabelText("Goals"));
    expect(screen.getByText("Paying $50 more a month: paid off Dec 2027, saving $214 in interest.")).toBeTruthy();
    fireEvent.press(screen.getByText("Set aside money"));
    fireEvent.changeText(screen.getByLabelText("Amount in dollars"), "50");
    fireEvent.press(screen.getByText("Set aside"));
    await waitFor(() => expect(mockPlan.addContribution).toHaveBeenCalledWith(7, { amount: "50.00", contributed_on: TODAY }));
    fireEvent.press(await screen.findByLabelText("Undo"));
    await waitFor(() => expect(mockPlan.undoContribution).toHaveBeenCalledWith(7, 55));
  });

  it("no plan at all: the Let's make a plan card, no segments", async () => {
    mockPlan.budgetMonth.mockResolvedValue(budgets({ plan_exists: false, categories: [] }));
    mockPlan.listBills.mockResolvedValue(bills([]));
    mockPlan.listGoals.mockResolvedValue([]);
    render(<PlanScreen />);
    expect(await screen.findByText("Let's make a plan together")).toBeTruthy();
    expect(screen.queryByLabelText("Bills")).toBeNull();
    await act(async () => undefined);
  });
});
