// C8: "Set aside money" (saving goals: amount, date, note) and "Update
// balance" (debt: new balance, date), SCREENS_PLAN §5. Dates are chips for
// the last 7 days (default today; never later, as the server requires).
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { Button, Chip, ErrorBox } from "@/components/brand/ui";
import { Sheet } from "@/components/plan/Sheet";
import { colors, fonts, radius } from "@/constants/Theme";
import { dayChipLabel, dayList, parseMoneyInput } from "@/utils/plan";
import { addContribution, type ContributionInput, type Goal } from "@/utils/planApi";

/** The API input for the form (pure, tested): debt → balance_after, saving → amount > 0. */
export function contributionInput(debt: boolean, amountText: string, day: string, note: string): ContributionInput | null {
  const amount = parseMoneyInput(amountText);
  if (amount === null) return null;
  if (debt) return { balance_after: amount, contributed_on: day };
  if (Number(amount) <= 0) return null;
  return { amount, contributed_on: day, ...(note.trim() ? { note: note.trim() } : {}) };
}

export function ContributionSheet({
  goal,
  today,
  onClose,
  onSaved,
}: {
  goal: Goal | null;
  today: string;
  onClose: () => void;
  onSaved: (goal: Goal, contributionId: number, message: string) => void;
}) {
  const debt = goal?.progress.kind === "debt";
  const [amount, setAmount] = useState("");
  const [day, setDay] = useState(today);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAmount("");
    setDay(today);
    setNote("");
    setError(null);
  }, [goal, today]);

  const input = contributionInput(!!debt, amount, day, note);

  const save = async () => {
    if (!goal || !input) return;
    setBusy(true);
    setError(null);
    try {
      const { contribution } = await addContribution(goal.id, input);
      onSaved(goal, contribution.id, debt ? `${goal.name}: balance updated` : `Set aside for ${goal.name}`);
    } catch {
      setError("Couldn't save that. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={!!goal} title={debt ? "Update balance" : "Set aside money"} onClose={onClose}>
      <Text style={styles.goal}>{goal?.name}</Text>
      <View style={styles.field}>
        <Text style={styles.label}>{debt ? "New balance" : "Amount"}</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="decimal-pad"
          accessibilityLabel={debt ? "New balance in dollars" : "Amount in dollars"}
          style={styles.input}
          autoFocus
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Date</Text>
        <View style={styles.chips}>
          {dayList(today, 7, -1).map((d) => (
            <Chip key={d} size="large" label={dayChipLabel(d, today)} selected={day === d} onPress={() => setDay(d)} />
          ))}
        </View>
      </View>
      {!debt ? (
        <View style={styles.field}>
          <Text style={styles.label}>Note (optional)</Text>
          <TextInput value={note} onChangeText={setNote} placeholder="e.g. from my paycheck" accessibilityLabel="Note" style={styles.input} maxLength={200} />
        </View>
      ) : null}
      {error ? <ErrorBox message={error} /> : null}
      <Button label={debt ? "Save balance" : "Set aside"} onPress={save} busy={busy} disabled={!input || busy} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  goal: { fontFamily: fonts.bodySemiBold, fontSize: 17, color: colors.barkSecondary },
  field: { gap: 8 },
  label: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.bark },
  input: { minHeight: 48, borderRadius: radius.button, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.white, paddingHorizontal: 14, fontFamily: fonts.body, fontSize: 17, color: colors.bark },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
