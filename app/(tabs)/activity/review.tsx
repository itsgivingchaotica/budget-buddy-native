import React, { useCallback, useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Body, Card, Chip, ErrorBox, LinkButton, Loading, NETWORK_ERROR, ScreenHeader } from "@/components/brand/ui";
import { Mascot } from "@/components/brand/Mascot";
import { colors, fonts, radius } from "@/constants/Theme";
import {
  listCategories,
  pickCategory,
  reviewGroups,
  undoCorrection,
  type CategoryRef,
  type ReviewGroup,
} from "@/utils/activityApi";
import { formatCount } from "@/utils/format";
import { ReviewGroupCard, type Picked } from "@/components/activity/ReviewGroupCard";

/** C2b: Review (docs/product/SCREENS_ACTIVITY.md §5, screens/Activity-Review.png). */
export default function ReviewScreen() {
  const router = useRouter();
  const [groups, setGroups] = useState<ReviewGroup[] | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [picked, setPicked] = useState<Record<string, Picked>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [moreFor, setMoreFor] = useState<ReviewGroup | null>(null);
  const [allCategories, setAllCategories] = useState<CategoryRef[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [review, cats] = await Promise.all([reviewGroups(), listCategories()]);
      setGroups(review.groups);
      setRemaining(review.remaining);
      // "More…" offers every category except Transfers (only a confirmed pair sets it).
      setAllCategories(cats.filter((c) => c.kind !== "transfer").map(({ id, slug, name }) => ({ id, slug, name })));
    } catch {
      setError(NETWORK_ERROR);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pick = async (group: ReviewGroup, category: CategoryRef) => {
    setMoreFor(null);
    setBusyKey(group.merchant_key);
    setError(null);
    try {
      const result = await pickCategory(group.representative_transaction_id, category.slug);
      setPicked((p) => ({
        ...p,
        [group.merchant_key]: { name: category.name, alsoUpdated: result.also_updated, correctionId: result.correction_id },
      }));
      setRemaining((r) => Math.max(r - (1 + result.also_updated), 0));
    } catch {
      setError("Couldn't save that category. Check your connection and try again.");
    } finally {
      setBusyKey(null);
    }
  };

  const undo = async (group: ReviewGroup) => {
    const current = picked[group.merchant_key];
    if (!current) return;
    setPicked((p) => ({ ...p, [group.merchant_key]: { ...current, undoing: true } }));
    setError(null);
    try {
      const result = await undoCorrection(current.correctionId);
      setPicked((p) => {
        const next = { ...p };
        delete next[group.merchant_key];
        return next;
      });
      setRemaining(result.remaining);
    } catch {
      setPicked((p) => ({ ...p, [group.merchant_key]: current }));
      setError("Couldn't undo. Check your connection and try again.");
    }
  };

  const allDone = groups !== null && remaining === 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          backLabel="Activity"
          onBack={() => router.back()}
          title={groups ? `To review · ${formatCount(remaining)}` : "To review"}
          intro="Pick a category once per merchant. I'll apply it to the others waiting here and remember it next time."
        />
        {error ? <ErrorBox message={error} onRetry={groups ? undefined : load} /> : null}
        {!groups && !error ? <Loading /> : null}

        {allDone ? (
          <Card style={styles.done}>
            <Mascot size={96} />
            <Text style={styles.doneTitle} accessibilityRole="header">
              All caught up
            </Text>
            <Body secondary style={styles.center}>
              Nothing left to review. New imports will show up here if I'm unsure.
            </Body>
          </Card>
        ) : null}

        {groups?.map((group) => (
          <ReviewGroupCard
            key={group.merchant_key}
            group={group}
            picked={picked[group.merchant_key]}
            busy={busyKey === group.merchant_key}
            onPick={(c) => pick(group, c)}
            onMore={() => setMoreFor(group)}
            onUndo={() => undo(group)}
          />
        ))}
      </ScrollView>

      <Modal visible={!!moreFor} transparent animationType="slide" onRequestClose={() => setMoreFor(null)}>
        <Pressable style={styles.scrim} onPress={() => setMoreFor(null)} accessibilityLabel="Close" />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle} accessibilityRole="header">
            {moreFor?.display_name}
          </Text>
          <ScrollView contentContainerStyle={styles.sheetChips}>
            {allCategories.map((c) => (
              <Chip key={c.id} size="large" label={c.name} onPress={() => moreFor && pick(moreFor, c)} />
            ))}
          </ScrollView>
          <LinkButton label="Cancel" center onPress={() => setMoreFor(null)} />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.birch },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  done: { alignItems: "center", gap: 8, paddingVertical: 24 },
  doneTitle: { fontFamily: fonts.heading, fontSize: 24, color: colors.bark },
  center: { textAlign: "center" },
  scrim: { flex: 1, backgroundColor: "rgba(58, 42, 30, 0.35)" },
  sheet: { backgroundColor: colors.birch, borderTopLeftRadius: radius.card, borderTopRightRadius: radius.card, padding: 20, gap: 12, maxHeight: "70%" },
  sheetTitle: { fontFamily: fonts.heading, fontSize: 20, color: colors.bark },
  sheetChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
