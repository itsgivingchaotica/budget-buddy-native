import React from "react";
import { PlaceholderScreen } from "@/components/brand/PlaceholderScreen";
import { Button } from "@/components/brand/ui";
import { useLogout } from "@/hooks/useSession";
import { useBudgetStore } from "@/store/budget";

/** LG1: Home tab. "Left to spend this week" arrives with W1 and C3. */
export default function HomeScreen() {
  const firstName = useBudgetStore((s) => s.user?.given_name);
  const logout = useLogout();

  return (
    <PlaceholderScreen
      title={firstName ? `Hi, ${firstName}` : "Home"}
      subtitle="Today and this week: how much is left to spend, and which bills are due."
      comingIn="Coming with the weekly outlook (W1, C3)."
    >
      <Button label="Log out" variant="secondary" onPress={logout} />
    </PlaceholderScreen>
  );
}
