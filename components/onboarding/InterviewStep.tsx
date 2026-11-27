// C5 step 2 (SPEC_ONBOARDING_PLAN §4.2, screens/Onboard-2-Interview.png):
// the coach's questions, one at a time, as chat bubbles. Question text and
// prefilled answers come from Rails (facts from imported data, never model
// text); each answer is saved before the next question, so leaving and
// coming back resumes. Tap-first answers; no free text in the MVP.
import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { Button, Chip, ErrorBox, PressableBox } from "@/components/brand/ui";
import { Mascot } from "@/components/brand/Mascot";
import { colors, fonts, radius } from "@/constants/Theme";
import { amountWithoutSign } from "@/utils/format";
import { billChoices, GOAL_DATE_CHOICES, goalDateLabel, goalReady, keptBills, monthsAhead } from "@/utils/onboarding";
import { dayChipLabel, dayList, ordinal, parseMoneyInput } from "@/utils/plan";
import { fixedCategories, type CategoryOption } from "@/utils/planApi";
import type { AnswersInput, Appetite, BillAnswer, DetectedBill, GoalAnswer, GoalKind, PayAnswer, PayFrequency, Question } from "@/utils/onboardingApi";

type Props = {
  questions: Question[];
  /** Every bill Rails found (facts.likely_bills), so removed ones can be ticked back. */
  detectedBills: DetectedBill[];
  answers: Record<string, unknown>;
  start: number;
  today: string;
  onSave: (input: AnswersInput) => Promise<boolean>;
  onIndex: (n: number) => void;
  onDone: () => void;
};

const GOAL_LABELS: Record<GoalKind, string> = {
  upcoming_payment: "Upcoming payment",
  purchase: "Something to buy",
  emergency_fund: "Emergency fund",
  debt_payoff: "Pay off a debt",
};

export function InterviewStep({ questions, detectedBills, answers, start, today, onSave, onIndex, onDone }: Props) {
  const [index, setIndex] = useState(start);
  const [busy, setBusy] = useState(false);
  const q = questions[index];

  // Each question's working answer, starting from the saved answer or the prefill.
  const [pay, setPay] = useState<PayAnswer>(() => ((answers.pay as PayAnswer) ?? (questions.find((x) => x.id === "pay")?.prefill as PayAnswer)) ?? { frequency: null, next_pay_on: null, typical_amount: null });
  const [side, setSide] = useState<string | null>(() => (answers.side_income as string) ?? null);
  const initialBills = useMemo(() => billChoices(detectedBills, answers.bills as BillAnswer[] | undefined), [detectedBills, answers.bills]);
  const [bills, setBills] = useState<BillAnswer[]>(initialBills.bills);
  const [kept, setKept] = useState<Record<number, boolean>>(initialBills.kept);
  const [goals, setGoals] = useState<GoalAnswer[]>(() => (answers.goals as GoalAnswer[]) ?? []);
  const [noGoals, setNoGoals] = useState<boolean>(() => Array.isArray(answers.goals) && (answers.goals as unknown[]).length === 0);
  const [appetite, setAppetite] = useState<Appetite>(() => (answers.change_appetite as Appetite) ?? "trim");

  useEffect(() => onIndex(index), [index, onIndex]);

  const ready =
    q.id === "pay" ? !!pay.frequency : q.id === "side_income" ? !!side : q.id === "goals" ? noGoals || (goals.length > 0 && goals.every(goalReady)) : true;

  const next = async () => {
    const input: AnswersInput =
      q.id === "pay" ? { pay } : q.id === "side_income" ? { side_income: side! } : q.id === "bills" ? { bills: keptBills(bills, kept) } : q.id === "goals" ? { goals: noGoals ? [] : goals } : { change_appetite: appetite };
    setBusy(true);
    const ok = await onSave(input);
    setBusy(false);
    if (!ok) return;
    if (index === questions.length - 1) onDone();
    else setIndex(index + 1);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.coach}>
        <View style={styles.avatar}>
          <Mascot size={52} />
        </View>
        <View>
          <Text style={styles.coachName}>Your coach</Text>
          <Text style={styles.coachSub}>A few questions to shape your plan</Text>
        </View>
      </View>

      {questions.slice(0, index).map((past, i) => {
        const label = answerLabel(past, { pay, side, bills: keptBills(bills, kept), goals, noGoals, appetite });
        return (
          <View key={past.id} style={styles.history}>
            <Bubble text={past.text} />
            {/* Tap your earlier answer to change it (it's saved again with Next question). */}
            <Bubble text={label} mine onPress={() => setIndex(i)} accessibilityLabel={`Change your answer: ${label}`} />
          </View>
        );
      })}

      <Bubble text={q.id === "pay" && q.hint ? `${q.text} ${q.hint}` : q.text} />

      {q.id === "pay" ? (
        <>
          <Chips options={q.options} value={pay.frequency} onPick={(v) => setPay({ ...pay, frequency: v as PayFrequency })} />
          {pay.frequency && pay.frequency !== "irregular" ? (
            <View style={styles.field}>
              <Text style={styles.label}>Next payday</Text>
              <View style={styles.chips}>
                {dayList(today, 15, 1).map((d) => (
                  <Chip key={d} size="large" label={dayChipLabel(d, today)} selected={pay.next_pay_on === d} onPress={() => setPay({ ...pay, next_pay_on: d })} />
                ))}
              </View>
            </View>
          ) : null}
        </>
      ) : null}

      {q.id === "side_income" ? <Chips options={q.options} value={side} onPick={setSide} /> : null}

      {q.id === "bills" ? (
        <BillsEditor bills={bills} kept={kept} onToggle={(i) => setKept({ ...kept, [i]: kept[i] === false })} onAdd={(b) => setBills([...bills, b])} />
      ) : null}

      {q.id === "goals" ? (
        <GoalsEditor goals={goals} noGoals={noGoals} today={today} onChange={setGoals} onNoGoals={setNoGoals} />
      ) : null}

      {q.id === "change_appetite" ? <Chips options={q.options} value={appetite} onPick={(v) => setAppetite(v as Appetite)} /> : null}

      <Button label={index === questions.length - 1 ? "Done" : "Next question"} onPress={next} busy={busy} disabled={!ready || busy} />
    </View>
  );
}

