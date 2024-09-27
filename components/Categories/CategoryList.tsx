import {
  View,
  Image,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
} from "react-native";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Category } from "@/utils/types";
import { useBudgetStore } from "@/store/budget";
import { useRouter } from "expo-router";
// Define your categories
// export enum Category {
//   EXPENSE = "Expense",
//   INCOME = "Income",
//   SAVINGS_GOALS = "Savings Goals",
//   MISCELLANEOUS = "Miscellaneous",
//   BUDGETING_STRATEGY = "Budgeting Strategy",
// }

export type CategoryListProps = {
  onPress: () => void;
};

export const CategoryList = ({ onPress }: CategoryListProps) => {
  const router = useRouter();
  const { setCategory } = useBudgetStore();
  const handleCategoryPress = (category: Category) => {
    setCategory(category);

    const categoryRoutes = {
      [Category.INCOME]: "/income",
      [Category.EXPENSE]: "/expenses",
      [Category.SAVINGS_GOALS]: "/savings",
      [Category.BUDGETING_STRATEGY]: "/strategy",
    };

    const route = categoryRoutes[category];
    if (route) {
      router.push(route);
    }
  };
  return (
    <ScrollView contentContainerStyle={styles.grid}>
      <TouchableOpacity
        style={styles.container}
        onPress={() => handleCategoryPress(Category.INCOME)}
      >
        <LinearGradient
          colors={["#16a34a", "#22c55e", "#4ade80"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Text
            className="text-white text-lg text-center"
            style={styles.categoryCardText}
          >
            {Category.INCOME}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.container}
        onPress={() => handleCategoryPress(Category.EXPENSE)}
      >
        <LinearGradient
          colors={["#ff3333", "#ff6666", "#ff9999"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Text
            className="text-white text-lg text-center"
            style={styles.categoryCardText}
          >
            {Category.EXPENSE}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => handleCategoryPress(Category.SAVINGS_GOALS)}
        style={styles.container}
      >
        <LinearGradient
          colors={["#3366ff", "#6699ff", "#99ccff"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Text
            className="text-white text-lg text-center"
            style={styles.categoryCardText}
          >
            {Category.SAVINGS_GOALS}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => handleCategoryPress(Category.BUDGETING_STRATEGY)}
        style={styles.container}
      >
        <LinearGradient
          colors={["#800080", "#9932CC", "#DA70D6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Text
            className="text-white text-lg text-center"
            style={styles.categoryCardText}
          >
            {Category.BUDGETING_STRATEGY}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  container: {
    marginTop: 10,
    backgroundColor: "white",
    height: 200,
    borderRadius: 15,
    elevation: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "48%",
  },
  subContainer: {
    marginTop: 2,
    width: 300,
    height: 50,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    width: "100%",
    height: "100%",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryCardText: {
    fontFamily: "Suse-Bold",
  },
});
