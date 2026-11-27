// C5: "Step N of 4" with a progress bar (and "Question N of M" on step 2),
// plus a "Later" link that leaves onboarding (progress is saved).
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinkButton } from "@/components/brand/ui";
import { colors, fonts } from "@/constants/Theme";

export function StepHeader({ step, question, onLater }: { step: number; question?: { n: number; of: number }; onLater: () => void }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.step}>Step {step} of 4</Text>
        {question ? <Text style={styles.question}>Question {question.n} of {question.of}</Text> : null}
        <LinkButton label="Later" onPress={onLater} />
      </View>
      <View style={styles.bar} accessibilityLabel={`Step ${step} of 4`}>
        <View style={[styles.fill, { width: `${(step / 4) * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  step: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.dayHeader },
  question: { fontFamily: fonts.body, fontSize: 15, color: colors.barkSecondary },
  bar: { height: 6, borderRadius: 3, backgroundColor: colors.fern, overflow: "hidden" },
  fill: { height: 6, borderRadius: 3, backgroundColor: colors.pine },
});
