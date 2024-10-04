import { create } from "zustand";
import axios from "axios";
import { client } from "@/utils/KindeConfig";
import { Budget, Category, CategoryTags, Entry, TagType } from "@/utils/types";

interface BudgetState {
  user: {
    family_name: string;
    given_name: string;
    email: string;
    picture: string;
    id?: number;
  } | null;
  budgets: Budget[];
  currentBudget: Budget | null;
  selectedCategory: Category | null;
  tags: TagType[];
  incomeTags: TagType[];
  expenseTags: TagType[];
  savingsTags: TagType[];
  miscTags: TagType[];
  strategyTags: TagType[];
  newEntries: { [key: string]: Entry[] };
  fetchUserData: () => Promise<void>;
  clearUser: () => void;
  setCategory: (category: Category) => void;
  addEntry: (
    category: string,
    formData: Entry,
    categoryTagIndex: number
  ) => void;
  createNewBudget: (name: string) => Promise<void>;
  beginNewBudget: () => Promise<void>;
  setBudgetName: (name: string) => void;
}

const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

export const useBudgetStore = create<BudgetState>((set, get) => ({
  user: null,
  budgets: [], // Initialize budgets as an empty array
  currentBudget: {
    id: null,
    name: null,
    created_at: null,
    updated_at: null,
  },
  selectedCategory: null,
  tags: [],
  incomeTags: [],
  expenseTags: [],
  savingsTags: [],
  miscTags: [],
  strategyTags: [],
  newEntries: {},

  fetchUserData: async () => {
    const { user } = get();
    if (user) return; // If user is already in the state, skip fetching

    try {
      const response = await client.getUserDetails();
      const { family_name, given_name, email, picture } = response;

      const budgetUser = await axios.get(`${apiUrl}/users/show_by_email`, {
        params: { email },
      });

      const userData = budgetUser.data;

      if (userData.length === 0) {
        const postResponse = await axios.post(`${apiUrl}/users`, {
          first_name: given_name,
          last_name: family_name,
          email: email,
          picture: picture,
        });

        if (postResponse.status === 201) {
          const {
            id,
            given_name: first_name,
            family_name: last_name,
            email,
            picture,
          } = postResponse.data;
          set({
            user: {
              last_name,
              first_name,
              email,
              id,
              picture,
            },
          });
        }
      } else {
        const userId = userData.id;

        const budgetsResponse = await axios.get(`${apiUrl}/budgets`, {
          params: { user_id: userId },
        });

        set({
          user: {
            family_name: userData.last_name,
            given_name: userData.first_name,
            email: userData.email,
            id: userData.id,
            picture: userData.picture,
          },
          budgets: budgetsResponse.data,
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  },

  clearUser: () => set({ user: null }),

  setCategory: (category: Category) => {
    set((state) => ({
      ...state,
      selectedCategory: category,
      tags: CategoryTags[category] || [], // Safely update the tags based on the selected category
    }));
  },

  setBudgetName: (name: string) => {
    set((state) => ({
      currentBudget: { ...state.currentBudget, name }, // Update the current budget's name
    }));
  },

  beginNewBudget: async () => {
    try {
      // Fetch default tags from the backend
      const response = await axios.get(`${apiUrl}/tags/default_tags`, {
        params: { user_id: 1 },
      });

      const defaultTags = response.data;

      // Set the tags based on the fetched default tags
      const incomeTags = defaultTags.filter((tag) => tag.category_id === 6);
      const expenseTags = defaultTags.filter((tag) => tag.category_id === 7);
      const savingsTags = defaultTags.filter((tag) => tag.category_id === 8);
      const miscTags = defaultTags.filter((tag) => tag.category_id === 9);
      const strategyTags = defaultTags.filter((tag) => tag.category_id === 10);
      console.log(defaultTags, " the default tags");
      console.log(incomeTags, " the income tags");

      // Update Zustand state with fetched tags
      set((state) => ({
        tags: defaultTags, // Load default tags into Zustand state
        incomeTags: incomeTags, // Set incomeTags to the fetched data
        expenseTags: expenseTags, // Set expenseTags to the fetched data
        savingsTags: savingsTags, // Set savingsTags to the fetched data
        miscTags: miscTags, // Set miscTags to the fetched data
        strategyTags: strategyTags, // Set strategyTags to the fetched data
      }));
    } catch (error) {
      console.error("Error fetching default tags:", error);
    }
  },

  addEntry: (category: string, formData: Entry, categoryTagIndex: number) => {
    const { newEntries } = get();
    const newEntry: Entry = {
      ...formData,
      category,
      categoryTag: CategoryTags[category]?.[categoryTagIndex] || "default", // Safely accessing category tags
    };

    set({
      newEntries: {
        ...newEntries,
        [category]: [...(newEntries[category] || []), newEntry],
      },
    });
  },

  createNewBudget: async (name: string) => {
    const { user, newEntries } = get();
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
      } else {
        console.error("Unexpected response status:", response.status);
      }
    } catch (error) {
      console.error("Error creating new budget:", error);
    }
  },
}));
