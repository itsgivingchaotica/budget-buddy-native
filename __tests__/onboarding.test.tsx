import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { answerLabel } from "@/components/onboarding/InterviewStep";
import { moreWaiting } from "@/components/onboarding/MerchantsStep";
import { firstUnanswered, goalDateLabel, goalReady, keptBills, monthsAhead, stepNumber } from "@/utils/onboarding";
import type { OnboardingState, Question } from "@/utils/onboardingApi";

const mockOnb = { getOnboarding: jest.fn(), saveAnswers: jest.fn() };
const mockAct = { listAccounts: jest.fn(), reviewGroups: jest.fn(), listCategories: jest.fn(), pickCategory: jest.fn(), undoCorrection: jest.fn() };
jest.mock("@/utils/onboardingApi", () => ({
  getOnboarding: (...a: unknown[]) => mockOnb.getOnboarding(...a),
  saveAnswers: (...a: unknown[]) => mockOnb.saveAnswers(...a),
}));
jest.mock("@/utils/activityApi", () => ({
  listAccounts: (...a: unknown[]) => mockAct.listAccounts(...a),
  reviewGroups: (...a: unknown[]) => mockAct.reviewGroups(...a),
  listCategories: (...a: unknown[]) => mockAct.listCategories(...a),
  pickCategory: (...a: unknown[]) => mockAct.pickCategory(...a),
  undoCorrection: (...a: unknown[]) => mockAct.undoCorrection(...a),
  templateUrl: () => "https://example.invalid/template.csv",
  apiError: (e: { response?: { data?: { errors?: Record<string, string[]> } } }) => ({ fields: e?.response?.data?.errors }),
}));
jest.mock("@/utils/planApi", () => ({ fixedCategories: jest.fn(async () => [{ slug: "utilities", name: "Utilities", fixed_variable: "fixed", kind: "spending" }]) }));
jest.mock("@/utils/api", () => ({ api: {} }));
jest.mock("expo-web-browser", () => ({ openBrowserAsync: jest.fn() }));
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true };
jest.mock("expo-router", () => {
  const { useEffect } = jest.requireActual("react");
  return { useRouter: () => mockRouter, useFocusEffect: (cb: () => void) => useEffect(cb, [cb]) };
});
jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);
jest.mock("@/components/brand/Mascot", () => ({ Mascot: () => null }));

import OnboardingScreen from "@/app/onboarding/index";

const QUESTIONS: Question[] = [
  {
    id: "pay",
    text: "How often does your main paycheck arrive?",
    hint: "Looks like every 2 weeks, last on Fri, Nov 13.",
    options: [
      { value: "weekly", label: "Weekly" },
      { value: "biweekly", label: "Every 2 weeks" },
      { value: "irregular", label: "It varies" },
    ],
    prefill: { frequency: "biweekly", next_pay_on: "2026-11-27", typical_amount: "2300.00" },
  },
  {
    id: "side_income",
    text: "I see about $410 a month coming into Venmo. Is that income from your side job?",
    options: [
      { value: "yes", label: "Yes, count it" },
      { value: "no", label: "No, it's not income" },
    ],
    prefill: null,
  },
  {
    id: "bills",
    text: "These look like regular bills. Keep the ones that are right.",
    prefill: [
      { name: "OAK RENT", amount: "1850.00", day: 1, category: "rent", detected: true },
      { name: "VERIZON", amount: "65.00", day: 12, category: "utilities", detected: true },
    ],
  },
  {
    id: "goals",
    text: "What are you saving for or paying down?",
    options: [{ value: "emergency_fund", label: "Emergency fund" }],
    prefill: [],
  },
  {
    id: "change_appetite",
    text: "How big a change feels right?",
    options: [
      { value: "keep", label: "Keep things as they are" },
      { value: "trim", label: "Small trims" },
      { value: "push", label: "Push me a bit" },
    ],
    prefill: "trim",
  },
];

const state = (over: Partial<OnboardingState> = {}): OnboardingState => ({ version: 1, step: "accounts", has_import: true, questions: QUESTIONS, answers: {}, ...over });

