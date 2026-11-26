// C3 (Home screen): the cards on Home (SPEC_LEFT_TO_SPEND §5, §8;
// screens/Home-No-Plan.png). Every figure comes from W1; these only format.
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Button, Card, LinkButton, PressableBox } from "@/components/brand/ui";
import { Mascot } from "@/components/brand/Mascot";
import { colors, fonts, minTouch, radius } from "@/constants/Theme";
import { billDueLabel, goalLine, weekDays } from "@/utils/home";
import type { BillItem, GoalThisWeek, WeekOutlook } from "@/utils/homeApi";
import { dollarsDown, leftDisplay, spentShare } from "@/utils/money";
import { amountWithoutSign, plural } from "@/utils/format";

/** "Left to spend · Mon–Sun": the headline number, allowance, bar. Tap for details. */
export function LeftToSpendCard({
  outlook,
  onDetails,
  onMonth,
  onReview,
}: {
  outlook: WeekOutlook;
  onDetails: () => void;
  onMonth: () => void;
  onReview: () => void;
}) {
  const l = outlook.left_to_spend;
  const shown = leftDisplay(l.left);
  const share = spentShare(l.spent, l.allowance);
  const over = shown.overBy !== null;
  const label = over ? `${shown.amount} left, over by ${shown.overBy}` : `${shown.amount} left`;
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.section}>Left to spend · {weekDays(outlook.week)}</Text>
        <LinkButton label="Month" onPress={onMonth} />
      </View>
      <PressableBox onPress={onDetails} accessibilityRole="button" accessibilityLabel={`${label}. Show details`} style={styles.headline}>
        <View style={styles.amountRow}>
          <Text style={styles.amount}>{shown.amount}</Text>
          <Text style={styles.leftWord}>left</Text>
        </View>
        {over ? (
          <View style={styles.overRow} accessibilityRole="alert">
            <Ionicons name="warning" size={18} color={colors.ember} />
            <Text style={styles.overText}>Over budget · over by {shown.overBy}</Text>
          </View>
        ) : null}
        <Text style={styles.of}>of {dollarsDown(l.allowance)} for the week</Text>
        <View style={styles.bar} accessibilityLabel={`${Math.round(share * 100)}% of the week's budget spent`}>
          <View style={[styles.barFill, { width: `${share * 100}%`, backgroundColor: over ? colors.ember : colors.moss }]} />
        </View>
      </PressableBox>
      {l.uncategorized_count > 0 ? (
        <LinkButton label={`Includes ${plural(l.uncategorized_count, "transaction")} to review`} onPress={onReview} />
      ) : null}
    </Card>
  );
}

/** A state message (stale, no data this week, counted through) with an optional action. */
export function StateNote({ message, action, onAction }: { message: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.note}>
      <Ionicons name="information-circle-outline" size={20} color={colors.chestnut} />
      <View style={styles.noteBody}>
        <Text style={styles.noteText}>{message}</Text>
        {action && onAction ? <LinkButton label={action} onPress={onAction} /> : null}
      </View>
    </View>
  );
}

/** "Bills · next 7 days" with a mark-paid toggle per bill. */
export function BillsCard({
  bills,
  today,
  busyKey,
  onToggle,
}: {
  bills: BillItem[];
  today: string;
  busyKey: string | null;
  onToggle: (bill: BillItem) => void;
}) {
  return (
    <Card style={styles.card}>
      <Text style={styles.section}>Bills · next 7 days</Text>
      {bills.length === 0 ? <Text style={styles.muted}>No bills due in the next 7 days.</Text> : null}
      {bills.map((bill) => {
        const key = `${bill.obligation_id}:${bill.due_on}`;
        const amount = amountWithoutSign(bill.amount);
        return (
          <View key={key} style={styles.billRow}>
            <View style={styles.billText}>
              <Text style={styles.billName}>{bill.name}</Text>
              <View style={styles.dueRow}>
                {bill.overdue ? <Ionicons name="warning" size={14} color={colors.ember} style={styles.dueIcon} /> : null}
                <Text style={[styles.billDue, bill.overdue && styles.billOverdue]}>{billDueLabel(bill, today)}</Text>
              </View>
            </View>
            <Text style={styles.billAmount}>{amount}</Text>
            <PressableBox
              onPress={() => onToggle(bill)}
              disabled={busyKey === key}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: bill.paid, disabled: busyKey === key }}
              accessibilityLabel={`${bill.name}, ${amount}: ${bill.paid ? "paid. Mark unpaid" : "mark paid"}`}
              style={styles.toggle}
            >
              <Ionicons name={bill.paid ? "checkmark-circle" : "ellipse-outline"} size={28} color={bill.paid ? colors.pine : colors.barkSecondary} />
            </PressableBox>
          </View>
        );
      })}
    </Card>
  );
}

