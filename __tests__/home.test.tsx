import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { dollarsDown, dollarsUp, leftDisplay, spentShare, toCents } from "@/utils/money";
import { billDueLabel, goalLine, longDate, stateMessage, weekDays } from "@/utils/home";
import type { WeekOutlook } from "@/utils/homeApi";

const mockHome = { weekOutlook: jest.fn(), markBillPaid: jest.fn(), markBillUnpaid: jest.fn() };
const mockAccounts = { listAccounts: jest.fn() };
const mockPush = jest.fn();
jest.mock("@/utils/homeApi", () => ({
  weekOutlook: (...a: unknown[]) => mockHome.weekOutlook(...a),
  markBillPaid: (...a: unknown[]) => mockHome.markBillPaid(...a),
  markBillUnpaid: (...a: unknown[]) => mockHome.markBillUnpaid(...a),
}));
jest.mock("@/utils/activityApi", () => ({ listAccounts: (...a: unknown[]) => mockAccounts.listAccounts(...a) }));
jest.mock("expo-router", () => {
  const { useEffect } = jest.requireActual("react");
  return { useRouter: () => ({ push: mockPush }), useFocusEffect: (cb: () => void) => useEffect(cb, [cb]) };
});
jest.mock("@/utils/api", () => ({ api: {} }));
jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);
jest.mock("@/components/brand/Mascot", () => ({ Mascot: () => null }));
jest.mock("@/components/account/AccountSheet", () => ({ AccountSheet: () => null }));
jest.mock("@/hooks/useSession", () => ({ useLogout: () => jest.fn() }));
jest.mock("@/store/budget", () => ({ useBudgetStore: (sel: (s: unknown) => unknown) => sel({ user: { given_name: "Sam", email: "sam@example.com" } }) }));

import HomeScreen from "@/app/(tabs)/index";

// SPEC_LEFT_TO_SPEND worked example 1, as W1 returns it.
const outlook = (over: Partial<WeekOutlook> = {}, lts: Partial<WeekOutlook["left_to_spend"]> = {}): WeekOutlook => ({
  state: "ok",
  today: "2026-11-22",
  week: { start: "2026-11-16", end: "2026-11-22" },
  data_through: "2026-11-22",
  left_to_spend: {
    allowance: "149.33",
    spent: "85.60",
    left: "63.73",
    uncategorized_spent: "0.00",
    uncategorized_count: 0,
    by_category: [{ category: "groceries", name: "Groceries", allowance: "93.33", spent: "62.10", left: "31.23" }],
    ...lts,
  },
  bills_due: {
    window: { start: "2026-11-22", end: "2026-11-28" },
    items: [
      { obligation_id: 4, name: "Phone", amount: "45.00", due_on: "2026-11-17", paid: false, paid_on: null, overdue: true },
      { obligation_id: 3, name: "Rent", amount: "1200.00", due_on: "2026-11-23", paid: false, paid_on: null, overdue: false },
    ],
  },
  goal_contributions: [
    { goal_id: 9, name: "Car insurance", needed_this_week: "43.75", set_aside_this_week: "10.00", still_needed_this_week: "33.75", target_date: "2026-12-13" },
  ],
  assumptions: ["Only everyday (flexible) categories count; bills are listed separately."],
  ...over,
});

describe("conservative money display (utils/money.ts, plan C3)", () => {
  it("rounds left and the allowance down, the overage up", () => {
    expect(leftDisplay("63.73")).toEqual({ amount: "$63", overBy: null });
    expect(leftDisplay("-21.67")).toEqual({ amount: "$0", overBy: "$22" });
    expect(dollarsDown("149.33")).toBe("$149");
    expect(dollarsDown("150.00")).toBe("$150");
    expect(leftDisplay("-22.00")).toEqual({ amount: "$0", overBy: "$22" });
    expect(dollarsUp("33.75")).toBe("$34");
    expect(dollarsDown("1234.99")).toBe("$1,234");
    expect(leftDisplay("0.00")).toEqual({ amount: "$0", overBy: null });
    expect(leftDisplay("-0.01")).toEqual({ amount: "$0", overBy: "$1" });
  });

  it("works in exact cents, never floats", () => {
    expect(toCents("0.29")).toBe(29);
    expect(toCents("-1200.5")).toBe(-120050);
    expect(dollarsDown("0.99")).toBe("$0");
  });

  it("the bar's share stays between 0 and 1", () => {
    expect(spentShare("85.60", "149.33")).toBeCloseTo(0.5732, 3);
    expect(spentShare("171.00", "149.33")).toBe(1);
    expect(spentShare("5.00", "0.00")).toBe(1);
    expect(spentShare("0.00", "0.00")).toBe(0);
  });
});

