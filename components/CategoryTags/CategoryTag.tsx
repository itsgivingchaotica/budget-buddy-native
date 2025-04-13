import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { useRouter } from "expo-router";

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

  console.log(categoryId, " category id");
  console.log(tagId, " the tag id");

  const handleNavigate = () => {
    router.push(
      `/category/new-entry?tagId=${encodeURIComponent(
        tagId
      )}&tagName=${encodeURIComponent(tagName)}`
    );
  };

  return (
    <TouchableOpacity onPress={handleNavigate}>
      <View className="bg-white rounded-lg shadow-lg p-4 m-2">
        <Text className="text-xl font-bold">{tagName}</Text>
      </View>
    </TouchableOpacity>
  );
};