/** Goal contributions due this week (dated goals only). */
export function GoalsCard({ goals }: { goals: GoalThisWeek[] }) {
  if (goals.length === 0) return null;
  return (
    <Card style={styles.card}>
      <Text style={styles.section}>Goals · this week</Text>
      {goals.map((g) => (
        <View key={g.goal_id} style={styles.goalRow}>
          <Ionicons name="leaf-outline" size={18} color={colors.moss} />
          <Text style={styles.goalText}>{goalLine(g)}</Text>
        </View>
      ))}
    </Card>
  );
}

/** No plan yet (screens/Home-No-Plan.png). */
export function NoPlanCard({ onPlan }: { onPlan: () => void }) {
  return (
    <Card style={styles.noPlan}>
      <View style={styles.center}>
        <Mascot size={150} />
      </View>
      <Text style={styles.noPlanTitle} accessibilityRole="header">
        Let&apos;s make a plan together
      </Text>
      <Text style={styles.noPlanBody}>
        Your transactions are in. Answer a few questions and your coach will draft weekly budgets, bills and goals for you to approve.
      </Text>
      <Button label="Make a plan with your coach" onPress={onPlan} />
      <Text style={styles.small}>Takes about 3 minutes</Text>
    </Card>
  );
}

/** "3 accounts imported · Data through Sat, Nov 21" (no-plan state). */
export function AccountsNote({ count, dataThrough, onImport }: { count: number; dataThrough: string | null; onImport: () => void }) {
  if (count === 0) {
    return (
      <StateNote message="No accounts yet. Import your bank exports to get started." action="Go to Activity" onAction={onImport} />
    );
  }
  return (
    <View style={styles.imported}>
      <Ionicons name="checkmark" size={22} color={colors.pine} />
      <View>
        <Text style={styles.importedTitle}>{plural(count, "account")} imported</Text>
        {dataThrough ? <Text style={styles.importedBody}>Data through {dataThrough}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 18, gap: 10 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  section: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.barkSecondary },
  headline: { gap: 6 },
  amountRow: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  amount: { fontFamily: fonts.heading, fontSize: 48, color: colors.bark },
  leftWord: { fontFamily: fonts.bodyMedium, fontSize: 20, color: colors.barkSecondary },
  overRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  overText: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.emberDark },
  of: { fontFamily: fonts.body, fontSize: 15, color: colors.barkSecondary },
  bar: { height: 10, borderRadius: 5, backgroundColor: colors.tile, overflow: "hidden" },
  barFill: { height: 10, borderRadius: 5 },
  note: { flexDirection: "row", gap: 10, padding: 14, borderRadius: radius.card, backgroundColor: colors.reviewChip },
  noteBody: { flex: 1, gap: 2 },
  noteText: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.bark },
  muted: { fontFamily: fonts.body, fontSize: 15, color: colors.barkSecondary },
  billRow: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: minTouch },
  billText: { flex: 1, gap: 2 },
  billName: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.bark },
  dueRow: { flexDirection: "row", alignItems: "flex-start", gap: 4 },
  dueIcon: { marginTop: 2 },
  billDue: { flexShrink: 1, fontFamily: fonts.body, fontSize: 14, color: colors.barkSecondary },
  billOverdue: { color: colors.emberDark, fontFamily: fonts.bodyMedium },
  billAmount: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.bark, marginLeft: 4 },
  toggle: { width: minTouch, height: minTouch, alignItems: "center", justifyContent: "center" },
  goalRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  goalText: { flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.bark },
  noPlan: { padding: 24, gap: 14, alignItems: "stretch" },
  center: { alignItems: "center" },
  noPlanTitle: { fontFamily: fonts.heading, fontSize: 24, color: colors.bark, textAlign: "center" },
  noPlanBody: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.barkSecondary, textAlign: "center" },
  small: { fontFamily: fonts.body, fontSize: 14, color: colors.barkSecondary, textAlign: "center" },
  imported: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: radius.card, backgroundColor: colors.fern },
  importedTitle: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.pine },
  importedBody: { fontFamily: fonts.body, fontSize: 14, color: colors.pine },
});
