import { View, Text } from "react-native";
import React from "react";
import { Category, CategoryTags } from "@/utils/types";

export default function BudgetingStrategy() {
  return (
    <View>
      {CategoryTags[Category.BUDGETING_STRATEGY].map((tag) => (
        <Text key={tag}>{tag}</Text>
      ))}
    </View>
  );
}