describe("onboarding helpers", () => {
  it("steps, resume point, kept bills", () => {
    expect(["accounts", "interview", "merchants", "plan"].map((s) => stepNumber(s as never))).toEqual([1, 2, 3, 4]);
    expect(firstUnanswered(QUESTIONS, {})).toBe(0);
    expect(firstUnanswered(QUESTIONS, { pay: {}, side_income: "yes" })).toBe(2);
    expect(firstUnanswered(QUESTIONS, { pay: {}, side_income: "yes", bills: [], goals: [], change_appetite: "trim" })).toBe(4);
    const bills = (QUESTIONS[2] as Extract<Question, { id: "bills" }>).prefill;
    expect(keptBills(bills, { 1: false }).map((b) => b.name)).toEqual(["OAK RENT"]);
  });

  it("goal dates and completeness", () => {
    expect(monthsAhead("2026-11-26", 3)).toBe("2027-02-28");
    expect(monthsAhead("2026-11-26", 6)).toBe("2027-05-31");
    expect(goalDateLabel("2026-12-31", "2026-11-26")).toBe("By Dec 31");
    expect(goalDateLabel("2027-05-31", "2026-11-26")).toBe("By May 31, 2027");
    expect(goalReady({ kind: "emergency_fund", amount: "2000" })).toBe(true);
    expect(goalReady({ kind: "upcoming_payment", name: "Car", amount: "600" })).toBe(false);
    expect(goalReady({ kind: "debt_payoff", name: "Card", balance: "1840", apr: "22.9", monthly_payment: "" })).toBe(false);
  });

  it("answer bubbles and the 'more waiting' count", () => {
    const a = { pay: { frequency: "biweekly" as const, next_pay_on: null, typical_amount: null }, side: "yes", bills: [], goals: [], noGoals: true, appetite: "push" as const };
    expect(QUESTIONS.map((q) => answerLabel(q, a))).toEqual(["Every 2 weeks", "Yes, count it", "None of these", "Nothing for now", "Push me a bit"]);
    const groups = [{ merchant_key: "A", count: 6 }, { merchant_key: "B", count: 2 }] as never;
    expect(moreWaiting(41, groups, {})).toBe(33);
    expect(moreWaiting(35, groups, { A: { name: "X", alsoUpdated: 5, correctionId: 1 } })).toBe(33);
  });
});

