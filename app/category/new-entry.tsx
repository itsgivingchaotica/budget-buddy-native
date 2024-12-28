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
import { Picker } from "@react-native-picker/picker";
import React, { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function CreateNewEntry() {
  const router = useRouter(); // Access the router to navigate
  const { tag } = useLocalSearchParams(); // Retrieve the tag from search params
  const [title, setTitle] = useState<string>("");
  const [amount, setAmount] = useState<string>("0.00");
  const [interval, setInterval] = useState<string>("Weekly");
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [customIntervalNumber, setCustomIntervalNumber] = useState<number>(1);
  const [customIntervalUnit, setCustomIntervalUnit] = useState<string>("week");

  const intervalUnits = ["day", "week", "month", "year"];

  const intervals = [
    "Every day",
    "Every week",
    "Every month",
    "Every year",
    "Custom...",
  ];

  const handleClose = () => {
    router.back(); // Go back to the previous screen or close the modal
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

  const handleDone = () => {
    if (interval === "Custom...") {
      // Proceed to custom interval step
      setInterval(
        `${customIntervalNumber} ${customIntervalUnit}${
          customIntervalNumber > 1 ? "s" : ""
        }`
      );
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
        <Text style={{ fontSize: 24 }}>Add New {tag}</Text>
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

        <Text style={styles.label}>Repeat Every</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text style={styles.intervalText}>{interval}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Button title="Close" onPress={handleClose} />

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
                onValueChange={(itemValue) => setInterval(itemValue)}
                style={styles.picker}
              >
                {intervals.map((item) => (
                  <Picker.Item key={item} label={item} value={item} />
                ))}
              </Picker>
            )}
            <Button title="Done" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}
