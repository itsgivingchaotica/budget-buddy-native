import {
  View,
  Image,
  StyleSheet,
  Platform,
  Button,
  TouchableOpacity,
} from "react-native";
import React, { useEffect } from "react";
import { HelloWave } from "@/components/HelloWave";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Link, useRouter } from "expo-router";
import services from "@/utils/services";
import { client } from "@/utils/KindeConfig";

export default function HomeScreen() {
  useEffect(() => {
    checkUserAuth();
  }, []);

  /**
   * Check user authentication if
   * user is authed or not
   */
  const router = useRouter();

  const checkUserAuth = async () => {
    const res = await services.getData("login");
    // const userProfile = await services.getUserDetails();
    // console.log(userProfile);
    if (res !== "true") {
      // Redirect to login screen
      router.push("/login");
    }
  };

  const handleLogout = async () => {
    try {
      const res = await client.logout();
      // console.log(res, " logged out");
      if (res) {
        // Assuming services.removeData is a function to clear session data
        await services.clearAllData();
        router.push("/login");
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/home-screen-design.png")}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        {/* <HelloWave /> */}
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <TouchableOpacity
          className="py-2 px-5 border-[#1E90FF] border-2 rounded-md my-1 items-center"
          onPress={handleLogout}
        >
          <ThemedText type="defaultSemiBold" className="text-[#1E90FF]">
            Logout
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 2: Explore</ThemedText>
        <ThemedText>
          Tap the Explore tab to learn more about what's included in this
          starter app.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
        <ThemedText>
          When you're ready, run{" "}
          <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText>{" "}
          to get a fresh <ThemedText type="defaultSemiBold">app</ThemedText>{" "}
          directory. This will move the current{" "}
          <ThemedText type="defaultSemiBold">app</ThemedText> to{" "}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: "100%",
    width: "100%",
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
