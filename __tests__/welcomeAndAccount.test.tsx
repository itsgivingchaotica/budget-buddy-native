import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { kindeReachable, postLoginRoute, signInFlow } from "@/utils/welcome";
import { accountRows, initial, timeZoneCity, weekStartLabel } from "@/utils/account";

const mockReplace = jest.fn();
const mockLogin = jest.fn();
const mockRegister = jest.fn();
const mockFetchMe = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn(), back: jest.fn() }),
  useFocusEffect: jest.fn(), // Home's outlook load (C3) isn't under test here
}));
jest.mock("@/utils/homeApi", () => ({ weekOutlook: jest.fn(() => new Promise(() => {})) }));
jest.mock("@/utils/KindeConfig", () => ({ client: { login: () => mockLogin(), register: () => mockRegister(), logout: jest.fn() } }));
jest.mock("@/utils/services", () => ({ __esModule: true, default: { storeData: jest.fn(async () => {}), getData: jest.fn(), clearAllData: jest.fn() } }));
jest.mock("@/utils/activityApi", () => ({ listAccounts: jest.fn(async () => []) }));
jest.mock("@/utils/api", () => ({ api: {}, deviceTimeZone: () => "Europe/London" }));
jest.mock("@/utils/account", () => ({ ...jest.requireActual("@/utils/account"), fetchMe: () => mockFetchMe() }));
jest.mock("@/store/budget", () => {
  const state = { fetchUserData: jest.fn(async () => {}), clearUser: jest.fn(), user: { given_name: "Sam", email: "sam@example.com" } };
  const useBudgetStore = Object.assign((selector: (s: typeof state) => unknown) => selector(state), { persist: { clearStorage: jest.fn() } });
  return { useBudgetStore };
});
jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);
jest.mock("react-native-svg", () => ({ SvgXml: () => null }));
jest.mock("expo-constants", () => ({ __esModule: true, default: { expoConfig: { version: "1.0.0" } } }));

import WelcomeScreen from "@/app/login/index";
import HomeScreen from "@/app/(tabs)/index";
import { AccountSheet } from "@/components/account/AccountSheet";

beforeEach(() => jest.clearAllMocks());

describe("post-login routing (C9)", () => {
  it("0 accounts → Activity; 1 or more → Home", () => {
    expect(postLoginRoute(0)).toBe("/activity");
    expect(postLoginRoute(1)).toBe("/");
    expect(postLoginRoute(3)).toBe("/");
  });

  const deps = (over: Partial<Parameters<typeof signInFlow>[0]> = {}) => ({
    reachable: jest.fn(async () => true),
    openKinde: jest.fn(async () => ({ access_token: "never-logged" })),
    markLoggedIn: jest.fn(async () => {}),
    loadUser: jest.fn(async () => {}),
    countAccounts: jest.fn(async () => 0),
    goTo: jest.fn(),
    ...over,
  });

  it("signs in, calls /me, then routes by account count", async () => {
    const d = deps({ countAccounts: jest.fn(async () => 2) });
    await expect(signInFlow(d)).resolves.toBe("signed_in");
    expect(d.loadUser).toHaveBeenCalled();
    expect(d.goTo).toHaveBeenCalledWith("/");
  });

  it("unreachable Kinde: doesn't open sign-in", async () => {
    const d = deps({ reachable: jest.fn(async () => false) });
    await expect(signInFlow(d)).resolves.toBe("unreachable");
    expect(d.openKinde).not.toHaveBeenCalled();
  });

  it("a cancel leaves the user signed out, with no navigation", async () => {
    const d = deps({ openKinde: jest.fn(async () => null) });
    await expect(signInFlow(d)).resolves.toBe("cancelled");
    expect(d.markLoggedIn).not.toHaveBeenCalled();
    expect(d.goTo).not.toHaveBeenCalled();
  });

  it("if /me or /accounts fails after sign-in, goes Home", async () => {
    const d = deps({ loadUser: jest.fn(async () => { throw new Error("503"); }) });
    await signInFlow(d);
    expect(d.goTo).toHaveBeenCalledWith("/");
  });

  it("kindeReachable: OK response, network error, missing domain", async () => {
    await expect(kindeReachable("https://x.kinde.com", jest.fn(async () => ({ ok: true })) as never)).resolves.toBe(true);
    await expect(kindeReachable("https://x.kinde.com", jest.fn(async () => { throw new TypeError("offline"); }) as never)).resolves.toBe(false);
    await expect(kindeReachable(undefined)).resolves.toBe(false);
  });
});

