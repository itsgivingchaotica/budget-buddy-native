import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Body, Card, Chip, LinkButton, Loading } from "@/components/brand/ui";
import { colors, fonts } from "@/constants/Theme";
import type { CategoryRef, ReviewGroup } from "@/utils/activityApi";
import { PURPOSE_LABELS } from "@/utils/accountLabels";
import { formatMoney, plural } from "@/utils/format";

/** After a pick: the category, how many others changed, and the correction to undo. */
export type Picked = { name: string; alsoUpdated: number; correctionId: number; undoing?: boolean };

/** C2b: one merchant group on Review (spec §5). */
export function ReviewGroupCard({
  group,
  picked,
  busy,
  onPick,
  onMore,
  onUndo,
}: {
  group: ReviewGroup;
  picked?: Picked;
  busy?: boolean;
  onPick: (category: CategoryRef) => void;
  onMore: () => void;
  onUndo: () => void;
}) {
  const money = formatMoney(group.total);
  const account = group.accounts[0];
  const purpose = account && account.purpose !== "spending" ? ` · ${PURPOSE_LABELS[account.purpose].toLowerCase()}` : "";
  const accountText = group.accounts.length > 1 ? `${group.accounts.length} accounts` : `${account?.name ?? ""}${purpose}`;

  return (
    <Card style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.merchant} numberOfLines={2}>
          {group.display_name}
        </Text>
        <Text style={[styles.total, { color: money.direction === "in" ? colors.pine : colors.bark }]}>{money.text}</Text>
      </View>
      <Body secondary>
        {plural(group.count, "transaction")} · {accountText}
      </Body>

      {picked ? (
        <View style={styles.pickedRow}>
          <Text style={styles.pickedText}>
            {picked.name}
            {picked.alsoUpdated > 0 ? ` · also updated ${plural(picked.alsoUpdated, "other")}` : " · saved"}
          </Text>
          <LinkButton label={picked.undoing ? "Undoing…" : "Undo"} tone="chestnut" underline onPress={onUndo} />
        </View>
      ) : busy ? (
        <Loading />
      ) : (
        <View style={styles.chips}>
          {group.suggested_category ? (
            <Chip size="large" tone="suggestion" label={`${group.suggested_category.name}?`} onPress={() => onPick(group.suggested_category!)} />
          ) : null}
          {group.alternatives.map((c) => (
            <Chip key={c.id} size="large" label={c.name} onPress={() => onPick(c)} />
          ))}
          <Chip size="large" label="More…" onPress={onMore} />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 18, gap: 4 },
  topRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  merchant: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 17, color: colors.bark },
  total: { fontFamily: fonts.bodySemiBold, fontSize: 17 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  pickedRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 6 },
  pickedText: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.pine },
});
