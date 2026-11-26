import React from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Body, Card, ScreenHeader } from "@/components/brand/ui";
import { colors } from "@/constants/Theme";

/** C2: placeholder until C2b builds Review (docs/product/SCREENS_ACTIVITY.md §5). */
export default function ReviewScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.content}>
        <ScreenHeader backLabel="Activity" title="To review" onBack={() => router.back()} />
        <Card>
          <Body>Reviewing categories one merchant at a time is coming next (C2b).</Body>
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.birch },
  content: { padding: 20, gap: 12 },
});
