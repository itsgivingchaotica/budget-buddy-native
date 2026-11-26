import React from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";

const mockPush = jest.fn();
jest.mock("expo-router", () => {
  const { useEffect } = require("react");
  return {
    useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
    // Run the focus effect once on mount, as a focused screen would.
    useFocusEffect: (effect: () => void) => useEffect(effect, []),
  };
});
jest.mock("expo-web-browser", () => ({ openBrowserAsync: jest.fn() }));
jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);
jest.mock("@/utils/activityApi", () => ({
  listAccounts: jest.fn(async () => []),
  listCategories: jest.fn(async () => []),
  countTransactions: jest.fn(async () => 0),
  listTransactions: jest.fn(async () => ({ transactions: [], page: 1, per_page: 50, total: 0 })),
  templateUrl: () => "http://example.test/csv-templates/generic.csv",
}));

import ActivityScreen from "@/app/(tabs)/activity/index";
import { colors } from "@/constants/Theme";

describe("Activity empty state (C2)", () => {
  beforeEach(() => mockPush.mockClear());

  it("shows 'Add your first account' as a visible Pine button, plus the header's Import and Accounts", async () => {
    render(<ActivityScreen />);
    const add = await screen.findByRole("button", { name: "Add your first account" });
    // Guard for the phone bug: the button must keep its Pine background.
    expect(StyleSheet.flatten(add.props.style).backgroundColor).toBe(colors.pine);
    expect(screen.getByRole("button", { name: "Import" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Accounts" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Download the CSV template" })).toBeTruthy();

    fireEvent.press(add);
    expect(mockPush).toHaveBeenCalledWith("/activity/new-account");
  });

  it("Import with no accounts opens Add account first", async () => {
    render(<ActivityScreen />);
    fireEvent.press(await screen.findByRole("button", { name: "Import" }));
    expect(mockPush).toHaveBeenCalledWith("/activity/new-account");
  });
});
