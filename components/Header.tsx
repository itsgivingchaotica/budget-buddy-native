import { View, Image, StyleSheet, Text } from "react-native";
import React, { useEffect, useState } from "react";
import { client } from "@/utils/KindeConfig";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ThemedView } from "./ThemedView";
import { useBudgetStore } from "@/store/budget";

const Header = () => {
  const { user, fetchUserData } = useBudgetStore();

  useEffect(() => {
    // Call fetchUserData when the component mounts
    const fetchData = async () => {
      await fetchUserData();
    };
    fetchData();
  }, [fetchUserData]);

  return (
    <View
      style={{
        display: "flex",
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
      }}
    >
      <Image
        source={{
          uri: user?.picture,
        }}
        style={styles.avatar}
      />
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: "85%",
        }}
      >
        <View>
          <Text className="text-white" style={{ fontFamily: "Suse-Regular" }}>
            Welcome,
          </Text>
          <Text
            className="text-white text-lg"
            style={{ fontFamily: "Suse-Bold" }}
          >
            {user?.given_name}
          </Text>
        </View>
        <View className="p-4">
          <MaterialIcons name="notifications" size={24} color="white" />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    top: 0,
    left: 0,
    width: 60,
    height: 60,
    borderRadius: 99, // Half of width/height for rounded-full
  },
});

export default Header;
