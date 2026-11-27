// C5 step 1 (SPEC_ONBOARDING_PLAN §3, screens/Onboard-1-Accounts.png): the
// existing Activity flow inside onboarding. Each account with its import
// state; Upload CSV and Add another account open the Activity screens;
// Continue once at least one import has brought rows in.
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { openBrowserAsync } from "expo-web-browser";
import { Button, LinkButton, PressableBox } from "@/components/brand/ui";
import { colors, fonts, radius } from "@/constants/Theme";
import { PURPOSE_LABELS } from "@/utils/accountLabels";
import { templateUrl, type Account } from "@/utils/activityApi";
import { plural } from "@/utils/format";

export function AccountsStep({
  accounts,
  canContinue,
  busy,
  onUpload,
  onAddAccount,
  onContinue,
}: {
  accounts: Account[];
  canContinue: boolean;
  busy: boolean;
  onUpload: (account: Account) => void;
  onAddAccount: () => void;
  onContinue: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title} accessibilityRole="header">
        Bring in your money history
      </Text>
      <Text style={styles.intro}>Add each account and upload a CSV export. Duplicates are skipped and the file isn&apos;t kept.</Text>
      {accounts.map((a) => {
        const imported = a.transaction_count > 0;
        return (
          <View key={a.id} style={[styles.card, !imported && styles.pending]}>
            <View style={styles.row}>
              <View style={[styles.icon, { backgroundColor: imported ? colors.fern : colors.tile }]}>
                <Ionicons name={a.purpose === "savings" ? "leaf-outline" : a.purpose === "side_income" ? "swap-horizontal" : "home-outline"} size={22} color={imported ? colors.pine : colors.chestnut} />
              </View>
              <View style={styles.text}>
                <Text style={styles.name}>{a.name}</Text>
                <Text style={styles.sub}>
                  {PURPOSE_LABELS[a.purpose]} · {imported ? plural(a.transaction_count, "transaction") : "no file yet"}
                </Text>
              </View>
              {imported ? (
                <View style={styles.done}>
                  <Ionicons name="checkmark" size={18} color={colors.pine} />
                  <Text style={styles.doneText}>Imported</Text>
                </View>
              ) : null}
            </View>
            {!imported ? <Button label="Upload CSV" icon="cloud-upload-outline" variant="secondary" onPress={() => onUpload(a)} /> : null}
          </View>
        );
      })}
      <PressableBox onPress={onAddAccount} accessibilityRole="button" accessibilityLabel="Add another account" style={styles.add}>
        <Ionicons name="add" size={20} color={colors.pine} />
        <Text style={styles.addText}>{accounts.length ? "Add another account" : "Add an account"}</Text>
      </PressableBox>
      <LinkButton label="Download the CSV template" tone="chestnut" underline center onPress={() => openBrowserAsync(templateUrl())} />
      <Button label="Continue" onPress={onContinue} disabled={!canContinue || busy} busy={busy} />
      {!canContinue ? <Text style={styles.hint}>Import at least one account to continue.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  title: { fontFamily: fonts.heading, fontSize: 32, lineHeight: 38, color: colors.bark },
  intro: { fontFamily: fonts.body, fontSize: 16, lineHeight: 23, color: colors.barkSecondary },
  card: { backgroundColor: colors.card, borderRadius: radius.card, padding: 16, gap: 14 },
  pending: { borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.moss },
  row: { flexDirection: "row", alignItems: "center", gap: 14 },
  icon: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  text: { flex: 1, gap: 2 },
  name: { fontFamily: fonts.bodySemiBold, fontSize: 18, color: colors.bark },
  sub: { fontFamily: fonts.body, fontSize: 15, color: colors.barkSecondary },
  done: { flexDirection: "row", alignItems: "center", gap: 4 },
  doneText: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.pine },
  add: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 48 },
  addText: { fontFamily: fonts.bodySemiBold, fontSize: 17, color: colors.pine },
  hint: { fontFamily: fonts.body, fontSize: 14, color: colors.barkSecondary, textAlign: "center" },
});
