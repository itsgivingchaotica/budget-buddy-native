import React, { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SvgXml } from "react-native-svg";
import { useRouter } from "expo-router";
import { PressableBox } from "@/components/brand/ui";
import { WELCOME_HERO_SVG } from "@/components/brand/welcomeHeroSvg";
import { LegalNote, type LegalKind } from "@/components/welcome/LegalNote";
import { colors, fonts } from "@/constants/Theme";
import { useBudgetStore } from "@/store/budget";
import { listAccounts } from "@/utils/activityApi";
import { client } from "@/utils/KindeConfig";
import services from "@/utils/services";
import { kindeReachable, signInFlow } from "@/utils/welcome";

const HERO_RATIO = 420 / 390; // welcome-hero.svg
const OPEN_ERROR = "Couldn't open sign-in. Check your connection and try again.";

/**
 * C9: the signed-out Welcome screen (docs/product/SCREENS_WELCOME.md §4,
 * screens/Welcome-A.png, D-023). Replaces the old login screen.
 */
export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const fetchUserData = useBudgetStore((s) => s.fetchUserData);
  const [busy, setBusy] = useState<"signIn" | "signUp" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [legal, setLegal] = useState<LegalKind | null>(null);

  // Full width, aspect ratio kept; on short screens the hero shrinks first
  // (at most half the screen), cropped from the top so its curve stays.
  const heroHeight = Math.min(width * HERO_RATIO, height * 0.5);

  const start = async (mode: "signIn" | "signUp") => {
    if (busy) return;
    setBusy(mode);
    setError(null);
    try {
      const outcome = await signInFlow({
        reachable: () => kindeReachable(),
        openKinde: () => (mode === "signIn" ? client.login() : client.register()),
        markLoggedIn: () => services.storeData("login", "true"),
        loadUser: () => fetchUserData(),
        countAccounts: async () => (await listAccounts()).length,
        goTo: (route) => router.replace(route),
      });
      if (outcome === "unreachable") setError(OPEN_ERROR);
      // "cancelled": back on Welcome, no message (spec §4.1).
    } catch {
      setError(OPEN_ERROR);
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: 40 + insets.bottom }]} bounces={false}>
        <SvgXml
          xml={WELCOME_HERO_SVG}
          width={width}
          height={heroHeight}
          preserveAspectRatio="xMidYMax slice"
          accessible
          accessibilityRole="image"
          accessibilityLabel="Illustration: the Budget Buddy squirrel standing on a tree stump next to a jar of saved acorns."
        />
        <View style={styles.body}>
          <Text accessibilityRole="header" accessibilityLabel="Budget Buddy" style={styles.name}>
            <Text style={{ color: colors.bark }}>Budget{"\n"}</Text>
            <Text style={{ color: colors.acorn }}>Buddy</Text>
          </Text>
          <Text style={styles.tagline}>
            Turn the bank exports you already have into a plan you can keep, one week at a time.
          </Text>

          <View style={styles.spacer} />

          {error ? (
            <Text style={styles.error} accessibilityRole="alert">
              {error}
            </Text>
          ) : null}
          <WelcomeButton label="Sign in" filled busy={busy === "signIn"} disabled={!!busy} onPress={() => start("signIn")} />
          <WelcomeButton label="Create an account" busy={busy === "signUp"} disabled={!!busy} onPress={() => start("signUp")} />

          <Text style={styles.legal}>
            By continuing you agree to our{" "}
            <Text style={styles.link} accessibilityRole="link" onPress={() => setLegal("terms")}>
              Terms
            </Text>{" "}
            and{" "}
            <Text style={styles.link} accessibilityRole="link" onPress={() => setLegal("privacy")}>
              Privacy Policy
            </Text>
            .
          </Text>
        </View>
      </ScrollView>
      <LegalNote kind={legal} onClose={() => setLegal(null)} />
    </View>
  );
}

function WelcomeButton({
  label,
  filled,
  busy,
  disabled,
  onPress,
}: {
  label: string;
  filled?: boolean;
  busy?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const textColor = filled ? colors.white : colors.pine;
  return (
    <PressableBox
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled, busy: !!busy }}
      style={[styles.button, filled ? styles.filled : styles.outlined, disabled && !busy && styles.dim]}
    >
      {busy ? <ActivityIndicator color={textColor} /> : <Text style={[styles.buttonText, { color: textColor }]}>{label}</Text>}
    </PressableBox>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.birch },
  scroll: { flexGrow: 1 },
  body: { flex: 1, paddingHorizontal: 28, paddingTop: 12, gap: 12 },
  name: { fontFamily: fonts.display, fontSize: 46, lineHeight: 44, letterSpacing: -1, paddingTop: 4 },
  tagline: { fontFamily: fonts.body, fontSize: 17, lineHeight: 24, color: colors.barkSecondary },
  spacer: { flexGrow: 1, minHeight: 16 },
  error: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.emberDark },
  button: { height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  filled: { backgroundColor: colors.pine },
  outlined: { backgroundColor: colors.birch, borderWidth: 2, borderColor: colors.pine },
  dim: { opacity: 0.6 },
  buttonText: { fontFamily: fonts.bodySemiBold, fontSize: 17 },
  legal: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.barkSecondary, textAlign: "center", marginTop: 4 },
  link: { fontFamily: fonts.bodySemiBold, color: colors.pine, textDecorationLine: "underline" },
});
