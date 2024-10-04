import { ScrollView, View, Text } from "react-native";
import React from "react";
import { Stack } from "expo-router";
import { useBudgetStore } from "@/store/budget";
import { CategoryTags, Category } from "@/utils/types";
import { CategoryTag } from "@/components/CategoryTags/CategoryTag";

export default function CategoryComponent() {
  const {
    selectedCategory,
    incomeTags,
    expenseTags,
    savingsTags,
    miscTags,
    strategyTags,
  } = useBudgetStore();
  console.log("Current selected category:", selectedCategory);
  console.log(CategoryTags[Category.INCOME], "INCOME TAGS");
  const getTagsForCategory = () => {
    switch (selectedCategory) {
      case Category.INCOME:
        console.log("Income Tags Returned:", incomeTags);
        return incomeTags; // Return income tags
      case Category.EXPENSE:
        console.log("Expense Tags Returned:", expenseTags);
        return expenseTags; // Return expense tags
      case Category.SAVINGS_GOALS:
        console.log("Savings Tags Returned:", savingsTags);
        return savingsTags; // Return savings tags
      case Category.MISCELLANEOUS:
        console.log("Misc Tags Returned:", miscTags);
        return miscTags; // Return miscellaneous tags
      case Category.BUDGETING_STRATEGY:
        console.log("Strategy Tags Returned:", strategyTags);
        return strategyTags; // Return strategy tags
      default:
        console.log("No matching category, returning empty array");
        return []; // Return an empty array if no category matches
    }
  };
  console.log(getTagsForCategory(), " the tags for SELECTED CATEGORY");
  const tagsForSelectedCategory = getTagsForCategory();
  return (
    <ScrollView>
      {tagsForSelectedCategory.map((tag) => {
        console.log("Rendering tag:", tag); // Debugging
        return <CategoryTag key={tag.id} tag={tag.name} />;
      })}
    </ScrollView>
  );
}
