// C5 step 3 (SPEC_ONBOARDING_PLAN §8, screens/Onboard-3-Merchants.png): the
// top review groups (C2b), with the same chips, pick and undo. Before the
// draft, so "usual" spending is worked out on better data.
import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button, Chip, ErrorBox, LinkButton, Loading, NETWORK_ERROR } from "@/components/brand/ui";
import { Sheet } from "@/components/plan/Sheet";
import { ReviewGroupCard, type Picked } from "@/components/activity/ReviewGroupCard";
import { colors, fonts } from "@/constants/Theme";
import { listCategories, pickCategory, reviewGroups, undoCorrection, type CategoryRef, type ReviewGroup } from "@/utils/activityApi";
import { formatCount } from "@/utils/format";

export const TOP_GROUPS = 5;

/** Rows still waiting after these groups: "N more are waiting in Activity". */
export function moreWaiting(remaining: number, shown: ReviewGroup[], picked: Record<string, Picked>): number {
  const stillShown = shown.filter((g) => !picked[g.merchant_key]).reduce((sum, g) => sum + g.count, 0);
  return Math.max(remaining - stillShown, 0);
}

export function MerchantsStep({ busy, onContinue }: { busy: boolean; onContinue: () => void }) {
  const [groups, setGroups] = useState<ReviewGroup[] | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [picked, setPicked] = useState<Record<string, Picked>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [moreFor, setMoreFor] = useState<ReviewGroup | null>(null);
  const [allCategories, setAllCategories] = useState<CategoryRef[]>([]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [review, cats] = await Promise.all([reviewGroups(), listCategories()]);
      setGroups(review.groups.slice(0, TOP_GROUPS));
      setRemaining(review.remaining);
      // "More…" offers every category except Transfers (only a confirmed pair sets it), as on Review.
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
      setPicked((p) => ({ ...p, [group.merchant_key]: { name: category.name, alsoUpdated: result.also_updated, correctionId: result.correction_id } }));
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
    try {
      const result = await undoCorrection(current.correctionId);
      setPicked((p) => {
        const next = { ...p };
        delete next[group.merchant_key];
        return next;
      });
      setRemaining(result.remaining);
    } catch {
      setError("Couldn't undo. Check your connection and try again.");
    }
  };

  const more = groups ? moreWaiting(remaining, groups, picked) : 0;
  return (
    <View style={styles.wrap}>
      <Text style={styles.title} accessibilityRole="header">
        A few I wasn&apos;t sure about
      </Text>
      <Text style={styles.intro}>Pick a category once and I&apos;ll remember the merchant next time.</Text>
      {error ? <ErrorBox message={error} onRetry={groups ? undefined : load} /> : null}
      {!groups && !error ? <Loading /> : null}
      {groups && groups.length === 0 ? <Text style={styles.intro}>Nothing to check. Everything was categorized.</Text> : null}
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
      {more > 0 ? <Text style={styles.footer}>{formatCount(more)} more are waiting in Activity whenever you&apos;re ready.</Text> : null}
      <Button label="Looks good" onPress={onContinue} busy={busy} disabled={busy} />
      <LinkButton label="Skip for now" center onPress={onContinue} />
      <Sheet visible={!!moreFor} title={moreFor?.display_name ?? ""} onClose={() => setMoreFor(null)}>
        <View style={styles.chips}>
          {allCategories.map((c) => (
            <Chip key={c.id} size="large" label={c.name} onPress={() => moreFor && pick(moreFor, c)} />
          ))}
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  title: { fontFamily: fonts.heading, fontSize: 32, lineHeight: 38, color: colors.bark },
  intro: { fontFamily: fonts.body, fontSize: 16, lineHeight: 23, color: colors.barkSecondary },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  footer: { fontFamily: fonts.body, fontSize: 15, color: colors.barkSecondary, textAlign: "center" },
});