/** What the user's answer bubble says for an answered question. */
export function answerLabel(
  q: Question,
  a: { pay: PayAnswer; side: string | null; bills: BillAnswer[]; goals: GoalAnswer[]; noGoals: boolean; appetite: Appetite }
): string {
  switch (q.id) {
    case "pay":
      return q.options.find((o) => o.value === a.pay.frequency)?.label ?? "";
    case "side_income":
      return q.options.find((o) => o.value === a.side)?.label ?? "";
    case "bills":
      return a.bills.length === 0 ? "None of these" : a.bills.length === 1 ? "Keep 1 bill" : `Keep ${a.bills.length} bills`;
    case "goals":
      return a.noGoals || a.goals.length === 0 ? "Nothing for now" : a.goals.map((g) => g.name || GOAL_LABELS[g.kind]).join(", ");
    case "change_appetite":
      return q.options.find((o) => o.value === a.appetite)?.label ?? "";
  }
}

function Bubble({ text, mine, onPress, accessibilityLabel }: { text: string; mine?: boolean; onPress?: () => void; accessibilityLabel?: string }) {
  if (onPress)
    return (
      <PressableBox onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
        <Text style={[styles.bubbleText, mine && styles.mineText]}>{text}</Text>
      </PressableBox>
    );
  return (
    <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
      <Text style={[styles.bubbleText, mine && styles.mineText]}>{text}</Text>
    </View>
  );
}

function Chips({ options, value, onPick }: { options: { value: string; label: string }[]; value: string | null; onPick: (v: string) => void }) {
  return (
    <View style={styles.chips}>
      {options.map((o) => (
        <Chip key={o.value} size="large" label={o.label} selected={value === o.value} onPress={() => onPick(o.value)} />
      ))}
    </View>
  );
}

