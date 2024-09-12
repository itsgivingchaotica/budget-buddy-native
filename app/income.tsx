import { View, Text } from "react-native";
import React from "react";
import { Category, CategoryTags } from "@/utils/types";

export default function Income() {
  return (
    <View>
      {CategoryTags[Category.INCOME].map((tag) => (
        <Text key={tag}>{tag}</Text>
      ))}
    </View>
  );
}
