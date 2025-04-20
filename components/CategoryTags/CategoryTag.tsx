import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { useRouter } from "expo-router";
import { useBudgetStore } from "@/store/budget";
import { EntryPreview } from "../Entries/EntryPreview";

export const CategoryTag: React.FC = ({
  tagId,
  tagName,
  categoryId,
}: {
  tagId: number;
  tagName: string;
  categoryId: number;
}) => {
  const router = useRouter();
  const categoryEntries = useBudgetStore((state) => state.entries);
  const category = useBudgetStore((state) => state.selectedCategory);
  const entries: Entry[] = categoryEntries?.[category] || [];
  const filteredEntries = entries.filter(
    (entry) => entry.categoryTag?.id === tagId
  );

  const handleNavigate = () => {
    router.push(
      `/category/new-entry?tagId=${encodeURIComponent(
        tagId
      )}&tagName=${encodeURIComponent(tagName)}`
    );
  };

  const handleViewDetails = () => {
    router.push(
      `/category/tag-details?tagId=${tagId}&tagName=${encodeURIComponent(
        tagName
      )}&categoryId=${categoryId}`
    );
  };

  return (
    <View className="bg-white rounded-lg shadow-lg p-4 m-2">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-xl font-bold">{tagName}</Text>

        <View className="space-y-2">
          <TouchableOpacity
            onPress={handleNavigate}
            className="bg-blue-500 px-3 py-1 rounded-lg"
          >
            <Text className="text-white font-semibold text-sm">
              + Add Entry
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleViewDetails}
            className="bg-green-500 px-3 py-1 rounded-lg"
          >
            <Text className="text-white font-semibold text-sm">
              View Details
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Entry Previews */}
      <View>
        {filteredEntries.map((entry) => (
          <EntryPreview key={entry.id} {...entry} />
        ))}
      </View>
    </View>
  );
};
