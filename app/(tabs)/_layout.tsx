import { Tabs } from "expo-router";
import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, fonts } from "@/constants/Theme";
import { useSessionBootstrap } from "@/hooks/useSession";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function icon(active: IconName, inactive: IconName) {
  return function TabIcon({ color, focused }: { color: string; focused: boolean }) {
    return <Ionicons name={focused ? active : inactive} size={24} color={color} />;
  };
}

/**
 * LG1 (new tab layout, D-019): Home, Plan, Activity, Coach. The legacy
 * Budget/Categories tabs and the category/ stack live in legacy/ and are no
 * longer reachable.
 */
export default function TabLayout() {
  // Signed-out users go to /login; signed-in users always refresh /me.
  useSessionBootstrap();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.pine,
        tabBarInactiveTintColor: colors.barkSecondary,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.fern },
        tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 12 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: icon("home", "home-outline") }} />
      <Tabs.Screen name="plan" options={{ title: "Plan", tabBarIcon: icon("map", "map-outline") }} />
      <Tabs.Screen name="activity" options={{ title: "Activity", tabBarIcon: icon("list", "list-outline") }} />
      <Tabs.Screen
        name="coach"
        options={{ title: "Coach", tabBarIcon: icon("chatbubble-ellipses", "chatbubble-ellipses-outline") }}
      />
    </Tabs>
  );
}
