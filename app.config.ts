import { ExpoConfig, ConfigContext } from "@expo/config";
import { config } from "dotenv";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "bb-client",
  slug: "bb-client",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "budget-buddy-scheme",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/images/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: {
    supportsTablet: true,
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
  plugins: ["expo-router", "expo-font"],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    storybookEnabled: process.env.STORYBOOK === "1",
  },
});
