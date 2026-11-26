// C9 (welcome and account screens): sign-in helpers for the Welcome screen,
// kept as plain functions so they can be tested.

export type PostLoginRoute = "/activity" | "/";

/**
 * Where to go after signing in (SCREENS_WELCOME.md §4.1, D-019): with no
 * accounts yet, first run starts on Activity ("Add your first account");
 * otherwise Home.
 */
export function postLoginRoute(accountCount: number): PostLoginRoute {
  return accountCount === 0 ? "/activity" : "/";
}

/**
 * Kinde SDK 1.3.1 returns null both when the user cancels and when sign-in
 * fails, so a failure to reach Kinde is checked first: a quick request to
 * the Kinde domain's public OpenID configuration. Offline (e.g. airplane
 * mode) this fails, and the Welcome screen shows its inline message instead
 * of opening a browser that can't load.
 */
export async function kindeReachable(
  domain: string | undefined = process.env.EXPO_PUBLIC_KINDE_APP_DOMAIN,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = 5000
): Promise<boolean> {
  if (!domain) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(`${domain.replace(/\/$/, "")}/.well-known/openid-configuration`, {
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export type SignInOutcome = "signed_in" | "cancelled" | "unreachable";

/**
 * The Welcome screen's sign-in / sign-up flow, with its dependencies passed
 * in. Never logs token values.
 */
export async function signInFlow(deps: {
  reachable: () => Promise<boolean>;
  openKinde: () => Promise<unknown>; // client.login() or client.register()
  markLoggedIn: () => Promise<void>;
  loadUser: () => Promise<void>; // GET /me
  countAccounts: () => Promise<number>;
  goTo: (route: PostLoginRoute) => void;
}): Promise<SignInOutcome> {
  if (!(await deps.reachable())) return "unreachable";
  const token = await deps.openKinde();
  if (!token) return "cancelled";

  await deps.markLoggedIn();
  let accounts = 1; // if /me or /accounts fails, go Home (the tabs retry /me)
  try {
    await deps.loadUser();
    accounts = await deps.countAccounts();
  } catch {
    // keep the default
  }
  deps.goTo(postLoginRoute(accounts));
  return "signed_in";
}
