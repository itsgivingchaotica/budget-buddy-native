import AsyncStorage from "@react-native-async-storage/async-storage";

// The store imports the API client, which imports the Kinde client and the
// router; neither is needed for persistence tests.
jest.mock("@/utils/KindeConfig", () => ({
  client: { getToken: jest.fn(), forceTokenRefresh: jest.fn(), logout: jest.fn() },
}));
jest.mock("expo-router", () => ({ router: { replace: jest.fn() } }));

import {
  BUDGET_STORE_VERSION,
  initialBudgetData,
  migrateBudgetStore,
  useBudgetStore,
} from "@/store/budget";

const STALE = {
  user: { id: 1, email: "old@example.com", given_name: "Old", family_name: "User", picture: "" },
  budgets: [{ id: 7, name: "Old budget" }],
  currentBudget: { id: 7, name: "Old budget" },
  tags: [{ id: 6, name: "Groceries", category_id: 6 }],
};

describe("budget store persistence", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useBudgetStore.setState(initialBudgetData());
  });

  it("is at version 1", () => {
    expect(BUDGET_STORE_VERSION).toBe(1);
    expect(useBudgetStore.persist.getOptions().version).toBe(1);
  });

  it("migrate discards state saved by an older version", () => {
    expect(migrateBudgetStore(STALE, 0)).toEqual(initialBudgetData());
  });

  it("migrate keeps state saved by the current version", () => {
    expect(migrateBudgetStore(STALE, 1)).toBe(STALE);
  });

  it("rehydrating stale storage from an old build clears it on launch", async () => {
    await AsyncStorage.setItem("budget-storage", JSON.stringify({ state: STALE, version: 0 }));

    await useBudgetStore.persist.rehydrate();

    const state = useBudgetStore.getState();
    expect(state.user).toBeNull();
    expect(state.budgets).toEqual([]);
    expect(state.tags).toEqual([]);
    const saved = JSON.parse((await AsyncStorage.getItem("budget-storage")) as string);
    expect(saved.version).toBe(1);
    expect(saved.state.user).toBeNull();
  });

  it("clearUser resets the store to its initial data", () => {
    useBudgetStore.setState({ user: STALE.user, budgets: STALE.budgets as never });
    useBudgetStore.getState().clearUser();
    expect(useBudgetStore.getState().user).toBeNull();
    expect(useBudgetStore.getState().budgets).toEqual([]);
  });
});
