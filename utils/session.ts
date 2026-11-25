// Logout that always completes locally.
//
// The Kinde SDK clears its stored tokens first, then opens Kinde's logout page
// and returns true only if Kinde redirects back to the app. That redirect can
// fail (logout URL not allowed in Kinde, browser closed, offline) even though
// the phone is already signed out. So whatever Kinde returns or throws, we
// still clear the app's persisted store and AsyncStorage and go to /login.
//
// Failures are logged without any token or error text that could contain one:
// only a fixed message and the error's class name.

export type LogoutDeps = {
  kindeLogout: () => Promise<boolean>;
  clearStore: () => void;
  clearStorage: () => Promise<void>;
  goToLogin: () => void;
  log?: (message: string) => void;
};

export type LogoutResult = { kindeLoggedOut: boolean };

function errorName(error: unknown): string {
  return error instanceof Error ? error.name : typeof error;
}

export async function logout({
  kindeLogout,
  clearStore,
  clearStorage,
  goToLogin,
  log = (message) => console.warn(message),
}: LogoutDeps): Promise<LogoutResult> {
  let kindeLoggedOut = false;

  try {
    kindeLoggedOut = (await kindeLogout()) === true;
    if (!kindeLoggedOut) {
      log("[logout] Kinde logout did not return to the app; clearing the local session anyway");
    }
  } catch (error) {
    log(`[logout] Kinde logout failed (${errorName(error)}); clearing the local session anyway`);
  }

  try {
    clearStore();
  } catch (error) {
    log(`[logout] could not reset the store (${errorName(error)})`);
  }

  try {
    await clearStorage();
  } catch (error) {
    log(`[logout] could not clear storage (${errorName(error)})`);
  }

  goToLogin();
  return { kindeLoggedOut };
}
