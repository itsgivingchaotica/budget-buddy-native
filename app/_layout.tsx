import "../global.css";
import { DefaultTheme, ThemeProvider, type Theme } from "@react-navigation/native";
import { BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold } from "@expo-google-fonts/bricolage-grotesque";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from "@expo-google-fonts/inter";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";

import { colors } from "@/constants/Theme";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// LG1 (new tab layout): Forest Floor navigation colours (D-020). The spec
// defines a light Birch background only, so the app no longer switches to the
// dark navigation theme.
const forestFloor: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.pine,
    background: colors.birch,
    card: colors.card,
    text: colors.bark,
    border: colors.fern,
  },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    // Legacy screens (login) still use SUSE.
    "Suse-Variable": require("../assets/fonts/SUSE-VariableFont_wght.ttf"),
    "Suse-Medium": require("../assets/fonts/SUSE-Medium.ttf"),
    "Suse-Regular": require("../assets/fonts/SUSE-Regular.ttf"),
    "Suse-Bold": require("../assets/fonts/SUSE-Bold.ttf"),
    "Suse-Extra-Bold": require("../assets/fonts/SUSE-ExtraBold.ttf"),
    // New screens: Bricolage Grotesque headings, Inter body (constants/Theme.ts).
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  // LG1: legacy new-budget and category/ screens are no longer routes (see legacy/).
  return (
    <ThemeProvider value={forestFloor}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </ThemeProvider>
  );
}