function BillsEditor({
  bills,
  kept,
  onToggle,
  onAdd,
}: {
  bills: BillAnswer[];
  kept: Record<number, boolean>;
  onToggle: (i: number) => void;
  onAdd: (b: BillAnswer) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [day, setDay] = useState(1);
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  useEffect(() => {
    if (adding && categories.length === 0) fixedCategories().then(setCategories).catch(() => undefined);
  }, [adding, categories.length]);

  const money = parseMoneyInput(amount);
  const canAdd = name.trim() !== "" && money !== null && Number(money) > 0 && category !== "";

  return (
    <View style={styles.card}>
      {bills.length === 0 ? <Text style={styles.muted}>I didn&apos;t spot any regular bills. Add the ones you pay.</Text> : null}
      {bills.map((b, i) => {
        const on = kept[i] !== false;
        return (
          <PressableBox
            key={`${b.name}-${i}`}
            onPress={() => onToggle(i)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            accessibilityLabel={`${b.name}, ${amountWithoutSign(b.amount)}, monthly on the ${ordinal(b.day)}`}
            style={styles.billRow}
          >
            <View style={[styles.box, on && styles.boxOn]}>{on ? <Text style={styles.tick}>✓</Text> : null}</View>
            <View style={styles.billText}>
              <Text style={styles.billName}>{b.name}</Text>
              <Text style={styles.billSub}>
                {amountWithoutSign(b.amount)} · monthly on the {ordinal(b.day)}
              </Text>
            </View>
          </PressableBox>
        );
      })}
      {adding ? (
        <View style={styles.addForm}>
          <TextInput value={name} onChangeText={setName} placeholder="Bill name" accessibilityLabel="Bill name" style={styles.input} maxLength={80} />
          <TextInput value={amount} onChangeText={setAmount} placeholder="Amount" keyboardType="decimal-pad" accessibilityLabel="Bill amount" style={styles.input} />
          <View style={styles.dayRow}>
            <PressableBox onPress={() => setDay((d) => Math.max(1, d - 1))} accessibilityRole="button" accessibilityLabel="Earlier day" style={styles.step}>
              <Text style={styles.stepText}>−</Text>
            </PressableBox>
            <Text style={styles.dayText}>Monthly on the {ordinal(day)}</Text>
            <PressableBox onPress={() => setDay((d) => Math.min(31, d + 1))} accessibilityRole="button" accessibilityLabel="Later day" style={styles.step}>
              <Text style={styles.stepText}>+</Text>
            </PressableBox>
          </View>
          <View style={styles.chips}>
            {categories.map((c) => (
              <Chip key={c.slug} size="large" label={c.name} selected={category === c.slug} onPress={() => setCategory(c.slug)} />
            ))}
          </View>
          <Button
            label="Add this bill"
            variant="secondary"
            disabled={!canAdd}
            onPress={() => {
              onAdd({ name: name.trim(), amount: money!, day, category, detected: false });
              setAdding(false);
              setName("");
              setAmount("");
              setDay(1);
              setCategory("");
            }}
          />
        </View>
      ) : (
        <PressableBox onPress={() => setAdding(true)} accessibilityRole="button" accessibilityLabel="Add a bill" style={styles.addLink}>
          <Text style={styles.addLinkText}>+ Add a bill</Text>
        </PressableBox>
      )}
    </View>
  );
}

function GoalsEditor({
  goals,
  noGoals,
  today,
  onChange,
  onNoGoals,
}: {
  goals: GoalAnswer[];
  noGoals: boolean;
  today: string;
  onChange: (g: GoalAnswer[]) => void;
  onNoGoals: (v: boolean) => void;
}) {
  const kinds = Object.keys(GOAL_LABELS) as GoalKind[];
  const toggle = (kind: GoalKind) => {
    onNoGoals(false);
    onChange(goals.some((g) => g.kind === kind) ? goals.filter((g) => g.kind !== kind) : [...goals, { kind }]);
  };
  const edit = (kind: GoalKind, patch: Partial<GoalAnswer>) => onChange(goals.map((g) => (g.kind === kind ? { ...g, ...patch } : g)));
  return (
    <View style={styles.gap}>
      <View style={styles.chips}>
        {kinds.map((k) => (
          <Chip key={k} size="large" label={GOAL_LABELS[k]} selected={goals.some((g) => g.kind === k)} onPress={() => toggle(k)} />
        ))}
        <Chip
          size="large"
          label="Nothing for now"
          selected={noGoals}
          onPress={() => {
            onNoGoals(!noGoals);
            onChange([]);
          }}
        />
      </View>
      {goals.map((g) => (
        <View key={g.kind} style={styles.card}>
          <Text style={styles.formTitle}>{GOAL_LABELS[g.kind]}</Text>
          {g.kind !== "emergency_fund" ? (
            <TextInput value={g.name ?? ""} onChangeText={(name) => edit(g.kind, { name })} placeholder="Name, e.g. Car insurance" accessibilityLabel={`${GOAL_LABELS[g.kind]} name`} style={styles.input} maxLength={80} />
          ) : null}
          {g.kind === "debt_payoff" ? (
            <>
              <TextInput value={g.balance ?? ""} onChangeText={(balance) => edit(g.kind, { balance })} placeholder="Balance" keyboardType="decimal-pad" accessibilityLabel="Debt balance" style={styles.input} />
              <TextInput value={g.apr ?? ""} onChangeText={(apr) => edit(g.kind, { apr })} placeholder="APR %, e.g. 22.9" keyboardType="decimal-pad" accessibilityLabel="APR in percent" style={styles.input} />
              <TextInput value={g.monthly_payment ?? ""} onChangeText={(monthly_payment) => edit(g.kind, { monthly_payment })} placeholder="Monthly payment" keyboardType="decimal-pad" accessibilityLabel="Monthly payment" style={styles.input} />
            </>
          ) : (
            <TextInput value={g.amount ?? ""} onChangeText={(amount) => edit(g.kind, { amount })} placeholder="Amount" keyboardType="decimal-pad" accessibilityLabel={`${GOAL_LABELS[g.kind]} amount`} style={styles.input} />
          )}
          {g.kind === "upcoming_payment" || g.kind === "purchase" ? (
            <View style={styles.field}>
              <Text style={styles.label}>{g.kind === "purchase" ? "By when? (optional)" : "By when?"}</Text>
              <View style={styles.chips}>
                {GOAL_DATE_CHOICES.map((m) => {
                  const date = monthsAhead(today, m);
                  return (
                    <Chip key={m} size="large" label={goalDateLabel(date, today)} selected={g.date === date} onPress={() => edit(g.kind, { date: g.date === date ? null : date })} />
                  );
                })}
              </View>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  gap: { gap: 12 },
  coach: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.fern, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  coachName: { fontFamily: fonts.heading, fontSize: 22, color: colors.bark },
  coachSub: { fontFamily: fonts.body, fontSize: 15, color: colors.barkSecondary },
  history: { gap: 10 },
  bubble: { maxWidth: "88%", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12 },
  theirs: { alignSelf: "flex-start", backgroundColor: colors.card, borderBottomLeftRadius: 6 },
  mine: { alignSelf: "flex-end", backgroundColor: colors.pine, borderBottomRightRadius: 6 },
  bubbleText: { fontFamily: fonts.body, fontSize: 17, lineHeight: 24, color: colors.bark },
  mineText: { color: colors.white },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  field: { gap: 8 },
  label: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.bark },
  card: { backgroundColor: colors.card, borderRadius: radius.card, padding: 16, gap: 10 },
  muted: { fontFamily: fonts.body, fontSize: 15, color: colors.barkSecondary },
  billRow: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 52 },
  box: { width: 26, height: 26, borderRadius: 7, borderWidth: 2, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  boxOn: { backgroundColor: colors.pine, borderColor: colors.pine },
  tick: { color: colors.white, fontFamily: fonts.bodySemiBold, fontSize: 15 },
  billText: { flex: 1, gap: 2 },
  billName: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.bark },
  billSub: { fontFamily: fonts.body, fontSize: 14, color: colors.barkSecondary },
  addForm: { gap: 10, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12 },
  input: { minHeight: 48, borderRadius: radius.button, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.white, paddingHorizontal: 14, fontFamily: fonts.body, fontSize: 17, color: colors.bark },
  dayRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  step: { width: 44, height: 44, borderRadius: radius.button, borderWidth: 1.5, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  stepText: { fontFamily: fonts.bodySemiBold, fontSize: 22, color: colors.pine },
  dayText: { flex: 1, textAlign: "center", fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.bark },
  addLink: { minHeight: 44, justifyContent: "center" },
  addLinkText: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.pine },
  formTitle: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.bark },
});