describe("Home labels", () => {
  it("dates, week days, bills, goals and state messages", () => {
    expect(longDate("2026-11-22")).toBe("Sunday, Nov 22");
    expect(weekDays({ start: "2026-11-16", end: "2026-11-22" })).toBe("Mon–Sun");
    expect(weekDays({ start: "2026-11-15", end: "2026-11-21" })).toBe("Sun–Sat");
    const bills = outlook().bills_due.items;
    expect(billDueLabel(bills[0], "2026-11-22")).toBe("Was due Tue, Nov 17, mark paid if done");
    expect(billDueLabel(bills[1], "2026-11-22")).toBe("Due Mon, Nov 23");
    expect(billDueLabel({ ...bills[1], due_on: "2026-11-22" }, "2026-11-22")).toBe("Due today");
    expect(billDueLabel({ ...bills[1], paid: true, paid_on: "2026-11-21" }, "2026-11-22")).toBe("Paid Sat, Nov 21");
    expect(goalLine(outlook().goal_contributions[0])).toBe("$34 more toward Car insurance this week");
    expect(goalLine({ ...outlook().goal_contributions[0], still_needed_this_week: "0.00" })).toBe("Car insurance: set aside for this week");
    expect(stateMessage("no_data_this_week", "2026-11-14", "2026-11-18")).toBe("No transactions imported for this week yet.");
    expect(stateMessage("ok", "2026-11-21", "2026-11-22")).toBe("Spending counted through Sat, Nov 21.");
    expect(stateMessage("ok", "2026-11-22", "2026-11-22")).toBeNull();
    expect(stateMessage("stale", "2026-11-10", "2026-11-22")).toContain("Tue, Nov 10");
  });
});

