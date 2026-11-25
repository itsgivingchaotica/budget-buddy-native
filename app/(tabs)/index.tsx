import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { PlaceholderScreen } from "@/components/brand/PlaceholderScreen";
import { colors, fonts, minTouch, radius } from "@/constants/Theme";
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
      <Pressable
        onPress={logout}
        accessibilityRole="button"
        style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
      >
        <Text style={styles.secondaryText}>Log out</Text>
      </Pressable>
    </PlaceholderScreen>
  );
}

const styles = StyleSheet.create({
  secondary: {
    minHeight: minTouch,
    borderRadius: radius.button,
    borderWidth: 2,
    borderColor: colors.pine,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  pressed: { opacity: 0.7 },
  secondaryText: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.pine },
});
