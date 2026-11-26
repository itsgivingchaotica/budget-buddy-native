import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Body, Card, ErrorBox, Loading, NETWORK_ERROR, ScreenHeader } from "@/components/brand/ui";
import { TransferPairCard, type PairOutcome } from "@/components/activity/TransferPairCard";
import { colors } from "@/constants/Theme";
import { confirmTransfer, rejectTransfer, suggestedTransfers, undoTransfer, type TransferPair } from "@/utils/activityApi";
import { formatCount } from "@/utils/format";

/** C2b: Transfers (bb-server/docs/product/SCREENS_ACTIVITY.md §6, screens/Activity-Transfers.png). */
export default function TransfersScreen() {
  const router = useRouter();
  const [pairs, setPairs] = useState<TransferPair[] | null>(null);
  const [outcomes, setOutcomes] = useState<Record<number, PairOutcome>>({});
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setPairs((await suggestedTransfers()).transfer_links);
    } catch {
      setError(NETWORK_ERROR);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (pair: TransferPair, action: "confirm" | "reject" | "undo") => {
    setBusy(pair.id);
    setError(null);
    try {
      if (action === "confirm") await confirmTransfer(pair.id);
      if (action === "reject") await rejectTransfer(pair.id);
      if (action === "undo") await undoTransfer(pair.id);
      setOutcomes((o) => {
        const next = { ...o };
        if (action === "undo") delete next[pair.id];
        else next[pair.id] = action === "confirm" ? "confirmed" : "rejected";
        return next;
      });
    } catch {
      setError("Couldn't save that. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  };

  const open = pairs ? pairs.filter((p) => !outcomes[p.id]).length : 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          backLabel="Activity"
          onBack={() => router.back()}
          title={pairs ? `Transfers · ${formatCount(open)}` : "Transfers"}
          intro="Money moving between your own accounts isn't spending or income. Confirm the pairs that are transfers."
        />
        {error ? <ErrorBox message={error} onRetry={pairs ? undefined : load} /> : null}
        {!pairs && !error ? <Loading /> : null}
        {pairs && pairs.length === 0 ? (
          <Card>
            <Body>No transfers to confirm. New imports are checked for them automatically.</Body>
          </Card>
        ) : null}
        <View style={styles.list}>
          {pairs?.map((pair) => (
            <TransferPairCard
              key={pair.id}
              pair={pair}
              outcome={outcomes[pair.id]}
              busy={busy === pair.id}
              onConfirm={() => act(pair, "confirm")}
              onReject={() => act(pair, "reject")}
              onUndo={() => act(pair, "undo")}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.birch },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  list: { gap: 14 },
});
