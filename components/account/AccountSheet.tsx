import React, { useEffect, useRef, useState } from "react";
import { Animated, Modal, PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { PressableBox } from "@/components/brand/ui";
import { colors, fonts } from "@/constants/Theme";
import { accountRows, fetchMe, initial, type Me } from "@/utils/account";

const DISMISS_DRAG = 80; // points dragged down to close

/**
 * C9: the account sheet (docs/product/SCREENS_WELCOME.md §5,
 * screens/Account-Sheet.png): who's signed in, read-only week start and
 * time zone, and Log out. A plain Modal with a slide-up animation (no
 * bottom-sheet library). Closes on swipe down, a tap on the scrim, or back.
 */
export function AccountSheet({
  visible,
  firstName,
  email,
  onClose,
  onLogout,
}: {
  visible: boolean;
  firstName?: string | null;
  email?: string | null;
  onClose: () => void;
  onLogout: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [me, setMe] = useState<Me | null>(null);
  const drag = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    drag.setValue(0);
    let cancelled = false;
    // The profile comes from /me; until it loads (or if it fails) the
    // defaults show: Monday and the device's time zone.
    fetchMe()
      .then((data) => !cancelled && setMe(data))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [visible, drag]);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => drag.setValue(Math.max(g.dy, 0)),
      onPanResponderRelease: (_, g) => {
        if (g.dy > DISMISS_DRAG) onClose();
        else Animated.spring(drag, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  const name = me?.first_name || firstName || "";
  const mail = me?.email || email || "";
  const rows = accountRows(me);
  const version = Constants.expoConfig?.version ?? "";

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close account" />
      <Animated.View
        style={[styles.sheet, { paddingBottom: 24 + insets.bottom, transform: [{ translateY: drag }] }]}
        accessibilityViewIsModal
        {...pan.panHandlers}
      >
        <View style={styles.handle} accessibilityElementsHidden />
        <View style={styles.who}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial(name, mail)}</Text>
          </View>
          <View style={styles.whoText}>
            {name ? (
              <Text style={styles.name} accessibilityRole="header" numberOfLines={1}>
                {name}
              </Text>
            ) : null}
            {mail ? (
              <Text style={styles.email} numberOfLines={1}>
                {mail}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.card}>
          <Row label="Week starts on" value={rows.weekStartsOn} />
          <View style={styles.divider} />
          <Row label="Time zone" value={rows.timeZone} />
        </View>

        <PressableBox onPress={onLogout} accessibilityRole="button" accessibilityLabel="Log out" style={styles.logout}>
          <Text style={styles.logoutText}>Log out</Text>
        </PressableBox>

        <Text style={styles.footer}>Budget Buddy {version} · sign-in by Kinde</Text>
      </Animated.View>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: "rgba(58, 42, 30, 0.45)" },
  sheet: {
    backgroundColor: colors.birch,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 18,
  },
  handle: { alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: colors.line },
  who: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.pine, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: fonts.bodySemiBold, fontSize: 22, color: colors.white },
  whoText: { flex: 1, gap: 2 },
  name: { fontFamily: fonts.heading, fontSize: 22, color: colors.bark },
  email: { fontFamily: fonts.body, fontSize: 15, color: colors.barkSecondary },
  card: { backgroundColor: colors.card, borderRadius: 18 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, minHeight: 52 },
  rowLabel: { fontFamily: fonts.body, fontSize: 16, color: colors.bark },
  rowValue: { fontFamily: fonts.body, fontSize: 16, color: colors.barkSecondary },
  divider: { height: 1, backgroundColor: colors.line, marginLeft: 16 },
  logout: {
    height: 54,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.ember,
    backgroundColor: colors.birch,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: { fontFamily: fonts.bodySemiBold, fontSize: 17, color: colors.emberDark },
  footer: { fontFamily: fonts.body, fontSize: 13, color: colors.barkSecondary, textAlign: "center" },
});