describe("Onboarding screen (C5)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAct.listAccounts.mockResolvedValue([
      { id: 1, name: "Everyday Checking", kind: "checking", purpose: "spending", purpose_note: null, archived_at: null, data_through: "2026-11-21", transaction_count: 1482 },
      { id: 3, name: "Venmo", kind: "p2p", purpose: "side_income", purpose_note: null, archived_at: null, data_through: null, transaction_count: 0 },
    ]);
    mockOnb.saveAnswers.mockImplementation(async (input: { step?: string }) => state({ step: (input.step as never) ?? "interview" }));
  });

  it("step 1: accounts with their import state; Upload opens Import; Continue saves the step", async () => {
    mockOnb.getOnboarding.mockResolvedValue(state());
    render(<OnboardingScreen />);
    expect(await screen.findByText("Bring in your money history")).toBeTruthy();
    expect(screen.getByText("Everyday spending · 1,482 transactions")).toBeTruthy();
    expect(screen.getByText("Side-job income · no file yet")).toBeTruthy();
    fireEvent.press(screen.getByText("Upload CSV"));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/activity/import", params: { accountId: "3" } });
    fireEvent.press(screen.getByText("Continue"));
    await waitFor(() => expect(mockOnb.saveAnswers).toHaveBeenCalledWith({ step: "interview" }));
  });

  it("step 1: Continue waits for an import", async () => {
    mockOnb.getOnboarding.mockResolvedValue(state({ has_import: false }));
    render(<OnboardingScreen />);
    expect(await screen.findByText("Import at least one account to continue.")).toBeTruthy();
    fireEvent.press(screen.getByText("Continue"));
    expect(mockOnb.saveAnswers).not.toHaveBeenCalled();
  });

  it("step 2: prefilled pay, then each answer is saved before the next question", async () => {
    mockOnb.getOnboarding.mockResolvedValue(state({ step: "interview" }));
    render(<OnboardingScreen />);
    expect(await screen.findByText("How often does your main paycheck arrive? Looks like every 2 weeks, last on Fri, Nov 13.")).toBeTruthy();
    expect(screen.getByText("Question 1 of 5")).toBeTruthy();
    fireEvent.press(screen.getByText("Next question"));
    await waitFor(() => expect(mockOnb.saveAnswers).toHaveBeenCalledWith({ pay: { frequency: "biweekly", next_pay_on: "2026-11-27", typical_amount: "2300.00" } }));
    fireEvent.press(await screen.findByText("Yes, count it"));
    fireEvent.press(screen.getByText("Next question"));
    await waitFor(() => expect(mockOnb.saveAnswers).toHaveBeenLastCalledWith({ side_income: "yes" }));
    fireEvent.press(await screen.findByLabelText(/VERIZON/));
    fireEvent.press(screen.getByText("Next question"));
    await waitFor(() => expect(mockOnb.saveAnswers).toHaveBeenLastCalledWith({ bills: [expect.objectContaining({ name: "OAK RENT" })] }));
    fireEvent.press(await screen.findByText("Nothing for now"));
    fireEvent.press(screen.getByText("Next question"));
    await waitFor(() => expect(mockOnb.saveAnswers).toHaveBeenLastCalledWith({ goals: [] }));
    fireEvent.press(await screen.findByText("Push me a bit"));
    fireEvent.press(screen.getByText("Done"));
    await waitFor(() => expect(mockOnb.saveAnswers).toHaveBeenCalledWith({ change_appetite: "push" }));
    await waitFor(() => expect(mockOnb.saveAnswers).toHaveBeenLastCalledWith({ step: "merchants" }));
  });

  it("step 2 resumes at the first unanswered question", async () => {
    mockOnb.getOnboarding.mockResolvedValue(state({ step: "interview", answers: { pay: { frequency: "biweekly" }, side_income: "yes" } }));
    render(<OnboardingScreen />);
    expect(await screen.findByText("Question 3 of 5")).toBeTruthy();
    expect(screen.getByText("These look like regular bills. Keep the ones that are right.")).toBeTruthy();
  });

  it("a server validation message is shown and the question stays", async () => {
    mockOnb.getOnboarding.mockResolvedValue(state({ step: "interview" }));
    mockOnb.saveAnswers.mockRejectedValueOnce({ response: { data: { errors: { pay: ["next_pay_on must be a date (YYYY-MM-DD)"] } } } });
    render(<OnboardingScreen />);
    fireEvent.press(await screen.findByText("Next question"));
    expect(await screen.findByText("next_pay_on must be a date (YYYY-MM-DD)")).toBeTruthy();
    expect(screen.getByText("Question 1 of 5")).toBeTruthy();
  });

  it("step 3: top review groups, pick a category, Looks good moves on", async () => {
    mockOnb.getOnboarding.mockResolvedValue(state({ step: "merchants" }));
    const dining = { id: 7, slug: "dining-out", name: "Dining Out" };
    mockAct.reviewGroups.mockResolvedValue({
      remaining: 41,
      groups: [
        { merchant_key: "HARBOR BEAN", display_name: "SQ *HARBOR BEAN", count: 6, total: "-40.50", accounts: [{ id: 1, name: "Everyday Checking", purpose: "spending" }], representative_transaction_id: 42, suggested_category: dining, alternatives: [] },
      ],
    });
    mockAct.listCategories.mockResolvedValue([{ ...dining, kind: "spending" }]);
    mockAct.pickCategory.mockResolvedValue({ also_updated: 5, correction_id: 9 });
    render(<OnboardingScreen />);
    expect(await screen.findByText("A few I wasn't sure about")).toBeTruthy();
    expect(screen.getByText("35 more are waiting in Activity whenever you're ready.")).toBeTruthy();
    fireEvent.press(screen.getByLabelText("Dining Out?"));
    await waitFor(() => expect(mockAct.pickCategory).toHaveBeenCalledWith(42, "dining-out"));
    fireEvent.press(screen.getByText("Looks good"));
    await waitFor(() => expect(mockOnb.saveAnswers).toHaveBeenLastCalledWith({ step: "plan" }));
    expect(await screen.findByText("Your answers are saved")).toBeTruthy();
    await act(async () => undefined);
  });

  it("Later leaves onboarding", async () => {
    mockOnb.getOnboarding.mockResolvedValue(state());
    render(<OnboardingScreen />);
    fireEvent.press(await screen.findByText("Later"));
    expect(mockRouter.back).toHaveBeenCalled();
  });
});
