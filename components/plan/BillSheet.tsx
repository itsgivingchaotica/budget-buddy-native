// C8: the bill sheet (SCREENS_PLAN §4): add or edit a bill (name, amount,
// schedule, fixed category, optional paid-from account), mark the current
// occurrence paid or unpaid, archive. No native date picker: monthly bills
// pick a day 1–31 (29–31 fall on a shorter month's last day); weekly and
// every-2-weeks bills pick their next due day from the coming two weeks.
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { Button, Chip, ErrorBox, PressableBox } from "@/components/brand/ui";
import { Sheet } from "@/components/plan/Sheet";
import { StatusChip } from "@/components/plan/BillsSection";
import { colors, fonts, radius } from "@/constants/Theme";
import { listAccounts, type Account } from "@/utils/activityApi";
import { billChip, dayChipLabel, dayList, nextMonthlyDue, ordinal, parseMoneyInput } from "@/utils/plan";
import { archiveBill, createBill, fixedCategories, payBill, unpayBill, updateBill, type Bill, type BillInput, type CategoryOption } from "@/utils/planApi";

type Schedule = "monthly" | "weekly" | "biweekly";

/** The API input for the form's values (pure, tested). */
export function billInput(form: {
  name: string;
  amount: string;
  category: string;
  schedule: Schedule;
  day: number;
  nextDue: string;
  accountId: number | null;
  today: string;
}): BillInput | null {
  const amount = parseMoneyInput(form.amount);
  if (!form.name.trim() || !amount || Number(amount) <= 0 || !form.category) return null;
  const common = { name: form.name.trim(), amount, category: form.category, account_id: form.accountId };
  if (form.schedule === "monthly")
    return { ...common, recurrence: "monthly", day_of_month: form.day, first_due_on: nextMonthlyDue(form.day, form.today) };
  return { ...common, recurrence: form.schedule, day_of_month: null, first_due_on: form.nextDue };
}

