import { View, Text } from "react-native";
import React from "react";
import { Stack } from "expo-router";

const CategoryLayout = () => {
  return (
    <Stack
      screenOptions={{
        presentation: "modal",
        headerShown: false, // Hide the header
        headerBackTitle: "Back", // Customize the back button title
        headerBackVisible: true, // Ensure the back button is visible
      }}
    ></Stack>
  );
};

export default CategoryLayout;
