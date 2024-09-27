import { View, Text } from "react-native";
import React from "react";
import { Category, CategoryTags } from "@/utils/types";

export default function SavingsAndGoals() {
  return (
    <View>
      {CategoryTags[Category.SAVINGS_GOALS].map((goal) => (
        <Text key={goal}>{goal}</Text>
      ))}
    </View>
  );
}
