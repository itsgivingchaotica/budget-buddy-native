import { View, Text, Button } from "react-native";
import React from "react";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function CreateNewEntry() {
  const router = useRouter(); // Access the router to navigate
  const { tag } = useLocalSearchParams(); // Retrieve the tag from search params

  const handleClose = () => {
    router.back(); // Go back to the previous screen or close the modal
  };

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <Text style={{ fontSize: 24 }}>{tag}</Text>
      <Button title="Close" onPress={handleClose} />
    </View>
  );
}
