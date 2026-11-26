import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { openBrowserAsync } from "expo-web-browser";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Body, Button, Card, Chip, ErrorBox, LinkButton, Loading, NETWORK_ERROR, NumberTile, ScreenHeader } from "@/components/brand/ui";
import { colors, fonts } from "@/constants/Theme";
import {
  apiError,
  categorizeUntilDone,
  countTransactions,
  importCsv,
  listAccounts,
  templateUrl,
  type Account,
  type CsvFile,
  type ImportResult,
} from "@/utils/activityApi";
import { formatCount, formatDayLong, plural } from "@/utils/format";
import { fileErrorMessage, importFigures, rowErrorMessage, type ImportFigures } from "@/utils/importMessages";

type Phase =
  | { step: "choose" }
  | { step: "uploading" }
  | { step: "categorizing" }
  | { step: "done"; result: ImportResult; figures: ImportFigures }
  | { step: "fileError"; message: string };

/** C2: Import and result (bb-server/docs/product/SCREENS_ACTIVITY.md §4, screens/Activity-Import.png). */
export default function ImportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ accountId?: string }>();
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [accountId, setAccountId] = useState<number | null>(params.accountId ? Number(params.accountId) : null);
  const [changingAccount, setChangingAccount] = useState(!params.accountId);
  const [file, setFile] = useState<CsvFile | null>(null);
  const [phase, setPhase] = useState<Phase>({ step: "choose" });
  const [error, setError] = useState<string | null>(null);
  const [showRows, setShowRows] = useState(false);

  const loadAccounts = useCallback(async () => {
    setError(null);
    try {
      const list = await listAccounts();
      if (list.length === 0) {
        // No account yet: add one first ("Save and import CSV" comes back here).
        router.replace("/activity/new-account");
        return;
      }
      setAccounts(list);
      if (list.length === 1 && !accountId) {
        setAccountId(list[0].id);
        setChangingAccount(false);
      }
    } catch {
      setError(NETWORK_ERROR);
    }
  }, [accountId, router]);

  useEffect(() => {
    loadAccounts();
    // Only on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const account = accounts?.find((a) => a.id === accountId) ?? null;
  const busy = phase.step === "uploading" || phase.step === "categorizing";

  // PO, 2026-11-25: choosing a file never uploads it. Imports can't be undone
  // in the MVP, so the user checks the account and file, then taps Import.
  const chooseFile = async () => {
    const picked = await DocumentPicker.getDocumentAsync({
      type: ["text/csv", "text/comma-separated-values", "public.comma-separated-values-text"],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (picked.canceled || !picked.assets?.[0]) return;
    const asset = picked.assets[0];
    setFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType });
    setShowRows(false);
    setPhase({ step: "choose" });
  };

  const changeAccount = () => {
    setChangingAccount(true);
    if (phase.step !== "choose") setPhase({ step: "choose" });
  };

  const upload = async (target: Account, csv: CsvFile) => {
    setError(null);
    setPhase({ step: "uploading" });
    let result: ImportResult;
    try {
      result = await importCsv(target.id, csv);
    } catch (e) {
      const { status, code, message } = apiError(e);
      if (status === 422) setPhase({ step: "fileError", message: fileErrorMessage(code, message) });
      else {
        setPhase({ step: "choose" });
        setError("Couldn't upload the file. Check your connection and try again.");
      }
      return;
    }

    // Let the server finish categorizing (AI2), then count this import's rows
    // still waiting for review. A limit (S4-min) never fails the import.
    setPhase({ step: "categorizing" });
    let stillWaiting = result.categorized?.remaining ?? 0;
    try {
      stillWaiting = (await categorizeUntilDone(stillWaiting)).remaining;
    } catch {
      // Categorization can run again later.
    }
    let toReview = result.categorized?.needs_review ?? 0;
    try {
      toReview = await countTransactions({ import_id: result.id, needs_review: true });
    } catch {
      // Keep the import response's count.
    }
    setPhase({ step: "done", result, figures: importFigures(result, toReview, stillWaiting) });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader backLabel="Activity" onBack={() => router.back()} title="Import" />
        {error ? <ErrorBox message={error} onRetry={accounts ? undefined : loadAccounts} /> : null}

        <Card style={styles.pickCard}>
          <View style={styles.pickRow}>
            <View style={styles.pickText}>
              <Text style={styles.small}>Account</Text>
              {account ? <Text style={styles.value}>{account.name}</Text> : <Body secondary>Choose an account</Body>}
            </View>
            {account && !changingAccount ? (
              <Button label="Change" variant="outline" onPress={changeAccount} disabled={busy} />
            ) : null}
          </View>
          {!accounts && !error ? <Loading /> : null}
          {accounts && accounts.length === 0 ? (
            <Button label="Add account" onPress={() => router.replace("/activity/new-account")} />
          ) : null}
          {accounts && accounts.length > 0 && changingAccount ? (
            <View style={styles.chips}>
              {accounts.map((a) => (
                <Chip
                  size="large"
                  key={a.id}
                  label={a.name}
                  selected={a.id === accountId}
                  onPress={() => {
                    setAccountId(a.id);
                    setChangingAccount(false);
                  }}
                />
              ))}
            </View>
          ) : null}
          <View style={styles.divider} />
          <View style={styles.pickRow}>
            <View style={styles.pickText}>
              <Text style={styles.small}>File</Text>
              {file ? (
                <Text style={styles.value} numberOfLines={1}>
                  {file.name}
                </Text>
              ) : (
                <Body secondary>A CSV with date, description and amount</Body>
              )}
            </View>
            <Button label={file ? "Change" : "Choose file"} variant="outline" onPress={chooseFile} disabled={busy} />
          </View>
        </Card>

        {phase.step === "choose" || phase.step === "fileError" ? (
          <LinkButton label="Download the CSV template" tone="chestnut" underline onPress={() => openBrowserAsync(templateUrl())} />
        ) : null}

        {phase.step === "fileError" ? <ErrorBox message={phase.message} /> : null}

        {phase.step === "choose" && account && file && !changingAccount ? (
          <Button
            label="Import"
            onPress={() => upload(account, file)}
            accessibilityHint={`Imports ${file.name} into ${account.name}`}
          />
        ) : null}

        {busy ? (
          <Card>
            <Loading />
            <Body style={styles.centerText}>
              {phase.step === "uploading" ? "Uploading and checking for duplicates…" : "Sorting your transactions into categories…"}
            </Body>
          </Card>
        ) : null}

        {phase.step === "done" ? (
          <ResultCard figures={phase.figures} result={phase.result} showRows={showRows} onToggleRows={() => setShowRows(!showRows)} />
        ) : null}

        <View style={styles.spacer} />
        {phase.step === "done" && phase.figures.toReview > 0 ? (
          <Button label={`Review ${formatCount(phase.figures.toReview)} now`} onPress={() => router.replace("/activity/review")} />
        ) : null}
        {phase.step === "done" ? (
          <LinkButton label="Done for now" tone="chestnut" underline center onPress={() => router.back()} />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ResultCard({
  figures,
  result,
  showRows,
  onToggleRows,
}: {
  figures: ImportFigures;
  result: ImportResult;
  showRows: boolean;
  onToggleRows: () => void;
}) {
  return (
    <Card style={styles.resultCard}>
      <View style={styles.resultHead}>
        <View style={styles.check}>
          <Ionicons name="checkmark" size={24} color={colors.pine} />
        </View>
        <View style={styles.pickText}>
          <Text style={styles.big}>{plural(figures.added, "transaction")} added</Text>
          <Body secondary>
            {figures.range ? `${formatDayLong(figures.range.from)} – ${formatDayLong(figures.range.through)} · ` : ""}file not kept
          </Body>
        </View>
      </View>
      <View style={styles.tiles}>
        <NumberTile value={formatCount(figures.categorizedAutomatically)} label="categorized automatically" />
        <NumberTile value={formatCount(figures.toReview)} label="to review" tone={figures.toReview > 0 ? "review" : "neutral"} />
      </View>
      <View style={styles.tiles}>
        <NumberTile value={formatCount(figures.duplicates)} label="duplicates skipped" />
        <NumberTile value={formatCount(figures.unreadable)} label="rows couldn't be read" />
      </View>
      {figures.unreadable > 0 ? (
        <>
          <LinkButton label={showRows ? "Hide the rows" : `Show the ${plural(figures.unreadable, "row")}`} onPress={onToggleRows} />
          {showRows ? result.row_errors.map((e) => <Body key={`${e.line}-${e.code}`}>{rowErrorMessage(e)}</Body>) : null}
        </>
      ) : null}
      {figures.laterNote ? <Body secondary>Some transactions will be categorized later.</Body> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.birch },
  content: { padding: 20, gap: 14, paddingBottom: 32, flexGrow: 1 },
  pickCard: { padding: 18, gap: 12 },
  pickRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  pickText: { flex: 1, gap: 2 },
  small: { fontFamily: fonts.body, fontSize: 14, color: colors.barkSecondary },
  value: { fontFamily: fonts.bodySemiBold, fontSize: 18, color: colors.bark },
  divider: { height: 1, backgroundColor: colors.line },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  centerText: { textAlign: "center" },
  resultCard: { padding: 18, gap: 12 },
  resultHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  check: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.fern, alignItems: "center", justifyContent: "center" },
  big: { fontFamily: fonts.heading, fontSize: 22, color: colors.bark },
  tiles: { flexDirection: "row", gap: 12 },
  spacer: { flexGrow: 1, minHeight: 8 },
});
