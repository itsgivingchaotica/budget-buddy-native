// C3 (Home screen): the Left to spend detail sheet (SPEC_LEFT_TO_SPEND §5):
// per category allowance, spent and left; the assumptions; data through.
// Exact cents here (the headline is the rounded one). A plain Modal, like
// the account sheet (C9).
import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableBox } from "@/components/brand/ui";
import { colors, fonts, minTouch } from "@/constants/Theme";
import { amountWithoutSign, formatDayWithWeekday, parseDay } from "@/utils/format";
import type { WeekOutlook } from "@/utils/homeApi";
import { toCents } from "@/utils/money";

/** "$31.23 left", or "over by $5.00". */
export function lineLeft(left: string): string {
  return toCents(left) < 0 ? `over by ${amountWithoutSign(left)}` : `${amountWithoutSign(left)} left`;
}

/** Categories worth a line: a budget this week or spending (no "$0.00 of $0.00"). */
export function visibleLines<T extends { allowance: string; spent: string }>(lines: T[]): T[] {
  return lines.filter((c) => toCents(c.allowance) !== 0 || toCents(c.spent) !== 0);
}

export function OutlookSheet({ outlook, visible, onClose }: { outlook: WeekOutlook; visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const l = outlook.left_to_spend;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close details" />
      <View style={[styles.sheet, { paddingBottom: 24 + insets.bottom }]}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            This week, by category
          </Text>
          <PressableBox onPress={onClose} accessibilityRole="button" accessibilityLabel="Done" style={styles.done}>
            <Text style={styles.doneText}>Done</Text>
          </PressableBox>
        </View>
        <ScrollView contentContainerStyle={styles.body}>
          {visibleLines(l.by_category).map((c) => (
            <View key={c.category} style={styles.line} accessible>
              <Text style={styles.name}>{c.name}</Text>
              <Text style={styles.figures}>
                {amountWithoutSign(c.spent)} of {amountWithoutSign(c.allowance)} ·{" "}
                <Text style={toCents(c.left) < 0 ? styles.over : undefined}>{lineLeft(c.left)}</Text>
              </Text>
            </View>
          ))}
          {toCents(l.uncategorized_spent) > 0 ? (
            <View style={styles.line} accessible>
              <Text style={styles.name}>Not yet categorized</Text>
              <Text style={styles.figures}>{amountWithoutSign(l.uncategorized_spent)} spent</Text>
            </View>
          ) : null}
          <View style={styles.total} accessible>
            <Text style={styles.name}>Week total</Text>
            <Text style={styles.figures}>
              {amountWithoutSign(l.spent)} of {amountWithoutSign(l.allowance)} · {lineLeft(l.left)}
            </Text>
          </View>
          {outlook.data_through ? (
            <Text style={styles.small}>Data through {formatDayWithWeekday(outlook.data_through, parseDay(outlook.today))}</Text>
          ) : null}
          <Text style={styles.subhead}>How this is worked out</Text>
          {outlook.assumptions.map((a) => (
            <Text key={a} style={styles.small}>
              • {a}
            </Text>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: "rgba(58,42,30,0.35)" },
  sheet: { backgroundColor: colors.birch, borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: "80%", paddingTop: 8 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20 },
  title: { flex: 1, fontFamily: fonts.heading, fontSize: 20, color: colors.bark },
  done: { minHeight: minTouch, minWidth: minTouch, alignItems: "flex-end", justifyContent: "center" },
  doneText: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.pine },
  body: { paddingHorizontal: 20, gap: 12, paddingTop: 8 },
  line: { gap: 2 },
  total: { gap: 2, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10 },
  name: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.bark },
  figures: { fontFamily: fonts.body, fontSize: 15, color: colors.barkSecondary },
  over: { color: colors.emberDark, fontFamily: fonts.bodySemiBold },
  subhead: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.bark, marginTop: 6 },
  small: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.barkSecondary },
});
