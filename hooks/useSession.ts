import { useEffect } from "react";
import { useRouter } from "expo-router";
import { client } from "@/utils/KindeConfig";
import services from "@/utils/services";
import { logout } from "@/utils/session";
import { useBudgetStore } from "@/store/budget";

/**
 * LG1 (new tab layout): what the legacy Budget tab and its Header did on
 * mount, now done once by the tab layout so it runs whichever tab is shown:
 * send signed-out users to /login, and always ask the server who the caller
 * is (GET /me via fetchUserData, C0) at startup and after every login.
 */
export function useSessionBootstrap() {
  const router = useRouter();
  const fetchUserData = useBudgetStore((s) => s.fetchUserData);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loggedIn = (await services.getData("login")) === "true";
      if (cancelled) return;
      if (!loggedIn) {
        router.replace("/login");
        return;
      }
      await fetchUserData();
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchUserData, router]);
}

/** Logout that always completes locally (utils/session.ts). */
export function useLogout() {
  const router = useRouter();
  const clearUser = useBudgetStore((s) => s.clearUser);
  return () =>
    logout({
      kindeLogout: () => client.logout(),
      clearStore: clearUser,
      clearStorage: async () => {
        await useBudgetStore.persist.clearStorage();
        await services.clearAllData();
      },
      goToLogin: () => router.replace("/login"),
    });
}
