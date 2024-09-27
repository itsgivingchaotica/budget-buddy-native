import { View } from "react-native";
import type { Meta, StoryObj } from "@storybook/react";
import { CategoryList } from "./CategoryList";

const CategoryListMeta: Meta<typeof CategoryList> = {
  title: "Components/CategoryList",
  component: CategoryList,
  decorators: [
    (Story) => (
      <View style={{ alignItems: "center", justifyContent: "center", flex: 1 }}>
        <Story />
      </View>
    ),
  ],
};

export default CategoryListMeta;

export const Default: StoryObj<typeof CategoryList> = {};

export const WithDifferentCategories: StoryObj<typeof CategoryList> = {
  args: {
    // You can add any specific props you want to pass to the component
  },
};
