import {
  View,
  Text,
  Button,
  TextInput,
  Touchable,
  TouchableOpacity,
} from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { Category } from "@/utils/types";
import { CategoryList } from "@/components/Categories/CategoryList";
import { useBudgetStore } from "@/store/budget";

export default function CreateNewBudget() {
  const { selectedCategory, createNewBudget } = useBudgetStore();
  const [budgetName, setBudgetName] = useState("");
  const [expenses, setExpenses] = useState();
  const [income, setIncome] = useState();
  const [savingsGoals, setSavingsGoals] = useState();
  const [strategy, setStrategy] = useState();

  const handleBack = () => {
    router.back();
    setCategory(null);
  };

  const handleSubmit = async () => {
    try {
      //   const response = await axios.post("/api/budget", {
      //     name: budgetName,
      //     category: selectedCategory,
      //USE ZUSTAND
      //   console.log("Budget created successfully:", response.data);
    } catch (error) {
      console.error("Error creating budget:", error);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        padding: 10,
        marginTop: 5,
        backgroundColor: "#f0f0f0",
      }}
    >
      {selectedCategory && <Button title="Back" onPress={handleBack} />}
      <TextInput
        value={budgetName}
        onChangeText={setBudgetName}
        placeholder="Budget Name"
        style={{
          borderWidth: 1,
          padding: 10,
          borderRadius: 10,
          borderColor: "gray",
          backgroundColor: "white",
          width: "100%",
        }}
      />
      <CategoryList />
      <TouchableOpacity>
        <Text>Finish</Text>
      </TouchableOpacity>
    </View>
  );
}