describe("Home screen (C3)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAccounts.listAccounts.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);
  });

  it("ok: the headline, the week, bills, goals; the number opens the details", async () => {
    mockHome.weekOutlook.mockResolvedValue(outlook());
    render(<HomeScreen />);
    expect(await screen.findByText("$63")).toBeTruthy();
    expect(screen.getByText("Sunday, Nov 22")).toBeTruthy();
    expect(screen.getByText("Left to spend · Mon–Sun")).toBeTruthy();
    expect(screen.getByText("of $149 for the week")).toBeTruthy();
    expect(screen.getByText("Was due Tue, Nov 17, mark paid if done")).toBeTruthy();
    expect(screen.getByText("$1,200.00")).toBeTruthy();
    expect(screen.getByText("$34 more toward Car insurance this week")).toBeTruthy();
    expect(screen.queryByText(/Over budget/)).toBeNull();
    fireEvent.press(screen.getByLabelText("$63 left. Show details"));
    expect(screen.getByText(/^\$62\.10 of \$93\.33 · \$31\.23 left$/)).toBeTruthy();
    expect(screen.getByText(/^\$85\.60 of \$149\.33 · \$63\.73 left$/)).toBeTruthy();
  });

  it("a bill paid earlier this week shows a tick and can be undone", async () => {
    const base = outlook();
    const paidPhone = { ...base.bills_due.items[0], paid: true, paid_on: "2026-11-22", overdue: false };
    mockHome.weekOutlook.mockResolvedValue(outlook({ bills_due: { ...base.bills_due, items: [paidPhone, base.bills_due.items[1]] } }));
    mockHome.markBillUnpaid.mockResolvedValue(undefined);
    render(<HomeScreen />);
    expect(await screen.findByText("Paid Sun, Nov 22")).toBeTruthy();
    fireEvent.press(screen.getByLabelText("Phone, $45.00: paid. Mark unpaid"));
    await waitFor(() => expect(mockHome.markBillUnpaid).toHaveBeenCalledWith(4, "2026-11-17"));
  });

  it("the detail sheet leaves out categories with no budget and no spending", () => {
    const { visibleLines } = jest.requireActual("@/components/home/OutlookSheet");
    const lines = [
      { allowance: "0.00", spent: "0.00", name: "Gifts" },
      { allowance: "0.00", spent: "12.00", name: "Travel" },
      { allowance: "5.83", spent: "0.00", name: "Other" },
    ];
    expect(visibleLines(lines).map((l: { name: string }) => l.name)).toEqual(["Travel", "Other"]);
  });

  it("overspent: $0 left with the warning label and the overage rounded up", async () => {
    mockHome.weekOutlook.mockResolvedValue(outlook({}, { spent: "171.00", left: "-21.67" }));
    render(<HomeScreen />);
    expect(await screen.findByText("Over budget · over by $22")).toBeTruthy();
    expect(screen.getByText("$0")).toBeTruthy();
  });

  it("uncategorized transactions link to Review; data through yesterday is said", async () => {
    mockHome.weekOutlook.mockResolvedValue(outlook({ data_through: "2026-11-21" }, { uncategorized_count: 2 }));
    render(<HomeScreen />);
    fireEvent.press(await screen.findByText("Includes 2 transactions to review"));
    expect(mockPush).toHaveBeenCalledWith("/activity/review");
    expect(screen.getByText("Spending counted through Sat, Nov 21.")).toBeTruthy();
  });

  it("stale: the import message and action, the allowance still shown", async () => {
    mockHome.weekOutlook.mockResolvedValue(outlook({ state: "stale", data_through: "2026-11-10" }, { spent: "0.00", left: "149.33" }));
    render(<HomeScreen />);
    fireEvent.press(await screen.findByText("Import new transactions"));
    expect(mockPush).toHaveBeenCalledWith("/activity");
    expect(screen.getByText("$149")).toBeTruthy();
  });

  it("no plan: the plan card and the accounts note, no number", async () => {
    mockHome.weekOutlook.mockResolvedValue(outlook({ state: "no_plan", data_through: "2026-11-21" }, { allowance: "0.00", spent: "0.00", left: "0.00" }));
    render(<HomeScreen />);
    expect(await screen.findByText("3 accounts imported")).toBeTruthy();
    expect(screen.getByText("Data through Sat, Nov 21")).toBeTruthy();
    expect(screen.queryByText(/Left to spend/)).toBeNull();
    fireEvent.press(screen.getByText("Make a plan with your coach"));
    expect(mockPush).toHaveBeenCalledWith("/onboarding");
  });

  it("mark paid calls the bills endpoint and reloads; the headline doesn't change", async () => {
    mockHome.weekOutlook.mockResolvedValue(outlook());
    mockHome.markBillPaid.mockResolvedValue(undefined);
    render(<HomeScreen />);
    fireEvent.press(await screen.findByLabelText("Rent, $1,200.00: mark paid"));
    await waitFor(() => expect(mockHome.markBillPaid).toHaveBeenCalledWith(3, "2026-11-23"));
    await waitFor(() => expect(mockHome.weekOutlook).toHaveBeenCalledTimes(2));
    expect(screen.getByText("$63")).toBeTruthy();
  });

  it("a network error shows a message and Try again", async () => {
    mockHome.weekOutlook.mockRejectedValueOnce(new Error("offline")).mockResolvedValue(outlook());
    render(<HomeScreen />);
    fireEvent.press(await screen.findByText("Try again"));
    expect(await screen.findByText("$63")).toBeTruthy();
    await act(async () => undefined);
  });
});
