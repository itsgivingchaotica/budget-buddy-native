import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Body, Button, Card, LinkButton, Loading } from "@/components/brand/ui";
import { colors, fonts } from "@/constants/Theme";
import type { TransferPair, TransferSide } from "@/utils/activityApi";
import { amountWithoutSign, daysApartLabel, formatDay } from "@/utils/format";

export type PairOutcome = "confirmed" | "rejected";

export const OUTCOME_TEXT: Record<PairOutcome, string> = {
  confirmed: "Confirmed · left out of spending and income",
  rejected: "Got it · won't suggest this pair again",
};

/** C2b: one suggested transfer pair (spec §6). */
export function TransferPairCard({
  pair,
  outcome,
  busy,
  onConfirm,
  onReject,
  onUndo,
}: {
  pair: TransferPair;
  outcome?: PairOutcome;
  busy?: boolean;
  onConfirm: () => void;
  onReject: () => void;
  onUndo: () => void;
}) {
  return (
    <Card style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.amount}>{amountWithoutSign(pair.amount)}</Text>
        <Body secondary>{daysApartLabel(pair.days_apart)}</Body>
      </View>
      <View style={styles.sides}>
        <Side label="Out of" side={pair.outflow} />
        <Ionicons name="arrow-forward" size={20} color={colors.moss} accessibilityLabel="to" />
        <Side label="Into" side={pair.inflow} />
      </View>
      {busy ? (
        <Loading />
      ) : outcome ? (
        <View style={styles.outcomeRow}>
          <Text style={[styles.outcome, { color: outcome === "confirmed" ? colors.pine : colors.barkSecondary }]}>{OUTCOME_TEXT[outcome]}</Text>
          <LinkButton label="Undo" tone="chestnut" underline onPress={onUndo} />
        </View>
      ) : (
        <View style={styles.buttons}>
          <Button label="Not a transfer" variant="outline" onPress={onReject} style={styles.button} />
          <Button label="Confirm" onPress={onConfirm} style={styles.button} />
        </View>
      )}
    </Card>
  );
}

function Side({ label, side }: { label: string; side: TransferSide }) {
  return (
    <View style={styles.side}>
      <Body secondary>
        {label} {side.account_name} · {formatDay(side.posted_on)}
      </Body>
      <Text style={styles.description} numberOfLines={1}>
        {side.description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 18, gap: 10 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  amount: { fontFamily: fonts.heading, fontSize: 26, color: colors.bark },
  sides: { flexDirection: "row", alignItems: "center", gap: 8 },
  side: { flex: 1, gap: 2 },
  description: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.bark },
  buttons: { flexDirection: "row", gap: 12, marginTop: 4 },
  button: { flex: 1, minHeight: 52 },
  outcomeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  outcome: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 15 },
});
