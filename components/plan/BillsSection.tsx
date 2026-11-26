// C8: Plan → Bills (SCREENS_PLAN §4, screens/Plan-Bills.png). Figures and
// statuses from GET /obligations (OB1); tapping a row opens the bill sheet.
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { PressableBox } from "@/components/brand/ui";
import { colors, fonts, radius } from "@/constants/Theme";
import { amountWithoutSign, plural } from "@/utils/format";
import { billChip, scheduleLabel, type ChipTone } from "@/utils/plan";
import type { Bill, BillList } from "@/utils/planApi";

/** "$1,250" for whole dollars, "$15.99" otherwise (as in the design). */
export function billAmount(amount: string): string {
  const text = amountWithoutSign(amount);
  return text.endsWith(".00") ? text.slice(0, -3) : text;
}

export function BillsSection({ data, onOpen, onAdd }: { data: BillList; onOpen: (bill: Bill) => void; onAdd: () => void }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.summary}>
        <View style={styles.summaryLeft}>
          <Text style={styles.summaryLabel}>Bills each month</Text>
          <Text style={styles.summaryAmount}>{amountWithoutSign(data.summary.monthly_total)}</Text>
        </View>
        <Text style={styles.summaryRight}>{plural(data.summary.due_in_next_7_days, "due", "due")} in the{"\n"}next 7 days</Text>
      </View>

      {data.obligations.length > 0 ? (
        <View style={styles.list}>
          {data.obligations.map((bill, i) => {
            const chip = billChip(bill, data.today);
            return (
              <PressableBox
                key={bill.id}
                onPress={() => onOpen(bill)}
                accessibilityRole="button"
                accessibilityLabel={`${bill.name}, ${billAmount(bill.amount)}, ${scheduleLabel(bill)}${chip ? `, ${chip.label}` : ""}. Edit bill`}
                style={[styles.row, i > 0 && styles.divider]}
              >
                <View style={styles.rowText}>
                  <Text style={styles.name}>{bill.name}</Text>
                  <Text style={styles.schedule}>{scheduleLabel(bill)}</Text>
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.amount}>{billAmount(bill.amount)}</Text>
                  {chip ? <StatusChip label={chip.label} tone={chip.tone} /> : null}
                </View>
              </PressableBox>
            );
          })}
        </View>
      ) : (
        <Text style={styles.muted}>No bills yet. Add the ones you pay every month, like rent or your phone.</Text>
      )}

      <PressableBox onPress={onAdd} accessibilityRole="button" accessibilityLabel="Add a bill" style={styles.add}>
        <Ionicons name="add" size={20} color={colors.pine} />
        <Text style={styles.addText}>Add a bill</Text>
      </PressableBox>
    </View>
  );
}

const CHIP: Record<ChipTone, { bg: string; fg: string }> = {
  positive: { bg: colors.fern, fg: colors.pine },
  review: { bg: colors.reviewChip, fg: colors.chestnut },
  neutral: { bg: colors.tile, fg: colors.bark },
  overdue: { bg: colors.reviewChip, fg: colors.emberDark },
};

export function StatusChip({ label, tone }: { label: string; tone: ChipTone }) {
  return (
    <View style={[styles.chip, { backgroundColor: CHIP[tone].bg }]}>
      {tone === "overdue" ? <Ionicons name="warning" size={13} color={colors.ember} /> : null}
      <Text style={[styles.chipText, { color: CHIP[tone].fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  summary: { flexDirection: "row", alignItems: "center", backgroundColor: colors.fern, borderRadius: radius.card, padding: 18, gap: 12 },
  summaryLeft: { flex: 1, gap: 4 },
  summaryLabel: { fontFamily: fonts.body, fontSize: 15, color: colors.pine },
  summaryAmount: { fontFamily: fonts.heading, fontSize: 32, color: colors.pine },
  summaryRight: { fontFamily: fonts.body, fontSize: 15, color: colors.pine, textAlign: "right" },
  list: { backgroundColor: colors.card, borderRadius: radius.card, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", padding: 18, gap: 12 },
  divider: { borderTopWidth: 1, borderTopColor: colors.line },
  rowText: { flex: 1, gap: 4 },
  name: { fontFamily: fonts.bodySemiBold, fontSize: 17, color: colors.bark },
  schedule: { fontFamily: fonts.body, fontSize: 15, color: colors.barkSecondary },
  rowRight: { alignItems: "flex-end", gap: 6 },
  amount: { fontFamily: fonts.bodySemiBold, fontSize: 18, color: colors.bark },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: radius.chip, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 14 },
  muted: { fontFamily: fonts.body, fontSize: 15, color: colors.barkSecondary },
  add: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 56, borderRadius: radius.card, borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.moss },
  addText: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.pine },
});
