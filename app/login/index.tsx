import { View, Text, Image, TouchableOpacity } from "react-native";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import React from "react";

const LoginScreen = () => {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/home-screen-design.png")}
          className="h-full w-full absolute bottom-0 left-0"
        />
      }
    >
      <ThemedView className="flex-row items-center gap-2 flex justify-center">
        <ThemedText type="title">Welcome!</ThemedText>
        {/* <HelloWave /> */}
      </ThemedView>
      <ThemedView className="gap-2 mb-2">
        <ThemedText className="text-center">
          The no-frills, no-fuss way to take control of your finances. Simple,
          personal, and powerful budgeting right in your pocket.
          {/* <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText>{" "}
          to see changes. Press{" "} */}
          <ThemedText type="defaultSemiBold">
            {/* {Platform.select({ ios: "cmd + d", android: "cmd + m" })} */}
          </ThemedText>{" "}
        </ThemedText>
        <TouchableOpacity className="bg-[#1E90FF] py-2 px-5 rounded-md my-1 items-center">
          <Text className="text-white font-bold">Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity className="py-2 px-5 border-[#1E90FF] border-2 rounded-md my-1 items-center">
          <Text className="text-[#1E90FF] font-bold">Sign Up</Text>
        </TouchableOpacity>
      </ThemedView>
    </ParallaxScrollView>
  );
};
export default LoginScreen;
