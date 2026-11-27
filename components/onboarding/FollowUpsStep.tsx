// ON2 client (#31), SPEC_ONBOARDING_PLAN §5: the coach's follow-up
// questions (at most 2) after the five questions. The model words the
// question; every answer option comes from Rails. Each answer is saved
// before the next; with none (or the AI unavailable) this step is skipped.
import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { Button, Chip, PressableBox } from "@/components/brand/ui";
import { colors, fonts, radius } from "@/constants/Theme";
import { moveInOrder } from "@/utils/onboarding";
import { parseMoneyInput } from "@/utils/plan";
import type { AnswersInput, FollowUp, FollowUpAnswer } from "@/utils/onboardingApi";

export function FollowUpsStep({
  followUps,
  start,
  onSave,
  onDone,
}: {
  followUps: FollowUp[];
  start: number;
  onSave: (input: AnswersInput) => Promise<boolean>;
  onDone: () => void;
}) {
  const [index, setIndex] = useState(start);
  const [busy, setBusy] = useState(false);
  const f = followUps[index];
  const [choice, setChoice] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [order, setOrder] = useState<number[]>(() => (f && f.input === "order" ? f.goals.map((g) => g.index) : []));

  const value: FollowUpAnswer | null =
    f.input === "choice" ? choice : f.input === "amount" ? parseMoneyInput(amount) : order;

  const next = async () => {
    if (value === null) return;
    setBusy(true);
    const ok = await onSave({ follow_ups: { [f.slot]: value } });
    setBusy(false);
    if (!ok) return;
    if (index === followUps.length - 1) return onDone();
    const nf = followUps[index + 1];
    setChoice(null);
    setAmount("");
    setOrder(nf.input === "order" ? nf.goals.map((g) => g.index) : []);
    setIndex(index + 1);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>
        A couple more · {index + 1} of {followUps.length}
      </Text>
      <View style={styles.bubble}>
        <Text style={styles.bubbleText}>{f.question}</Text>
      </View>

      {f.input === "choice" ? (
        <View style={styles.chips}>
          {f.options.map((o) => (
            <Chip key={o.value} size="large" label={o.label} selected={choice === o.value} onPress={() => setChoice(o.value)} />
          ))}
        </View>
      ) : null}

      {f.input === "amount" ? (
        <View style={styles.field}>
          <Text style={styles.label}>{f.label}</Text>
          <TextInput value={amount} onChangeText={setAmount} placeholder="$0" keyboardType="decimal-pad" accessibilityLabel={f.label} style={styles.input} />
        </View>
      ) : null}

      {f.input === "order" ? (
        <View style={styles.card}>
          {order.map((goalIndex, i) => {
            const name = f.goals.find((g) => g.index === goalIndex)?.name ?? "";
            return (
              <View key={goalIndex} style={styles.orderRow}>
                <Text style={styles.orderText}>
                  {i + 1}. {name}
                </Text>
                <PressableBox onPress={() => setOrder(moveInOrder(order, i, -1))} disabled={i === 0} accessibilityRole="button" accessibilityLabel={`Move ${name} up`} style={[styles.move, i === 0 && styles.hidden]}>
                  <Text style={styles.moveText}>↑</Text>
                </PressableBox>
                <PressableBox onPress={() => setOrder(moveInOrder(order, i, 1))} disabled={i === order.length - 1} accessibilityRole="button" accessibilityLabel={`Move ${name} down`} style={[styles.move, i === order.length - 1 && styles.hidden]}>
                  <Text style={styles.moveText}>↓</Text>
                </PressableBox>
              </View>
            );
          })}
        </View>
      ) : null}

      <Button label={index === followUps.length - 1 ? "Done" : "Next"} onPress={next} busy={busy} disabled={value === null || busy} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  label: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.barkSecondary },
  bubble: { alignSelf: "flex-start", maxWidth: "88%", backgroundColor: colors.card, borderRadius: 20, borderBottomLeftRadius: 6, paddingHorizontal: 16, paddingVertical: 12 },
  bubbleText: { fontFamily: fonts.body, fontSize: 17, lineHeight: 24, color: colors.bark },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  field: { gap: 8 },
  input: { minHeight: 48, borderRadius: radius.button, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.white, paddingHorizontal: 14, fontFamily: fonts.body, fontSize: 17, color: colors.bark },
  card: { backgroundColor: colors.card, borderRadius: radius.card, padding: 12, gap: 4 },
  orderRow: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 48 },
  orderText: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.bark },
  move: { width: 44, height: 44, borderRadius: radius.button, borderWidth: 1.5, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  moveText: { fontFamily: fonts.bodySemiBold, fontSize: 18, color: colors.pine },
  hidden: { opacity: 0 },
});
