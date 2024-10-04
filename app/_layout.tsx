import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { useBudgetStore } from "@/store/budget";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({
    "Suse-Variable": require("../assets/fonts/SUSE-VariableFont_wght.ttf"),
    "Suse-Medium": require("../assets/fonts/SUSE-Medium.ttf"),
    "Suse-Regular": require("../assets/fonts/SUSE-Regular.ttf"),
    "Suse-Bold": require("../assets/fonts/SUSE-Bold.ttf"),
    "Suse-Extra-Bold": require("../assets/fonts/SUSE-ExtraBold.ttf"),
  });
  const { selectedCategory, currentBudget } = useBudgetStore();

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen
          name="new-budget"
          options={{
            headerShown: true,
            headerTitle: currentBudget?.name || "New Budget",
            headerBackTitle: "Back",
            headerBackVisible: true,
          }}
        />
        <Stack.Screen
          name="category"
          options={{
            headerShown: true,
            headerTitle: selectedCategory?.toUpperCase(),
            // presentation: "modal",
            // headerShwn: true,
            // headerTitle: "Expenses",
            headerBackTitle: "Categories",
          }}
        />
        {/* <Stack.Screen
          name="income"
          options={{
            presentation: "modal",
            headerShwn: true,
            headerTitle: "Income",
          }}
        />
        <Stack.Screen
          name="savings"
          options={{
            presentation: "modal",
            headerShwn: true,
            headerTitle: "Savings & Goals",
          }}
        />
        <Stack.Screen
          name="strategy"
          options={{
            presentation: "modal",
            headerShwn: true,
            headerTitle: "Budgeting Strategy",
          }}
        /> */}
        {/* <Stack.Screen
          name="new-entry"
          options={{
            presentation: "modal",
            headerShwn: true,
            headerTitle: "New Entry",
          }}
        /> */}
        <Stack.Screen name="+not-found" />
      </Stack>
    </ThemeProvider>
  );
}
