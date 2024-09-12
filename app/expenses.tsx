import { View, Text } from "react-native";
import React from "react";
import { Category, CategoryTags } from "@/utils/types";

export default function Expenses() {
  return (
    <View>
      {CategoryTags[Category.EXPENSE].map((tag) => (
        <Text key={tag}>{tag}</Text>
      ))}
    </View>
  );
}
