// C8: Plan → Budgets, the monthly dashboard (SCREENS_PLAN §3,
// screens/Plan-Budgets.png). Figures from GET /analytics/budget_vs_actual.
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinkButton, PressableBox } from "@/components/brand/ui";
import { colors, fonts, minTouch, radius } from "@/constants/Theme";
import { formatDay, parseDay } from "@/utils/format";
import { dollarsDown, dollarsUp, spentShare, toCents } from "@/utils/money";
import { budgetLeft, monthName, spentText } from "@/utils/plan";
import type { BudgetMonth, BudgetRow, UnbudgetedRow } from "@/utils/planApi";

export function BudgetsSection({
  data,
  today,
  isCurrentMonth,
  onPrev,
  onNext,
  onEdit,
  onAddBudget,
  onBills,
  onReview,
}: {
  data: BudgetMonth;
  today: string;
  isCurrentMonth: boolean;
  onPrev: () => void;
  onNext: () => void;
  onEdit: (row: BudgetRow) => void;
  onAddBudget: (row: UnbudgetedRow) => void;
  onBills: () => void;
  onReview: () => void;
}) {
  const year = parseDay(today).getFullYear();
  const month = monthName(data.month, year);
  return (
    <View style={styles.wrap}>
      <View style={styles.monthRow}>
        <PressableBox onPress={onPrev} accessibilityRole="button" accessibilityLabel="Previous month" style={styles.arrow}>
          <Ionicons name="chevron-back" size={22} color={colors.pine} />
        </PressableBox>
        <Text style={styles.monthText} accessibilityRole="header">
          {month}
          {isCurrentMonth ? "" : " · read only"}
        </Text>
        <PressableBox
          onPress={onNext}
          disabled={isCurrentMonth}
          accessibilityRole="button"
          accessibilityLabel="Next month"
          accessibilityState={{ disabled: isCurrentMonth }}
          style={[styles.arrow, isCurrentMonth && styles.hidden]}
        >
          <Ionicons name="chevron-forward" size={22} color={colors.pine} />
        </PressableBox>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryLeft}>
          <Text style={styles.summaryLabel}>Everyday budgets · {month}</Text>
          <Text style={styles.summaryAmount}>
            {dollarsDown(data.totals.budget)} <Text style={styles.summaryUnit}>a month</Text>
          </Text>
        </View>
        <Text style={styles.summaryRight}>
          {dollarsUp(data.totals.everyday_spent)} spent{data.data_through ? `\nthrough ${formatDay(data.data_through, parseDay(today))}` : ""}
        </Text>
      </View>

      {data.categories.length > 0 ? (
        <View style={styles.list}>
          {data.categories.map((row, i) => (
            <BudgetLine key={row.category} row={row} first={i === 0} onPress={isCurrentMonth ? () => onEdit(row) : undefined} />
          ))}
        </View>
      ) : (
        <Text style={styles.muted}>No budgets for this month.</Text>
      )}

      {data.unbudgeted.length > 0 ? (
        <View style={styles.list}>
          <Text style={styles.groupTitle}>No budget yet</Text>
          {data.unbudgeted.map((row) => (
            <PressableBox
              key={row.category}
              onPress={isCurrentMonth ? () => onAddBudget(row) : undefined}
              disabled={!isCurrentMonth}
              accessibilityRole="button"
              accessibilityLabel={`${row.name}, ${spentText(row.spent)}. ${isCurrentMonth ? "Set a budget" : ""}`}
              style={styles.simpleRow}
            >
              <Text style={styles.rowName}>{row.name}</Text>
              <Text style={styles.rowSub}>{spentText(row.spent)}</Text>
            </PressableBox>
          ))}
        </View>
      ) : null}

      {toCents(data.uncategorized) > 0 ? (
        <View style={styles.list}>
          <View style={styles.simpleRow}>
            <Text style={styles.rowName}>Not yet categorized · {dollarsUp(data.uncategorized)}</Text>
            <LinkButton label="Review" onPress={onReview} />
          </View>
        </View>
      ) : null}

      <Text style={styles.footnote}>
        Rent, utilities and other fixed costs are in{" "}
        <Text style={styles.link} onPress={onBills} accessibilityRole="link">
          Bills
        </Text>
        . {isCurrentMonth ? "Tap a budget to change it." : "Earlier months are read only."}
      </Text>
    </View>
  );
}

function BudgetLine({ row, first, onPress }: { row: BudgetRow; first: boolean; onPress?: () => void }) {
  const left = budgetLeft(row);
  const share = spentShare(row.spent, row.budget);
  return (
    <PressableBox
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={`${row.name}, ${dollarsDown(row.budget)} a month, ${spentText(row.spent)}, ${left.text}${onPress ? ". Change budget" : ""}`}
      style={[styles.row, !first && styles.divider]}
    >
      <View style={styles.rowTop}>
        <Text style={styles.rowName}>{row.name}</Text>
        <Text style={styles.rowBudget}>
          {dollarsDown(row.budget)} <Text style={styles.rowUnit}>/month</Text>
        </Text>
      </View>
      <View style={styles.bar}>
        <View style={[styles.barFill, { width: `${share * 100}%`, backgroundColor: left.over ? colors.ember : colors.moss }]} />
      </View>
      <View style={styles.rowTop}>
        <Text style={styles.rowSub}>{spentText(row.spent)}</Text>
        <Text style={[styles.rowSub, left.over && styles.over]}>{left.text}</Text>
      </View>
    </PressableBox>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  monthRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  arrow: { width: minTouch, height: minTouch, alignItems: "center", justifyContent: "center" },
  hidden: { opacity: 0 },
  monthText: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.bark },
  summary: { flexDirection: "row", alignItems: "center", backgroundColor: colors.fern, borderRadius: radius.card, padding: 18, gap: 12 },
  summaryLeft: { flex: 1, gap: 4 },
  summaryLabel: { fontFamily: fonts.body, fontSize: 15, color: colors.pine },
  summaryAmount: { fontFamily: fonts.heading, fontSize: 32, color: colors.pine },
  summaryUnit: { fontFamily: fonts.bodyMedium, fontSize: 17 },
  summaryRight: { fontFamily: fonts.body, fontSize: 15, color: colors.pine, textAlign: "right" },
  list: { backgroundColor: colors.card, borderRadius: radius.card, overflow: "hidden" },
  groupTitle: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.barkSecondary, paddingHorizontal: 18, paddingTop: 14 },
  row: { padding: 18, gap: 8 },
  divider: { borderTopWidth: 1, borderTopColor: colors.line },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 8 },
  rowName: { flexShrink: 1, fontFamily: fonts.bodySemiBold, fontSize: 17, color: colors.bark },
  rowBudget: { fontFamily: fonts.bodySemiBold, fontSize: 17, color: colors.bark },
  rowUnit: { fontFamily: fonts.body, fontSize: 14, color: colors.barkSecondary },
  rowSub: { fontFamily: fonts.body, fontSize: 15, color: colors.barkSecondary },
  over: { color: colors.emberDark, fontFamily: fonts.bodySemiBold },
  bar: { height: 8, borderRadius: 4, backgroundColor: colors.tile, overflow: "hidden" },
  barFill: { height: 8, borderRadius: 4 },
  simpleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, paddingHorizontal: 18, minHeight: 56 },
  muted: { fontFamily: fonts.body, fontSize: 15, color: colors.barkSecondary },
  footnote: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.barkSecondary, textAlign: "center" },
  link: { color: colors.pine, fontFamily: fonts.bodySemiBold, textDecorationLine: "underline" },
});
