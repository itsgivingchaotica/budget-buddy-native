import { View, StyleSheet, Text } from "react-native";
import React, { useState } from "react";
import PieChart from "react-native-pie-chart";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFonts } from "expo-font";

const CircularChart = () => {
  const widthAndHeight = 150;
  const [values, setValues] = useState([1]);
  const [sliceColor, setSliceColor] = useState(["#d3d3d3"]);

  return (
    <View style={styles.container}>
      <Text className="text-lg" style={{ fontFamily: "Suse-Medium" }}>
        Total Estimate:{" "}
        <Text style={{ fontFamily: "Suse-Extra-Bold" }}> $0</Text>
      </Text>
      <View style={styles.subContainer}>
        <PieChart
          widthAndHeight={widthAndHeight}
          series={values}
          sliceColor={sliceColor}
          coverRadius={0.65}
          coverFill={"#fff"}
          x-axis={0}
        />
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 5,
            alignItems: "center",
          }}
        >
          <MaterialCommunityIcons
            name="checkbox-blank-circle"
            size={24}
            color="#d3d3d3"
          />
          <Text>N/A</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    backgroundColor: "white",
    padding: 20,
    borderRadius: 15,
    elevation: 1,
  },
  subContainer: {
    marginTop: 10,
    display: "flex",
    flexDirection: "row",
    gap: 40,
  },
});

export default CircularChart;
