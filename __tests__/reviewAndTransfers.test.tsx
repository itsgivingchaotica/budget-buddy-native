import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { rowChip } from "@/components/activity/rowChip";
import { ReviewGroupCard } from "@/components/activity/ReviewGroupCard";
import { OUTCOME_TEXT, TransferPairCard } from "@/components/activity/TransferPairCard";
import type { ReviewGroup, TransferPair } from "@/utils/activityApi";

const mockApi = {
  reviewGroups: jest.fn(),
  listCategories: jest.fn(),
  pickCategory: jest.fn(),
  undoCorrection: jest.fn(),
};
jest.mock("@/utils/activityApi", () => ({
  reviewGroups: (...a: unknown[]) => mockApi.reviewGroups(...a),
  listCategories: (...a: unknown[]) => mockApi.listCategories(...a),
  pickCategory: (...a: unknown[]) => mockApi.pickCategory(...a),
  undoCorrection: (...a: unknown[]) => mockApi.undoCorrection(...a),
}));
jest.mock("expo-router", () => ({ useRouter: () => ({ back: jest.fn(), push: jest.fn() }) }));
jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);
jest.mock("@/components/brand/Mascot", () => ({ Mascot: () => null }));

import ReviewScreen from "@/app/(tabs)/activity/review";

const dining = { id: 7, slug: "dining-out", name: "Dining Out" };
const groceries = { id: 3, slug: "groceries", name: "Groceries" };
const other = { id: 9, slug: "other", name: "Other" };

const group = (overrides: Partial<ReviewGroup> = {}): ReviewGroup => ({
  merchant_key: "HARBOR BEAN",
  display_name: "SQ *HARBOR BEAN",
  count: 3,
  total: "-16.00",
  accounts: [{ id: 1, name: "Everyday Checking", purpose: "spending" }],
  representative_transaction_id: 42,
  suggested_category: dining,
  alternatives: [groceries, other],
  ...overrides,
});

const chipLabels = () => screen.getAllByRole("button").map((b) => b.props.accessibilityLabel);

describe("Activity row chips (C2b)", () => {
  const t = (o: Partial<{ transfer_suggested: boolean; needs_review: boolean }>) => ({ transfer_suggested: false, needs_review: false, ...o });

  it("shows Transfer?, <Suggestion>?, Needs review, or the category", () => {
    expect(rowChip(t({ transfer_suggested: true, needs_review: true }), null, "Income")).toEqual({ label: "Transfer?", tone: "review" });
    expect(rowChip(t({ needs_review: true }), null, "Income")).toEqual({ label: "Income?", tone: "review" });
    expect(rowChip(t({ needs_review: true }), null, null)).toEqual({ label: "Needs review", tone: "review" });
    expect(rowChip(t({}), "Groceries", null)).toEqual({ label: "Groceries", tone: "positive" });
  });
});

describe("Review group card (C2b)", () => {
  it("puts the suggestion first with a ?, then the alternatives, then More…", () => {
    render(<ReviewGroupCard group={group()} onPick={jest.fn()} onMore={jest.fn()} onUndo={jest.fn()} />);
    expect(chipLabels()).toEqual(["Dining Out?", "Groceries", "Other", "More…"]);
    expect(screen.getByText("3 transactions · Everyday Checking")).toBeTruthy();
  });

  it("without a suggestion shows only the alternatives and More…", () => {
    render(<ReviewGroupCard group={group({ suggested_category: null })} onPick={jest.fn()} onMore={jest.fn()} onUndo={jest.fn()} />);
    expect(chipLabels()).toEqual(["Groceries", "Other", "More…"]);
  });

  it("shows the account purpose when it isn't everyday spending", () => {
    render(
      <ReviewGroupCard
        group={group({ accounts: [{ id: 2, name: "Venmo", purpose: "side_income" }] })}
        onPick={jest.fn()}
        onMore={jest.fn()}
        onUndo={jest.fn()}
      />
    );
    expect(screen.getByText("3 transactions · Venmo · side-job income")).toBeTruthy();
  });

  it("after a pick shows the result and an Undo link", () => {
    const onUndo = jest.fn();
    render(
      <ReviewGroupCard group={group()} picked={{ name: "Groceries", alsoUpdated: 2, correctionId: 5 }} onPick={jest.fn()} onMore={jest.fn()} onUndo={onUndo} />
    );
    expect(screen.getByText("Groceries · also updated 2 others")).toBeTruthy();
    fireEvent.press(screen.getByRole("link", { name: "Undo" }));
    expect(onUndo).toHaveBeenCalled();
  });
});

