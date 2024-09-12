import { View, Image, StyleSheet, Text } from "react-native";
import React from "react";

const GetStarted = () => {
  return (
    <View style={styles.container}>
      <Text>Create a new budget to get started!</Text>
      <View style={styles.subContainer}>
        <Image
          source={require("@/assets/images/squirrelbuddy.png")}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    backgroundColor: "white",
    padding: 50,
    borderRadius: 15,
    elevation: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  subContainer: {
    marginTop: 10,
    width: 100,
    height: 100,
  },
  image: {
    width: "100%",
    height: "100%",
  },
});

export default GetStarted;
