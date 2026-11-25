import { logout, LogoutDeps } from "@/utils/session";

function deps(kindeLogout: LogoutDeps["kindeLogout"]) {
  const calls: string[] = [];
  const messages: string[] = [];
  return {
    calls,
    messages,
    deps: {
      kindeLogout,
      clearStore: jest.fn(() => {
        calls.push("clearStore");
      }),
      clearStorage: jest.fn(async () => {
        calls.push("clearStorage");
      }),
      goToLogin: jest.fn(() => {
        calls.push("goToLogin");
      }),
      log: (message: string) => {
        messages.push(message);
      },
    } satisfies LogoutDeps,
  };
}

describe("logout", () => {
  it("clears everything and goes to login when Kinde logout succeeds", async () => {
    const t = deps(async () => true);
    await expect(logout(t.deps)).resolves.toEqual({ kindeLoggedOut: true });
    expect(t.calls).toEqual(["clearStore", "clearStorage", "goToLogin"]);
    expect(t.messages).toEqual([]);
  });

  it("still clears everything and goes to login when Kinde returns false", async () => {
    const t = deps(async () => false);
    await expect(logout(t.deps)).resolves.toEqual({ kindeLoggedOut: false });
    expect(t.calls).toEqual(["clearStore", "clearStorage", "goToLogin"]);
    expect(t.messages).toHaveLength(1);
  });

  it("still clears everything when Kinde throws, and never logs the error text", async () => {
    const secret = "eyJhbGciOiJSUzI1NiJ9.secret-token-value";
    const t = deps(async () => {
      throw new Error(`network failure for token ${secret}`);
    });

    await expect(logout(t.deps)).resolves.toEqual({ kindeLoggedOut: false });
    expect(t.calls).toEqual(["clearStore", "clearStorage", "goToLogin"]);
    expect(t.messages.join("\n")).toContain("Kinde logout failed (Error)");
    expect(t.messages.join("\n")).not.toContain(secret);
    expect(t.messages.join("\n")).not.toContain("network failure");
  });

  it("goes to login even if clearing storage fails", async () => {
    const t = deps(async () => true);
    t.deps.clearStorage.mockImplementationOnce(async () => {
      throw new Error("disk full");
    });

    await logout(t.deps);
    expect(t.deps.goToLogin).toHaveBeenCalledTimes(1);
    expect(t.messages.join("\n")).toContain("could not clear storage");
  });
});