export function BillSheet({
  open,
  bill,
  today,
  onClose,
  onChanged,
}: {
  open: boolean;
  /** null: a new bill. */
  bill: Bill | null;
  today: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [schedule, setSchedule] = useState<Schedule>("monthly");
  const [day, setDay] = useState(1);
  const [nextDue, setNextDue] = useState(today);
  const [category, setCategory] = useState("");
  const [accountId, setAccountId] = useState<number | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setName(bill?.name ?? "");
    setAmount(bill ? bill.amount : "");
    setSchedule(bill && (bill.recurrence === "weekly" || bill.recurrence === "biweekly") ? bill.recurrence : "monthly");
    setDay(bill?.day_of_month ?? (bill ? Number(bill.first_due_on.slice(8)) : Number(today.slice(8))));
    setNextDue(bill?.next_due_on ?? today);
    setCategory(bill?.category ?? "");
    setAccountId(bill?.account_id ?? null);
    fixedCategories().then(setCategories).catch(() => undefined);
    listAccounts().then(setAccounts).catch(() => undefined);
  }, [open, bill, today]);

  const input = billInput({ name, amount, category, schedule, day, nextDue, accountId, today });

  const run = async (what: string, action: () => Promise<unknown>) => {
    setBusy(what);
    setError(null);
    try {
      await action();
      onChanged();
    } catch {
      setError("Couldn't save that. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  };

  const save = () => input && run("save", () => (bill ? updateBill(bill.id, input) : createBill(input)));
  const current = bill?.current ?? null;
  const togglePaid = () =>
    bill && current && run("paid", () => (current.status === "paid" ? unpayBill(bill.id, current.due_on) : payBill(bill.id, current.due_on)));
  const archive = () =>
    bill &&
    Alert.alert(`Archive ${bill.name}?`, "It leaves your bills list. Its payment history is kept.", [
      { text: "Cancel", style: "cancel" },
      { text: "Archive", style: "destructive", onPress: () => run("archive", () => archiveBill(bill.id)) },
    ]);

  const chip = bill ? billChip(bill, today) : null;
  const days = dayList(today, schedule === "weekly" ? 7 : 14, 1);
  return (
    <Sheet visible={open} title={bill ? bill.name : "Add a bill"} onClose={onClose}>
      {bill && current && chip ? (
        <View style={styles.statusRow}>
          <StatusChip label={chip.label} tone={chip.tone} />
          <Button
            label={current.status === "paid" ? "Mark unpaid" : "Mark paid"}
            variant="secondary"
            onPress={togglePaid}
            busy={busy === "paid"}
            disabled={!!busy}
          />
        </View>
      ) : null}

      <Field label="Name">
        <TextInput value={name} onChangeText={setName} placeholder="e.g. Phone" accessibilityLabel="Bill name" style={styles.input} maxLength={80} />
      </Field>
      <Field label="Amount">
        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="decimal-pad"
          accessibilityLabel="Amount in dollars"
          style={styles.input}
        />
      </Field>

      <Field label="How often">
        <View style={styles.chips}>
          <Chip size="large" label="Monthly" selected={schedule === "monthly"} onPress={() => setSchedule("monthly")} />
          <Chip size="large" label="Weekly" selected={schedule === "weekly"} onPress={() => setSchedule("weekly")} />
          <Chip size="large" label="Every 2 weeks" selected={schedule === "biweekly"} onPress={() => setSchedule("biweekly")} />
        </View>
      </Field>

      {schedule === "monthly" ? (
        <Field label="Due on">
          <View style={styles.dayRow}>
            <PressableBox onPress={() => setDay((d) => Math.max(1, d - 1))} accessibilityRole="button" accessibilityLabel="Earlier day" style={styles.stepButton}>
              <Text style={styles.stepText}>−</Text>
            </PressableBox>
            <Text style={styles.dayText} accessibilityLabel={`Due on the ${ordinal(day)}`}>
              The {ordinal(day)}
            </Text>
            <PressableBox onPress={() => setDay((d) => Math.min(31, d + 1))} accessibilityRole="button" accessibilityLabel="Later day" style={styles.stepButton}>
              <Text style={styles.stepText}>+</Text>
            </PressableBox>
          </View>
          {day >= 29 ? <Text style={styles.hint}>In shorter months it&apos;s due on the last day.</Text> : null}
        </Field>
      ) : (
        <Field label="Next due">
          <View style={styles.chips}>
            {days.map((d) => (
              <Chip key={d} size="large" label={dayChipLabel(d, today)} selected={nextDue === d} onPress={() => setNextDue(d)} />
            ))}
          </View>
        </Field>
      )}

      <Field label="Category">
        <View style={styles.chips}>
          {categories.map((c) => (
            <Chip key={c.slug} size="large" label={c.name} selected={category === c.slug} onPress={() => setCategory(c.slug)} />
          ))}
        </View>
      </Field>

      <Field label="Paid from (optional)">
        <View style={styles.chips}>
          <Chip size="large" label="Not set" selected={accountId === null} onPress={() => setAccountId(null)} />
          {accounts.map((a) => (
            <Chip key={a.id} size="large" label={a.name} selected={accountId === a.id} onPress={() => setAccountId(a.id)} />
          ))}
        </View>
      </Field>

      {error ? <ErrorBox message={error} /> : null}
      <Button label={bill ? "Save changes" : "Add bill"} onPress={save} busy={busy === "save"} disabled={!input || !!busy} />
      {bill ? <Button label="Archive bill" variant="outline" onPress={archive} disabled={!!busy} /> : null}
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  field: { gap: 8 },
  label: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.bark },
  input: { minHeight: 48, borderRadius: radius.button, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.white, paddingHorizontal: 14, fontFamily: fonts.body, fontSize: 17, color: colors.bark },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dayRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepButton: { width: 48, height: 48, borderRadius: radius.button, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  stepText: { fontFamily: fonts.bodySemiBold, fontSize: 24, color: colors.pine },
  dayText: { flex: 1, textAlign: "center", fontFamily: fonts.heading, fontSize: 22, color: colors.bark },
  hint: { fontFamily: fonts.body, fontSize: 14, color: colors.barkSecondary },
});
