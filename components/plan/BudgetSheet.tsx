// C8: change a budget (SCREENS_PLAN §3.1, screens/Plan-Edit-Budget.png).
// −/+ in $10 steps or type whole dollars ($0–$10,000). The context rows
// (about per week, 3-month average, spent this month) come from the API
// for the amount shown, so the app does no maths. Saving applies to the
// whole current month.
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { Button, ErrorBox, PressableBox } from "@/components/brand/ui";
import { Sheet } from "@/components/plan/Sheet";
import { colors, fonts, radius } from "@/constants/Theme";
import { dollarText, dollarsDown, dollarsUp } from "@/utils/money";
import { monthName, parseWholeDollars } from "@/utils/plan";
import { budgetContext, saveBudget, type BudgetContext } from "@/utils/planApi";

export const MAX_BUDGET = 10000;
export const STEP = 10;

/** −/+ by $10, kept within $0–$10,000. */
export function stepAmount(amount: number, by: number): number {
  return Math.min(MAX_BUDGET, Math.max(0, amount + by));
}

export function BudgetSheet({
  target,
  onClose,
  onSaved,
}: {
  /** The category and its current monthly budget in whole dollars (0 for "No budget yet"). */
  target: { slug: string; name: string; amount: number } | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState(0);
  const [text, setText] = useState("0");
  const [context, setContext] = useState<BudgetContext | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!target) return;
    setAmount(target.amount);
    setText(String(target.amount));
    setError(null);
  }, [target]);

  // The figures for the amount shown, a moment after it stops changing.
  useEffect(() => {
    if (!target) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      budgetContext(target.slug, amount)
        .then((c) => !cancelled && setContext(c))
        .catch(() => undefined);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [target, amount]);

  const change = (next: number) => {
    setAmount(next);
    setText(String(next));
  };

  const typed = (value: string) => {
    setText(value);
    const n = parseWholeDollars(value, MAX_BUDGET);
    if (n !== null) setAmount(n);
  };

  const valid = parseWholeDollars(text, MAX_BUDGET) !== null;

  const save = async () => {
    if (!target || !valid) return;
    setSaving(true);
    setError(null);
    try {
      await saveBudget(target.slug, amount);
      onSaved();
    } catch {
      setError("Couldn't save that. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const month = context ? monthName(context.month) : "this month";
  return (
    <Sheet visible={!!target} title={`${target?.name ?? ""} budget`} onClose={onClose}>
      <Text style={styles.label}>Each month</Text>
      <View style={styles.stepper}>
        <PressableBox onPress={() => change(stepAmount(amount, -STEP))} accessibilityRole="button" accessibilityLabel="Decrease by $10" style={styles.stepButton}>
          <Text style={styles.stepText}>−</Text>
        </PressableBox>
        <View style={[styles.amountBox, !valid && styles.invalid]}>
          <Text style={styles.dollar}>$</Text>
          <TextInput
            value={text}
            onChangeText={typed}
            keyboardType="number-pad"
            accessibilityLabel="Budget each month, in dollars"
            style={styles.amountInput}
            maxLength={6}
            selectTextOnFocus
          />
        </View>
        <PressableBox onPress={() => change(stepAmount(amount, STEP))} accessibilityRole="button" accessibilityLabel="Increase by $10" style={styles.stepButton}>
          <Text style={styles.stepText}>+</Text>
        </PressableBox>
      </View>
      {!valid ? <Text style={styles.error}>Whole dollars from $0 to {dollarText(MAX_BUDGET)}.</Text> : null}

      <View style={styles.context}>
        <ContextRow label="About per week" value={context?.weekly_equivalent ? dollarsDown(context.weekly_equivalent) : "—"} />
        <ContextRow
          label={context && context.months_averaged < 3 && context.months_averaged > 0 ? `Your average, last ${context.months_averaged} months` : "Your average, last 3 months"}
          value={context?.average_last_3_months ? dollarsUp(context.average_last_3_months) : "Not enough data"}
          divider
        />
        <ContextRow label="Spent this month" value={context ? dollarsUp(context.spent_this_month) : "—"} divider />
      </View>
      <Text style={styles.note}>Applies to all of {month}, including this week&apos;s Left to spend.</Text>
      {error ? <ErrorBox message={error} /> : null}
      <Button label={`Save ${dollarText(amount)} a month`} onPress={save} busy={saving} disabled={!valid || saving} />
    </Sheet>
  );
}

function ContextRow({ label, value, divider }: { label: string; value: string; divider?: boolean }) {
  return (
    <View style={[styles.contextRow, divider && styles.divider]} accessible>
      <Text style={styles.contextLabel}>{label}</Text>
      <Text style={styles.contextValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.bark },
  stepper: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepButton: { width: 52, height: 52, borderRadius: radius.button, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  stepText: { fontFamily: fonts.bodySemiBold, fontSize: 26, color: colors.pine },
  amountBox: { flex: 1, height: 56, flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: radius.button, borderWidth: 2, borderColor: colors.pine, backgroundColor: colors.white },
  invalid: { borderColor: colors.ember },
  dollar: { fontFamily: fonts.heading, fontSize: 30, color: colors.bark },
  amountInput: { fontFamily: fonts.heading, fontSize: 30, color: colors.bark, minWidth: 40, textAlign: "center", padding: 0 },
  error: { fontFamily: fonts.body, fontSize: 14, color: colors.emberDark },
  context: { backgroundColor: colors.card, borderRadius: radius.card },
  contextRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 18, paddingVertical: 14, gap: 8 },
  divider: { borderTopWidth: 1, borderTopColor: colors.line },
  contextLabel: { flexShrink: 1, fontFamily: fonts.body, fontSize: 16, color: colors.bark },
  contextValue: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.bark },
  note: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.barkSecondary },
});
