import { View, Text } from "react-native";
import React from "react";
import { Entry } from "@/types";

export const EntryDetails: React.FC<Entry> = ({
  id,
  description,
  amount,
  start_date,
  end_date,
  frequency,
  frequency_number,
  category,
  categoryTag,
  budget_id,
}) => {
  return (
    <View key={id} className="mb-2">
      <Text className="text-lg font-semibold">{description}</Text>
      <Text>Amount: ${amount}</Text>
      <Text>Start Date: {start_date}</Text>
      <Text>End Date: {end_date}</Text>
      <Text>
        Frequency: {frequency} ({frequency_number} days)
      </Text>
      <Text>Budget ID: {budget_id}</Text>
      <Text>Category: {category?.name ?? "None"}</Text>
      <Text>Tag: {categoryTag?.name ?? "None"}</Text>
    </View>
  );
};
