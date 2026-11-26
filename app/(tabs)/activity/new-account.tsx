import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Body, Button, Chip, ErrorBox, FormHeader, LinkButton } from "@/components/brand/ui";
import { colors, fonts, minTouch, radius } from "@/constants/Theme";
import { apiError, createAccount, type AccountKind, type AccountPurpose } from "@/utils/activityApi";
import { KIND_LABELS, KINDS, PURPOSE_LABELS, PURPOSES } from "@/utils/accountLabels";

/** C2: Add account (bb-server/docs/product/SCREENS_ACTIVITY.md §3). */
export default function NewAccountScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<AccountKind | null>(null);
  const [purpose, setPurpose] = useState<AccountPurpose | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<"import" | "plain" | null>(null);

  const save = async (thenImport: boolean) => {
    const missing: Record<string, string> = {};
    if (!name.trim()) missing.name = "Give the account a name.";
    if (!kind) missing.kind = "Choose a type.";
    if (!purpose) missing.purpose = "Choose what you mostly use it for.";
    setFieldErrors(missing);
    setError(null);
    if (Object.keys(missing).length) return;

    setSaving(thenImport ? "import" : "plain");
    try {
      const account = await createAccount({ name: name.trim(), kind: kind!, purpose: purpose! });
      if (thenImport) router.replace(`/activity/import?accountId=${account.id}`);
      else router.back();
    } catch (e) {
      const { status, fields } = apiError(e);
      if (status === 422 && fields) {
        // The server's own message, inline (e.g. "Name has already been taken").
        setFieldErrors(Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, `${capitalize(k)} ${v[0]}.`])));
      } else {
        setError("Couldn't save the account. Check your connection and try again.");
      }
    } finally {
      setSaving(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FormHeader title="Add account" onCancel={() => router.back()} />

        <View style={styles.field}>
          <Text style={styles.label} nativeID="nameLabel">
            Name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Chase checking"
            placeholderTextColor={colors.barkSecondary}
            accessibilityLabelledBy="nameLabel"
            accessibilityLabel="Name"
            maxLength={60}
            style={[styles.input, fieldErrors.name && styles.inputError]}
          />
          {fieldErrors.name ? (
            <Text style={styles.error}>{fieldErrors.name}</Text>
          ) : (
            <Body secondary>Something you'll recognise, like "Chase checking".</Body>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Type</Text>
          <View style={styles.chips}>
            {KINDS.map((k) => (
              <Chip size="large" key={k} label={KIND_LABELS[k]} selected={kind === k} onPress={() => setKind(k)} />
            ))}
          </View>
          {fieldErrors.kind ? <Text style={styles.error}>{fieldErrors.kind}</Text> : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>What do you mostly use it for?</Text>
          <Body secondary>Your coach uses this to understand your money, for example to recognise side-job income.</Body>
          <View style={styles.chips}>
            {PURPOSES.map((p) => (
              <Chip size="large" key={p} label={PURPOSE_LABELS[p]} selected={purpose === p} onPress={() => setPurpose(p)} />
            ))}
          </View>
          {fieldErrors.purpose ? <Text style={styles.error}>{fieldErrors.purpose}</Text> : null}
        </View>

        {error ? <ErrorBox message={error} /> : null}
        <View style={styles.spacer} />
        <Button label="Save and import CSV" onPress={() => save(true)} busy={saving === "import"} disabled={!!saving} />
        <LinkButton
          label={saving === "plain" ? "Saving…" : "Save without importing"}
          tone="chestnut"
          underline
          center
          onPress={() => (saving ? undefined : save(false))}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.birch },
  content: { padding: 20, gap: 18, paddingBottom: 32, flexGrow: 1 },
  spacer: { flexGrow: 1, minHeight: 16 },
  field: { gap: 6 },
  label: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.bark },
  input: {
    minHeight: 52,
    backgroundColor: colors.white,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.bark,
  },
  inputError: { borderColor: colors.ember },
  error: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ember },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
