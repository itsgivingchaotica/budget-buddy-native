import { View, Text } from "react-native";
import React from "react";
import { Category, CategoryTags } from "@/utils/types";

export default function Expenses() {
  return (
    <View>
      {CategoryTags[Category.EXPENSE].map((expense) => (
        <Text key={expense}>{expense}</Text>
      ))}
    </View>
  );
}
