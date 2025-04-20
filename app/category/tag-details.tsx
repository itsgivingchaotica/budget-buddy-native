import { useLocalSearchParams } from "expo-router";
import { ScrollView, View, Text } from "react-native";
import React from "react";
import { useBudgetStore } from "@/store/budget";
import { EntryDetails } from "@/components/Entries/EntryDetails";

export default function TagDetailsScreen() {
  const { tagId, tagName, categoryId } = useLocalSearchParams<{
    tagId: string;
    tagName: string;
    categoryId: string;
  }>();

  const categoryEntries = useBudgetStore((state) => state.entries);
  const category = useBudgetStore((state) => state.selectedCategory);
  const entries: Entry[] = categoryEntries?.[category] || [];

  const filteredEntries = entries.filter(
    (entry) => entry.categoryTag?.id === Number(tagId)
  );

  return (
    <ScrollView className="p-4">
      <Text className="text-2xl font-bold mb-4">Entries for: {tagName}</Text>
      {filteredEntries.length > 0 ? (
        filteredEntries.map((entry) => (
          <EntryDetails key={entry.id} {...entry} />
        ))
      ) : (
        <Text className="text-gray-500">No entries for this tag.</Text>
      )}
    </ScrollView>
  );
}