describe("Welcome screen (C9)", () => {
  it("renders the name, both buttons and both legal links", () => {
    render(<WelcomeScreen />);
    expect(screen.getByRole("header", { name: "Budget Buddy" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Create an account" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Terms" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toBeTruthy();
  });

  it("shows the inline message when Kinde can't be reached, and buttons work again", async () => {
    global.fetch = jest.fn(async () => { throw new TypeError("offline"); }) as never;
    process.env.EXPO_PUBLIC_KINDE_APP_DOMAIN = "https://x.kinde.com";
    render(<WelcomeScreen />);
    fireEvent.press(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Couldn't open sign-in. Check your connection and try again.")).toBeTruthy();
    expect(mockLogin).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole("button", { name: "Sign in" }).props.accessibilityState.disabled).toBe(false));
  });

  it("Create an account opens Kinde sign-up; with no accounts it lands on Activity", async () => {
    global.fetch = jest.fn(async () => ({ ok: true })) as never;
    mockRegister.mockResolvedValue({ access_token: "t" });
    render(<WelcomeScreen />);
    fireEvent.press(screen.getByRole("button", { name: "Create an account" }));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/activity"));
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("Terms opens the in-app note", () => {
    render(<WelcomeScreen />);
    fireEvent.press(screen.getByRole("link", { name: "Terms" }));
    expect(screen.getByText("Budget Buddy is a portfolio project, not financial advice.")).toBeTruthy();
  });
});

describe("Account sheet (C9)", () => {
  it("formats week start, time zone and the initial", () => {
    expect(weekStartLabel(1)).toBe("Monday");
    expect(weekStartLabel(0)).toBe("Sunday");
    expect(weekStartLabel(null)).toBe("Monday");
    expect(timeZoneCity("America/New_York")).toBe("New York");
    expect(timeZoneCity("Europe/London")).toBe("London");
    expect(initial("siobhan", null)).toBe("S");
    expect(initial("", "zoe@example.com")).toBe("Z");
    expect(initial(null, null)).toBe("?");
  });

  it("without a profile, shows the defaults (Monday, device time zone)", () => {
    expect(accountRows(null, "Europe/London")).toEqual({ weekStartsOn: "Monday", timeZone: "London" });
  });

  it("shows the user, the profile and Log out", async () => {
    mockFetchMe.mockResolvedValue({ id: 1, email: "sam@example.com", first_name: "Sam", last_name: "Lee",
                                    profile: { week_starts_on: 0, time_zone: "America/New_York" } });
    const onLogout = jest.fn();
    render(<AccountSheet visible firstName="Sam" email="sam@example.com" onClose={jest.fn()} onLogout={onLogout} />);
    expect(await screen.findByText("Sunday")).toBeTruthy();
    expect(screen.getByText("New York")).toBeTruthy();
    expect(screen.getByText("Budget Buddy 1.0.0 · sign-in by Kinde")).toBeTruthy();
    fireEvent.press(screen.getByRole("button", { name: "Log out" }));
    expect(onLogout).toHaveBeenCalled();
  });

  it("Home has the account button and no Log out button of its own", () => {
    mockFetchMe.mockReturnValue(new Promise(() => {}));
    render(<HomeScreen />);
    expect(screen.getByRole("button", { name: "Account" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Log out" })).toBeNull();
    fireEvent.press(screen.getByRole("button", { name: "Account" }));
    expect(screen.getByRole("button", { name: "Log out" })).toBeTruthy();
  });
});
