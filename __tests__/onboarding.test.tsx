import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { answerLabel } from "@/components/onboarding/InterviewStep";
import { moreWaiting } from "@/components/onboarding/MerchantsStep";
import { billChoices, firstUnanswered, moveInOrder, nextFollowUp, goalDateLabel, goalReady, keptBills, monthsAhead, stepNumber } from "@/utils/onboarding";
import type { OnboardingState, Question } from "@/utils/onboardingApi";

const mockOnb = { getOnboarding: jest.fn(), saveAnswers: jest.fn(), getFollowUps: jest.fn() };
const mockAct = { listAccounts: jest.fn(), reviewGroups: jest.fn(), listCategories: jest.fn(), pickCategory: jest.fn(), undoCorrection: jest.fn() };
jest.mock("@/utils/onboardingApi", () => ({
  getOnboarding: (...a: unknown[]) => mockOnb.getOnboarding(...a),
  saveAnswers: (...a: unknown[]) => mockOnb.saveAnswers(...a),
  getFollowUps: (...a: unknown[]) => mockOnb.getFollowUps(...a),
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

const DETECTED = [
  { name: "OAK RENT", amount: "1850.00", day: 1, category: "rent" },
  { name: "VERIZON", amount: "65.00", day: 12, category: "utilities" },
];

const state = (over: Partial<OnboardingState> = {}): OnboardingState => ({
  version: 1,
  step: "accounts",
  has_import: true,
  facts: { likely_bills: DETECTED },
  questions: QUESTIONS,
  follow_ups: null,
  answers: {},
  ...over,
});

describe("onboarding helpers", () => {
  it("steps, resume point, kept bills", () => {
    expect(["accounts", "interview", "merchants", "plan"].map((s) => stepNumber(s as never))).toEqual([1, 2, 3, 4]);
    expect(firstUnanswered(QUESTIONS, {})).toBe(0);
    expect(firstUnanswered(QUESTIONS, { pay: {}, side_income: "yes" })).toBe(2);
    expect(firstUnanswered(QUESTIONS, { pay: {}, side_income: "yes", bills: [], goals: [], change_appetite: "trim" })).toBe(4);
    const bills = (QUESTIONS[2] as Extract<Question, { id: "bills" }>).prefill;
    expect(keptBills(bills, { 1: false }).map((b) => b.name)).toEqual(["OAK RENT"]);
  });

  it("the bills checklist: every bill found, removed ones unticked, added ones kept", () => {
    expect(billChoices(DETECTED, undefined)).toEqual({ bills: DETECTED.map((b) => ({ ...b, detected: true })), kept: {} });
    const saved = [
      { name: "OAK RENT", amount: "1900.00", day: 1, category: "rent", detected: true },
      { name: "Gym", amount: "30.00", day: 5, category: "utilities", detected: false },
    ];
    const { bills, kept } = billChoices(DETECTED, saved);
    expect(bills.map((b) => [b.name, b.amount])).toEqual([["OAK RENT", "1900.00"], ["VERIZON", "65.00"], ["Gym", "30.00"]]);
    expect(kept).toEqual({ 1: false });
    expect(billChoices(DETECTED, []).kept).toEqual({ 0: false, 1: false });
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
    mockOnb.getFollowUps.mockResolvedValue([]);
    mockAct.reviewGroups.mockResolvedValue({ groups: [], remaining: 0 });
    mockAct.listCategories.mockResolvedValue([]);
  });

  // Step 3 loads its review groups after it appears; wait for that, so no
  // screen update lands after the test ends (React's act() warning).
  const step3Loaded = async () => {
    expect(await screen.findByText("A few I wasn't sure about")).toBeTruthy();
    await waitFor(() => expect(mockAct.listCategories).toHaveBeenCalled());
    await act(async () => undefined);
  };

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
    expect(await screen.findByText("Question 1 of 5")).toBeTruthy();
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
    await step3Loaded();
  });

  it("step 2 resumes at the first unanswered question", async () => {
    mockOnb.getOnboarding.mockResolvedValue(state({ step: "interview", answers: { pay: { frequency: "biweekly" }, side_income: "yes" } }));
    render(<OnboardingScreen />);
    expect(await screen.findByText("Question 3 of 5")).toBeTruthy();
    expect(screen.getByText("These look like regular bills. Keep the ones that are right.")).toBeTruthy();
  });

  it("tapping an earlier answer reopens it; a removed bill shows unticked and can be ticked back", async () => {
    mockOnb.getOnboarding.mockResolvedValue(
      state({
        step: "interview",
        answers: { pay: { frequency: "biweekly" }, side_income: "yes", bills: [{ ...DETECTED[0], detected: true }] },
      })
    );
    render(<OnboardingScreen />);
    expect(await screen.findByText("Question 4 of 5")).toBeTruthy();
    fireEvent.press(screen.getByLabelText("Change your answer: Keep 1 bill"));
    expect(screen.getByText("Question 3 of 5")).toBeTruthy();
    const verizon = screen.getByLabelText(/VERIZON/);
    expect(verizon.props.accessibilityState).toMatchObject({ checked: false });
    fireEvent.press(verizon);
    fireEvent.press(screen.getByText("Next question"));
    await waitFor(() =>
      expect(mockOnb.saveAnswers).toHaveBeenLastCalledWith({ bills: [expect.objectContaining({ name: "OAK RENT" }), expect.objectContaining({ name: "VERIZON" })] })
    );
    expect(await screen.findByText("Question 4 of 5")).toBeTruthy();
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

  it("ON2: follow-ups after question 5, each answer saved, then step 3", async () => {
    const all = { pay: { frequency: "biweekly" }, side_income: "yes", bills: [], goals: [{ kind: "purchase", name: "Bike" }, { kind: "emergency_fund" }], change_appetite: "trim" };
    mockOnb.getOnboarding.mockResolvedValue(state({ step: "interview", answers: all }));
    mockOnb.getFollowUps.mockResolvedValue([
      { slot: "side_income_use", question: "Where should your side income go?", input: "choice", options: [{ value: "goals", label: "Toward goals" }, { value: "both", label: "Both" }] },
      { slot: "goal_priority", question: "Which goal comes first?", input: "order", goals: [{ index: 0, name: "Bike" }, { index: 1, name: "Emergency fund" }] },
    ]);
    render(<OnboardingScreen />);
    fireEvent.press(await screen.findByText("Done")); // question 5 (resumed there, all answered)
    expect(await screen.findByText("Where should your side income go?")).toBeTruthy();
    expect(screen.getByText("A couple more · 1 of 2")).toBeTruthy();
    fireEvent.press(screen.getByText("Both"));
    fireEvent.press(screen.getByText("Next"));
    await waitFor(() => expect(mockOnb.saveAnswers).toHaveBeenLastCalledWith({ follow_ups: { side_income_use: "both" } }));
    expect(await screen.findByText("Which goal comes first?")).toBeTruthy();
    fireEvent.press(screen.getByLabelText("Move Emergency fund up"));
    fireEvent.press(screen.getByText("Done"));
    await waitFor(() => expect(mockOnb.saveAnswers).toHaveBeenCalledWith({ follow_ups: { goal_priority: [1, 0] } }));
    await waitFor(() => expect(mockOnb.saveAnswers).toHaveBeenLastCalledWith({ step: "merchants" }));
    await step3Loaded();
  });

  it("ON2: no follow-ups, or an error asking for them → straight on to step 3, no message", async () => {
    const all = { pay: { frequency: "biweekly" }, side_income: "yes", bills: [], goals: [], change_appetite: "trim" };
    mockOnb.getOnboarding.mockResolvedValue(state({ step: "interview", answers: all }));
    mockOnb.getFollowUps.mockRejectedValueOnce(new Error("offline"));
    render(<OnboardingScreen />);
    fireEvent.press(await screen.findByText("Done"));
    await waitFor(() => expect(mockOnb.saveAnswers).toHaveBeenLastCalledWith({ step: "merchants" }));
    await step3Loaded();
    expect(screen.queryByText(/Couldn't/)).toBeNull();
  });

  it("ON2: resumes at the first unanswered follow-up", async () => {
    const all = { pay: { frequency: "biweekly" }, side_income: "yes", bills: [], goals: [], change_appetite: "trim", follow_ups: { side_income_use: "both" } };
    const asked = [
      { slot: "side_income_use", question: "Where should your side income go?", input: "choice", options: [{ value: "both", label: "Both" }] },
      { slot: "irregular_income_floor", question: "What can you count on each month?", input: "amount", label: "A month I can count on" },
    ];
    mockOnb.getOnboarding.mockResolvedValue(state({ step: "interview", answers: all, follow_ups: asked as never }));
    render(<OnboardingScreen />);
    expect(await screen.findByText("What can you count on each month?")).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText("A month I can count on"), "1800");
    fireEvent.press(screen.getByText("Done"));
    await waitFor(() => expect(mockOnb.saveAnswers).toHaveBeenCalledWith({ follow_ups: { irregular_income_floor: "1800.00" } }));
    await step3Loaded();
  });

  it("ON2: a rejected follow-up answer shows the message and the question stays", async () => {
    const all = { pay: { frequency: "irregular" }, side_income: "no", bills: [], goals: [], change_appetite: "trim" };
    const asked = [{ slot: "irregular_income_floor", question: "What can you count on each month?", input: "amount", label: "A month I can count on" }];
    mockOnb.getOnboarding.mockResolvedValue(state({ step: "interview", answers: all, follow_ups: asked as never }));
    mockOnb.saveAnswers.mockRejectedValueOnce({ response: { data: { errors: { follow_ups: ["irregular_income_floor: must be an amount of 0 or more"] } } } });
    render(<OnboardingScreen />);
    fireEvent.changeText(await screen.findByLabelText("A month I can count on"), "1800");
    fireEvent.press(screen.getByText("Done"));
    expect(await screen.findByText("irregular_income_floor: must be an amount of 0 or more")).toBeTruthy();
    expect(screen.getByText("What can you count on each month?")).toBeTruthy();
    expect(mockOnb.saveAnswers).not.toHaveBeenCalledWith({ step: "merchants" });
  });

  it("follow-up helpers", () => {
    expect(nextFollowUp([{ slot: "a" }, { slot: "b" }], { a: "x" })).toBe(1);
    expect(nextFollowUp([{ slot: "a" }], { a: "x" })).toBe(-1);
    expect(moveInOrder([0, 1, 2], 2, -1)).toEqual([0, 2, 1]);
    expect(moveInOrder([0, 1, 2], 0, -1)).toEqual([0, 1, 2]);
  });

  it("Later leaves onboarding", async () => {
    mockOnb.getOnboarding.mockResolvedValue(state());
    render(<OnboardingScreen />);
    fireEvent.press(await screen.findByText("Later"));
    expect(mockRouter.back).toHaveBeenCalled();
  });
});
