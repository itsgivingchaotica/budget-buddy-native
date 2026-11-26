import { Stack } from "expo-router";
import React from "react";
import { colors } from "@/constants/Theme";

/**
 * LG1: the Activity tab is a stack (accounts, import, transactions, review,
 * transfers), so C2 and C2b push screens on top of the tab root.
 */
export default function ActivityLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.birch } }} />;
}
