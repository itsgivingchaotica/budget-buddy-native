import { View, Text } from "react-native";
import React from "react";
import { Entry } from "@/types"; // adjust if needed

export const EntryPreview: React.FC<Entry> = ({ id, description, amount }) => {
  return (
    <View key={id} className="mb-1 ml-2">
      <Text className="text-gray-700">
        {description} - ${amount}
      </Text>
    </View>
  );
};
