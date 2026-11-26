import React from "react";
import { Modal, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/brand/ui";
import { colors, fonts } from "@/constants/Theme";

export type LegalKind = "terms" | "privacy";

/** MVP notes (SCREENS_WELCOME.md §4.3); real legal text is v1. */
export const LEGAL_NOTES: Record<LegalKind, { title: string; paragraphs: string[] }> = {
  terms: {
    title: "Terms",
    paragraphs: [
      "Budget Buddy is a portfolio project, not financial advice.",
      "It helps you see and plan your spending from bank exports you choose to upload. Check anything important with your bank.",
    ],
  },
  privacy: {
    title: "Privacy Policy",
    paragraphs: [
      "In development, the app uses fictional demo data.",
      "CSV files you upload are read to add your transactions and are not kept.",
      "Your data is only visible to your account.",
      "Sign-in is handled by Kinde; Budget Buddy never sees your password.",
    ],
  },
};

/** A simple in-app note (Birch, back button), opened from Welcome's legal line. */
export function LegalNote({ kind, onClose }: { kind: LegalKind | null; onClose: () => void }) {
  const note = kind ? LEGAL_NOTES[kind] : null;
  return (
    <Modal visible={!!note} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <ScrollView contentContainerStyle={styles.content}>
          {note ? (
            <>
              <ScreenHeader backLabel="Back" title={note.title} onBack={onClose} />
              {note.paragraphs.map((p) => (
                <Text key={p} style={styles.paragraph}>
                  {p}
                </Text>
              ))}
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.birch },
  content: { padding: 24, gap: 14 },
  paragraph: { fontFamily: fonts.body, fontSize: 17, lineHeight: 25, color: colors.bark },
});
