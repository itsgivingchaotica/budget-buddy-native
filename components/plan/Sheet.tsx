// C8: a plain bottom sheet (Modal), like the account sheet (C9): a title,
// Cancel, and scrollable content. Closes on the scrim, Cancel or back.
import React, { type ReactNode } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, minTouch } from "@/constants/Theme";

export function Sheet({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: 20 + insets.bottom }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            <Pressable onPress={onClose} accessibilityRole="button" hitSlop={12} style={styles.cancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrim: { flex: 1, backgroundColor: "rgba(58,42,30,0.35)" },
  sheet: { backgroundColor: colors.birch, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "88%" },
  handle: { alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: colors.line, marginTop: 8 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 8 },
  title: { flex: 1, fontFamily: fonts.heading, fontSize: 24, color: colors.bark },
  cancel: { minHeight: minTouch, justifyContent: "center", paddingLeft: 12 },
  cancelText: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.pine },
  body: { paddingHorizontal: 20, paddingTop: 8, gap: 14 },
});
