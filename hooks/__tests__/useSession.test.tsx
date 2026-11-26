import { renderHook, waitFor } from "@testing-library/react-native";

// Jest only lets mock factories use variables whose names start with "mock".
const mockReplace = jest.fn();
const mockGetData = jest.fn();
const mockFetchUserData = jest.fn(async () => {});

jest.mock("expo-router", () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock("@/utils/KindeConfig", () => ({ client: { logout: jest.fn(async () => true) } }));
jest.mock("@/utils/services", () => ({
  __esModule: true,
  default: { getData: (key: string) => mockGetData(key), clearAllData: jest.fn() },
}));
jest.mock("@/store/budget", () => {
  const state = { fetchUserData: () => mockFetchUserData(), clearUser: jest.fn() };
  const useBudgetStore = Object.assign((selector: (s: typeof state) => unknown) => selector(state), {
    persist: { clearStorage: jest.fn() },
  });
  return { useBudgetStore };
});

import { useSessionBootstrap } from "@/hooks/useSession";

describe("useSessionBootstrap (LG1)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("sends a signed-out user to /login and doesn't call /me", async () => {
    mockGetData.mockResolvedValue(null);
    renderHook(() => useSessionBootstrap());
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/login"));
    expect(mockFetchUserData).not.toHaveBeenCalled();
  });

  it("always refreshes /me for a signed-in user", async () => {
    mockGetData.mockResolvedValue("true");
    renderHook(() => useSessionBootstrap());
    await waitFor(() => expect(mockFetchUserData).toHaveBeenCalledTimes(1));
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
