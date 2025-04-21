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

  const getTagsForCategory = () => {
    switch (selectedCategory) {
      case Category.INCOME:
        return incomeTags; // Return income tags
      case Category.EXPENSE:
        return expenseTags; // Return expense tags
      case Category.SAVINGS_GOALS:
        return savingsTags; // Return savings tags
      case Category.MISCELLANEOUS:
        return miscTags; // Return miscellaneous tags
      case Category.BUDGETING_STRATEGY:
        return strategyTags; // Return strategy tags
      default:
        return []; // Return an empty array if no category matches
    }
  };
  const tagsForSelectedCategory = getTagsForCategory();
  return (
    <ScrollView>
      {tagsForSelectedCategory.map((tag) => {
        return (
          <CategoryTag
            key={tag.id}
            tagId={tag.id}
            categoryId={tag.category_id}
            tagName={tag.name}
          />
        );
      })}
    </ScrollView>
  );
}
