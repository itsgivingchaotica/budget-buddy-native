import { create } from "zustand";
import axios from "axios";
import { client } from "@/utils/KindeConfig";
import Constants from "expo-constants";
import { Budget, Category, CategoryTags, Entry, TagType } from "@/utils/types";

interface BudgetState {
  user: {
    family_name: string;
    given_name: string;
    email: string;
    picture: string;
    id?: number; // Integer user ID
  } | null;
  budgets: Budget[];
  currentBudget: Budget | null;
  selectedCategory: Category | null;
  tags: TagType[];
  newEntries: { [key: string]: Entry[] };
  fetchUserData: () => Promise<void>;
  clearUser: () => void;
  setCategory: (category: Category) => void;
  addEntry: (category: string, formData: Entry) => void;
}

const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

export const useBudgetStore = create<BudgetState>((set, get) => ({
  user: null,
  selectedCategory: null,
  currentBudget: null,
  tags: [],
  entries: {},
  newEntries: {},
  fetchUserData: async () => {
    const { user } = get(); // Access the current state

    if (user) {
      // // If user is already in the state, do nothing
      // console.log("User already exists in state:", user);
      // GET THE UPDATED BUDGET
      return;
    }

    try {
      const response = await client.getUserDetails();
      const { family_name, given_name, email, picture } = response;
      console.log(response);

      // Check if the user already exists on the server
      const budgetUser = await axios.get(`${apiUrl}/users/show_by_email`, {
        params: { email }, // Filter by email
      });

      const userData = budgetUser.data;

      if (userData.length === 0) {
        // If user does not exist on the server, create a new one
        const postResponse = await axios.post(`${apiUrl}/users`, {
          first_name: given_name,
          last_name: family_name,
          email: email,
          picture: picture,
        });

        if (postResponse.status === 201) {
          // Assuming Rails response includes user ID as integer
          const {
            id,
            given_name: first_name,
            family_name: last_name,
            email,
            picture,
          } = postResponse.data; // Renaming `id` to `userId` if needed
          set({
            user: {
              last_name,
              first_name,
              email,
              id,
              picture, // Store the integer user ID
            },
          });
          console.log("User created successfully:", postResponse.data);
        } else {
          console.log("Unexpected response status:", postResponse.status);
        }
      } else {
        // If user exists, use the existing user data
        const userId = userData.id;

        // Fetch budgets associated with the user
        const budgetsResponse = await axios.get(`${apiUrl}/budgets`, {
          params: { user_id: userId }, // Pass user ID to filter budgets
        });

        const budgets = budgetsResponse.data;

        set({
          user: {
            family_name: userData.last_name,
            given_name: userData.first_name,
            email: userData.email,
            id: userData.id,
            picture: userData.picture, // Use the integer user ID from the server
          },
          budgets: budgets,
        });
        console.log("User already exists on the server.");
        console.log(get().user);
        console.log(get().budgets);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  },

  clearUser: () => set({ user: null }),

  //switch between views
  setCategory: (category: Category) => {
    set({
      selectedCategory: category,
      tags: CategoryTags[category] || [], // Update tags based on the selected category
    });
  },
  //build entries to push to the server for an exisitng or new budget
  addEntry: (category: string, formData: Entry, categoryTagIndex: number) => {
    const { newEntries } = get();
    const newEntry: Entry = {
      ...formData,
      category,
      categoryTag: CategoryTags[category][categoryTagIndex],
    };
    set({
      newEntries: {
        ...newEntries,
        [category]: [...(newEntries[category] || []), newEntry],
      },
    });
  },
  createNewBudget: async (name: string) => {
    const { user } = get();
    if (!user) {
      console.error("User is not authenticated.");
      return;
    }
    try {
      const response = await axios.post(`${apiUrl}/budgets`, {
        user_id: user.id,
        name,
        newEntries,
      });

      if (response.status === 201) {
        const newBudget = response.data;
        set((state) => ({
          budgets: [...state.budgets, newBudget],
          currentBudget: newBudget,
        }));
        console.log("New budget created:", newBudget);
      } else {
        console.error("Unexpected response status:", response.status);
      }
    } catch (error) {
      console.error("Error creating new budget:", error);
    }
  },
}));
