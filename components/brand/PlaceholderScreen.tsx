import React, { type ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fonts, radius } from "@/constants/Theme";

type Props = {
  title: string;
  subtitle: string;
  /** Which task fills this screen, shown as a small note. */
  comingIn: string;
  children?: ReactNode;
};

/** LG1 (new tab layout): Forest Floor placeholder for a tab not built yet. */
export function PlaceholderScreen({ title, subtitle, comingIn, children }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        <View style={styles.card}>
          <Text style={styles.body}>{subtitle}</Text>
          <Text style={styles.note}>{comingIn}</Text>
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.birch },
  content: { padding: 20, gap: 16 },
  title: { fontFamily: fonts.heading, fontSize: 32, color: colors.bark },
  card: { backgroundColor: colors.card, borderRadius: radius.card, padding: 20, gap: 8 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.bark },
  note: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.barkSecondary },
});
