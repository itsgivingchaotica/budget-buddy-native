import { ExpoConfig, ConfigContext } from "@expo/config";
import { config } from "dotenv";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  // C9: the name under the icon and in iOS prompts ("Budget Buddy wants to
  // use kinde.com to sign in"). The slug and the Xcode project stay bb-client / bbclient.
  name: "Budget Buddy",
  slug: "bb-client",
  version: "1.0.0",
  orientation: "portrait",
  // C9: the mascot on Pine (no transparency; iOS rounds the corners).
  icon: "./assets/images/app-icon-1024.png",
  scheme: "budget-buddy-scheme",
  userInterfaceStyle: "automatic",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "app.budgetbuddy.mvp.dev",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-font",
    // C9 (SCREENS_WELCOME.md §6): the mascot centred on Birch, about 200 pt
    // wide. Light only (no dark variant), like the rest of the app.
    [
      "expo-splash-screen",
      {
        backgroundColor: "#F6F1E7",
        image: "./assets/images/splash-mascot.png",
        imageWidth: 200,
        resizeMode: "contain",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
});