describe("Review screen (C2b)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.listCategories.mockResolvedValue([dining, groceries, other, { id: 99, slug: "transfers", name: "Transfers", kind: "transfer" }].map((c) => ({ kind: "spending", ...c })));
  });

  it("picking a chip collapses the card and lowers the count; Undo restores both", async () => {
    mockApi.reviewGroups.mockResolvedValue({ remaining: 4, groups: [group(), group({ merchant_key: "ZQX", display_name: "ZQX", count: 1, representative_transaction_id: 50 })] });
    mockApi.pickCategory.mockResolvedValue({ also_updated: 2, correction_id: 77 });
    mockApi.undoCorrection.mockResolvedValue({ restored_transaction_ids: [42, 43, 44], remaining: 4 });
    render(<ReviewScreen />);

    expect(await screen.findByText("To review · 4")).toBeTruthy();
    fireEvent.press(screen.getAllByRole("button", { name: "Dining Out?" })[0]);
    expect(await screen.findByText("Dining Out · also updated 2 others")).toBeTruthy();
    expect(mockApi.pickCategory).toHaveBeenCalledWith(42, "dining-out");
    expect(screen.getByText("To review · 1")).toBeTruthy();

    fireEvent.press(screen.getByRole("link", { name: "Undo" }));
    await waitFor(() => expect(screen.getByText("To review · 4")).toBeTruthy());
    expect(mockApi.undoCorrection).toHaveBeenCalledWith(77);
    expect(screen.queryByText("Dining Out · also updated 2 others")).toBeNull();
    expect(screen.getAllByRole("button", { name: "Dining Out?" }).length).toBe(2);
  });

  it("reaching 0 shows All caught up, and the card stays so Undo is reachable", async () => {
    mockApi.reviewGroups.mockResolvedValue({ remaining: 3, groups: [group()] });
    mockApi.pickCategory.mockResolvedValue({ also_updated: 2, correction_id: 8 });
    render(<ReviewScreen />);
    fireEvent.press(await screen.findByRole("button", { name: "Groceries" }));
    expect(await screen.findByText("All caught up")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Undo" })).toBeTruthy();
  });

  it("More… offers every category except Transfers", async () => {
    mockApi.reviewGroups.mockResolvedValue({ remaining: 3, groups: [group()] });
    render(<ReviewScreen />);
    fireEvent.press(await screen.findByRole("button", { name: "More…" }));
    expect(screen.queryByRole("button", { name: "Transfers" })).toBeNull();
    expect(screen.getAllByRole("button", { name: "Other" }).length).toBeGreaterThan(1);
  });
});

describe("Transfer pair card (C2b)", () => {
  const pair: TransferPair = {
    id: 3, status: "suggested", days_apart: 0, amount: "200.00",
    outflow: { id: 1, account_id: 1, account_name: "Checking", posted_on: "2026-11-20", description: "TRANSFER TO SAVINGS", amount: "-200.00" },
    inflow: { id: 2, account_id: 2, account_name: "Savings", posted_on: "2026-11-20", description: "TRANSFER FROM CHECKING", amount: "200.00" },
  };

  it("shows the amount, gap, both sides and the two actions", () => {
    const onConfirm = jest.fn();
    const onReject = jest.fn();
    render(<TransferPairCard pair={pair} onConfirm={onConfirm} onReject={onReject} onUndo={jest.fn()} />);
    expect(screen.getByText("$200.00")).toBeTruthy();
    expect(screen.getByText("Same day")).toBeTruthy();
    fireEvent.press(screen.getByRole("button", { name: "Confirm" }));
    fireEvent.press(screen.getByRole("button", { name: "Not a transfer" }));
    expect([onConfirm.mock.calls.length, onReject.mock.calls.length]).toEqual([1, 1]);
  });

  it("after confirm or reject shows the outcome with Undo", () => {
    const onUndo = jest.fn();
    const { rerender } = render(<TransferPairCard pair={pair} outcome="confirmed" onConfirm={jest.fn()} onReject={jest.fn()} onUndo={onUndo} />);
    expect(screen.getByText(OUTCOME_TEXT.confirmed)).toBeTruthy();
    expect(screen.getByText("Confirmed · left out of spending and income")).toBeTruthy();
    rerender(<TransferPairCard pair={pair} outcome="rejected" onConfirm={jest.fn()} onReject={jest.fn()} onUndo={onUndo} />);
    expect(screen.getByText("Got it · won't suggest this pair again")).toBeTruthy();
    fireEvent.press(screen.getByRole("link", { name: "Undo" }));
    expect(onUndo).toHaveBeenCalled();
  });
});
