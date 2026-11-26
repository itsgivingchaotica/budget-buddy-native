import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { openBrowserAsync } from "expo-web-browser";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Body, Button, Card, Chip, ErrorBox, LinkButton, Loading, NETWORK_ERROR, PressableBox, ScreenHeader } from "@/components/brand/ui";
import { colors, fonts, minTouch, radius } from "@/constants/Theme";
import { listAccounts, templateUrl, type Account } from "@/utils/activityApi";
import { KIND_LABELS, PURPOSE_LABELS } from "@/utils/accountLabels";
import { formatDay, freshness, plural } from "@/utils/format";

/** C2: Accounts (bb-server/docs/product/SCREENS_ACTIVITY.md §2, screens/Activity-Accounts.png). */
export default function AccountsScreen() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [archived, setArchived] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const all = await listAccounts(true);
      setAccounts(all.filter((a) => !a.archived_at));
      setArchived(all.filter((a) => a.archived_at).length);
    } catch {
      setError(NETWORK_ERROR);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          backLabel="Activity"
          onBack={() => router.back()}
          title="Accounts"
          intro="Each account has its own CSV export. Re-import any time; duplicates are skipped."
        />
        {error ? <ErrorBox message={error} onRetry={load} /> : null}
        {!accounts && !error ? <Loading /> : null}
        {accounts?.map((account) => {
          const fresh = freshness(account.data_through);
          return (
            <Card key={account.id} style={styles.card}>
              <View style={styles.topRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {account.name}
                </Text>
                <Chip label={fresh.label} tone={fresh.fresh ? "positive" : "review"} />
              </View>
              <Body secondary>
                {KIND_LABELS[account.kind]} · {PURPOSE_LABELS[account.purpose]}
              </Body>
              <View style={styles.bottomRow}>
                <Body secondary style={styles.count}>
                  {plural(account.transaction_count, "transaction")}
                  {account.data_through ? ` · through ${formatDay(account.data_through)}` : ""}
                </Body>
                <Button
                  label="Import CSV"
                  variant="outlinePine"
                  onPress={() => router.push(`/activity/import?accountId=${account.id}`)}
                />
              </View>
            </Card>
          );
        })}
        {accounts ? (
          <PressableBox
            onPress={() => router.push("/activity/new-account")}
            accessibilityRole="button"
            accessibilityLabel="Add account"
            style={styles.add}
          >
            <Ionicons name="add" size={22} color={colors.pine} />
            <Text style={styles.addText}>Add account</Text>
          </PressableBox>
        ) : null}
        {accounts ? (
          <View style={styles.footer}>
            {archived > 0 ? <Body secondary style={styles.centerText}>{plural(archived, "archived account")} · history kept</Body> : null}
            <LinkButton label="Download the CSV template" tone="chestnut" underline center onPress={() => openBrowserAsync(templateUrl())} />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.birch },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  card: { padding: 18, gap: 4 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  name: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 19, color: colors.bark },
  bottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 8 },
  count: { flex: 1 },
  add: {
    minHeight: 64,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.moss,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  addText: { fontFamily: fonts.bodySemiBold, fontSize: 17, color: colors.pine },
  footer: { marginTop: 24, alignItems: "center", gap: 2, minHeight: minTouch },
  centerText: { textAlign: "center" },
});
