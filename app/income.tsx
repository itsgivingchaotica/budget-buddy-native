import { View } from "react-native";
import React from "react";
import { Category, CategoryTags } from "@/utils/types";
import { CategoryTag } from "@/components/CategoryTags/CategoryTag";

export default function Income() {
  return (
    <View>
      {CategoryTags[Category.INCOME].map((income) => {
        console.log(income); // Log the income value
        return <CategoryTag key={income} tag={income} />;
      })}
    </View>
  );
}
