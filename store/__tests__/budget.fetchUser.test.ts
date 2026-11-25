jest.mock("@/utils/KindeConfig", () => ({
  client: { getToken: jest.fn(), forceTokenRefresh: jest.fn(), logout: jest.fn() },
}));
jest.mock("expo-router", () => ({ router: { replace: jest.fn() } }));
jest.mock("@/utils/api", () => ({
  api: { get: jest.fn() },
  deviceTimeZone: () => "Europe/London",
}));

import { api } from "@/utils/api";
import { initialBudgetData, useBudgetStore } from "@/store/budget";

const get = api.get as jest.Mock;

const SAVED_USER = { id: 1, email: "saved@example.com", given_name: "Saved", family_name: "User", picture: "" };
const SAVED_TAG = { id: 6, name: "Groceries", category_id: 7 };

function stubServer() {
  get.mockImplementation(async (path: string) => {
    if (path === "/me") {
      return { data: { id: 42, email: "fresh@example.com", first_name: "Fresh", last_name: "User", picture: "" } };
    }
    if (path === "/budgets") return { data: [] };
    if (path === "/tags/default_tags") return { data: [] };
    return { data: [] };
  });
}

describe("fetchUserData", () => {
  beforeEach(() => {
    get.mockReset();
    stubServer();
    useBudgetStore.setState(initialBudgetData());
  });

  it("calls /me when nothing is saved", async () => {
    await useBudgetStore.getState().fetchUserData();
    expect(get).toHaveBeenCalledWith("/me", { params: { time_zone: "Europe/London" } });
    expect(useBudgetStore.getState().user?.id).toBe(42);
  });

  it("still calls /me when a user and tags are saved, and replaces the saved user", async () => {
    useBudgetStore.setState({
      user: SAVED_USER,
      tags: [SAVED_TAG] as never,
      incomeTags: [SAVED_TAG] as never,
    });

    await useBudgetStore.getState().fetchUserData();

    expect(get).toHaveBeenCalledWith("/me", expect.anything());
    expect(useBudgetStore.getState().user?.id).toBe(42);
    expect(useBudgetStore.getState().user?.email).toBe("fresh@example.com");
  });
});
