import { View, Text, Image, TouchableOpacity } from "react-native";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import React from "react";
import { client } from "@/utils/KindeConfig";
import services from "@/utils/services";
import { useRouter } from "expo-router";

const LoginScreen = () => {
  const router = useRouter();
  const handleSignIn = async () => {
    const token = await client.login();
    if (token) {
      await services.storeData("login", "true");
      router.replace("/(tabs)");
    }
  };
  const handleSignUp = async () => {
    const token = await client.register();
    if (token) {
      await services.storeData("login", "true");
      router.replace("/(tabs)");
    }
  };
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
      <View className="relative h-40">
        <Image
          source={require("@/assets/images/budget-buddy.png")}
          className="absolute w-full h-full"
        />
      </View>
      <ThemedView className="mb-2">
        <TouchableOpacity
          className="bg-[#1E90FF] py-2 px-5 rounded-md my-1 items-center"
          onPress={handleSignIn}
        >
          <ThemedText type="defaultSemiBold" className="text-white">
            Sign In
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity className="py-2 px-5 border-[#1E90FF] border-2 rounded-md my-1 items-center" onPress={handleSignUp}>
          <ThemedText type="defaultSemiBold" className="text-[#1E90FF]">
            Sign Up
          </ThemedText>
        </TouchableOpacity>
        <ThemedText type="default" className="text-xs text-center">
          By logging in or creating an account, you acknowledge and agree to our
          Terms of Service and Privacy Policy, including any applicable
          permissions required by the app.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
};
export default LoginScreen;
