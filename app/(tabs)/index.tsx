import React, { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { AccountSheet } from "@/components/account/AccountSheet";
import { PlaceholderScreen } from "@/components/brand/PlaceholderScreen";
import { PressableBox } from "@/components/brand/ui";
import { colors, fonts } from "@/constants/Theme";
import { useLogout } from "@/hooks/useSession";
import { useBudgetStore } from "@/store/budget";
import { initial } from "@/utils/account";

/**
 * LG1: Home tab. "Left to spend this week" arrives with W1 and C3.
 * C9: the account button (top right) opens the account sheet with Log out.
 */
export default function HomeScreen() {
  const firstName = useBudgetStore((s) => s.user?.given_name);
  const email = useBudgetStore((s) => s.user?.email);
  const logout = useLogout();
  const [accountOpen, setAccountOpen] = useState(false);

  return (
    <PlaceholderScreen
      title={firstName ? `Hi, ${firstName}` : "Home"}
      subtitle="Today and this week: how much is left to spend, and which bills are due."
      comingIn="Coming with the weekly outlook (W1, C3)."
      right={
        <>
          <PressableBox onPress={() => setAccountOpen(true)} accessibilityRole="button" accessibilityLabel="Account" style={styles.avatar}>
            <Text style={styles.avatarText}>{initial(firstName, email)}</Text>
          </PressableBox>
          <AccountSheet
            visible={accountOpen}
            firstName={firstName}
            email={email}
            onClose={() => setAccountOpen(false)}
            onLogout={() => {
              setAccountOpen(false);
              logout();
            }}
          />
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.pine, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.white },
});
