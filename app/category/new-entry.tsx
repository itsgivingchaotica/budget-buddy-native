import {
  Button,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Category } from "@/utils/types";
import { Picker } from "@react-native-picker/picker";
import React, { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import DatePicker from "@/components/DatePicker";
import { useBudgetStore } from "@/store/budget";
import * as Linking from "expo-linking";
import { CategoryIdMap } from "@/utils/types";

export default function CreateNewEntry() {
  const router = useRouter(); // Access the router to navigate
  const { tagId, tagName } = useLocalSearchParams(); // Retrieve the tag from search params
  const [title, setTitle] = useState<string>("");
  const [amount, setAmount] = useState<string>("0.00");
  const [interval, setInterval] = useState<string>("");
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [customIntervalNumber, setCustomIntervalNumber] = useState<number>(1);
  const [customIntervalUnit, setCustomIntervalUnit] = useState<string>("week");
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [futureDate, setFutureDate] = useState<Date | null>(null);
  const { selectedCategory, addEntry } = useBudgetStore();

  const intervalUnits = ["day", "week", "month", "year"];

  const intervals = [
    "Every day",
    "Every week",
    "Every month",
    "Every year",
    "Custom...",
  ];

  const handleClose = (): void => {
    router.back(); // Go back to the previous screen or close the modal
  };

  const handleSave = async () => {
    if (!selectedCategory || !startDate) return;

    const entryData = {
      description: title,
      amount: parseFloat(amount.replace(/[^0-9.-]+/g, "")),
      start_date: startDate,
      frequency: isCustom
        ? `${customIntervalNumber} ${customIntervalUnit}${
            customIntervalNumber > 1 ? "s" : ""
          }`
        : interval,
      custom_frequency_days: isCustom ? customIntervalDays : null,
      frequency_number: isCustom ? customIntervalNumber : 0,
      end_date: futureDate,
    };

    console.log("Selected Category:", selectedCategory);
    console.log("Entry Data:", entryData);
    await addEntry(entryData, tagId); // Assuming index = 0 or pass the correct one

    router.back(); // Navigate back
  };

  const formatAmount = (input: string) => {
    // Remove non-digit characters
    const digits = input.replace(/\D/g, "");
    const padded = digits.padStart(3, "0"); // Ensure at least 3 digits (to handle cents)
    const dollars = padded.slice(0, -2);
    const cents = padded.slice(-2);

    // Add commas for thousands
    const formattedDollars = parseInt(dollars, 10).toLocaleString();
    return `${formattedDollars}.${cents}`;
  };

  const handleAmountChange = (text: string) => {
    const formatted = formatAmount(text);
    setAmount(formatted);
  };

  const handleDone = (): void => {
    if (isCustom) {
      // Proceed to custom interval step
      const customValue = `${customIntervalNumber} ${customIntervalUnit}${
        customIntervalNumber > 1 ? "s" : ""
      }`;
      setInterval(customValue);
    }
    setModalVisible(false); // Close the modal
  };

  const styles = StyleSheet.create({
    label: {
      fontSize: 16,
    },
    input: {
      height: 40,
      margin: 12,
      borderWidth: 1,
      padding: 10,
    },
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
      backgroundColor: "white",
      width: "90%",
      borderRadius: 10,
      padding: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    picker: {
      height: 200,
      width: "100%",
    },
    customPicker: {
      height: 200,
      width: "50%",
    },
    pickerContainer: {
      flexDirection: "row", // Align the two pickers horizontally
      width: "100%",
      justifyContent: "space-between",
    },
    buttonContainer: {
      flexDirection: "row", // Align buttons horizontally
      width: "100%", // Ensure the container takes up the full width
      paddingHorizontal: 10, // Add some padding for spacing
    },
    redButton: {
      backgroundColor: "red", // Red background
      padding: 10,
      borderRadius: 5,
      flex: 1, // Ensure the button takes up half of the container
      marginRight: 5, // Add space between the two buttons
    },
    greenButton: {
      backgroundColor: "green", // Green background
      padding: 10,
      borderRadius: 5,
      flex: 1, // Ensure the button takes up half of the container
      marginLeft: 5, // Add space between the two buttons
    },
    buttonText: {
      color: "white",
      fontSize: 16,
      textAlign: "center", // Center the text inside the button
    },
  });

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Text style={{ fontSize: 24 }}>Add New {tagName}</Text>
        <TextInput
          style={styles.input}
          onChangeText={setTitle}
          value={title}
          placeholder="Title"
        />
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={`$${amount}`}
          onChangeText={handleAmountChange}
          maxLength={10}
        />
        <DatePicker
          selectedDate={startDate}
          onDateSelected={setStartDate}
          label="Select start date"
        />
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text>
            Repeat
            {isCustom
              ? ` Every\n${customIntervalNumber} ${customIntervalUnit}${
                  customIntervalNumber > 1 ? "s" : ""
                }`
              : ` Every\n${interval}`}
          </Text>
        </TouchableOpacity>
        <Text>
          {futureDate ? `Until\n${futureDate.toLocaleDateString()}` : ""}
        </Text>
        <TouchableOpacity>
          <Text>Done</Text>
        </TouchableOpacity>
      </ScrollView>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.redButton]} // Apply red button styles
          onPress={handleClose}
        >
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.greenButton]} // Apply green button styles
          onPress={handleSave}
        >
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Modal for Picker */}
      {/* Modal for Picker */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={{ fontSize: 20, marginBottom: 20 }}>
              Select Interval
            </Text>
            {interval === "Custom..." ? (
              // If "Custom..." is selected, show the second picker for custom intervals
              <>
                <Text style={{ fontSize: 16 }}>Select Custom Interval</Text>
                <View style={styles.pickerContainer}>
                  {/* Picker for number */}
                  <Picker
                    selectedValue={customIntervalNumber}
                    onValueChange={(itemValue) =>
                      setCustomIntervalNumber(itemValue)
                    }
                    style={styles.customPicker}
                  >
                    {[...Array(99).keys()].map((i) => (
                      <Picker.Item
                        key={i + 1}
                        label={(i + 1).toString()}
                        value={i + 1}
                      />
                    ))}
                  </Picker>

                  {/* Picker for unit */}
                  <Picker
                    selectedValue={customIntervalUnit}
                    onValueChange={(itemValue) =>
                      setCustomIntervalUnit(itemValue)
                    }
                    style={styles.customPicker}
                  >
                    {intervalUnits.map((unit) => (
                      <Picker.Item key={unit} label={unit} value={unit} />
                    ))}
                  </Picker>
                </View>
              </>
            ) : (
              // Otherwise show the standard intervals picker
              <Picker
                selectedValue={interval}
                onValueChange={(itemValue) => {
                  setInterval(itemValue); // <- Always set this
                  setIsCustom(itemValue === "Custom...");
                }}
                style={styles.picker}
              >
                {intervals.map((item) => (
                  <Picker.Item key={item} label={item} value={item} />
                ))}
              </Picker>
            )}
            <Text style={{ fontSize: 16 }}>Until:</Text>
            <DatePicker
              selectedDate={futureDate}
              onDateSelected={setFutureDate}
              label="Select end date"
            />
            <Button title="Done" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}
