import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { useRouter } from "expo-router";

export const CategoryTag: React.FC = ({ tag }: { tag: string }) => {
  const router = useRouter();

  const handleNavigate = () => {
    router.push(`/category/new-entry?tag=${encodeURIComponent(tag)}`);
  };

  return (
    <TouchableOpacity onPress={handleNavigate}>
      <View className="bg-white rounded-lg shadow-lg p-4 m-2">
        <Text className="text-xl font-bold">{tag}</Text>
      </View>
    </TouchableOpacity>
  );
};
