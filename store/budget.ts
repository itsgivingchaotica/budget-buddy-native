import { create } from "zustand";
import axios from "axios";
import { client } from "@/utils/KindeConfig";
import {
  Budget,
  Category,
  CategoryTags,
  Entry,
  TagType,
  CategoryIdMap,
} from "@/utils/types";

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
  entries: { [key: string]: Entry[] };
  fetchUserData: () => Promise<void>;
  clearUser: () => void;
  setCategory: (category: Category) => void;
  addEntry: (
    category: string,
    entryData: Entry,
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
  entries: {},

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

      console.log(userData, " the userData");

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

        const sortedBudgets = budgetsResponse.data.sort(
          (a: Budget, b: Budget) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        set({
          user: {
            family_name: userData.last_name,
            given_name: userData.first_name,
            email: userData.email,
            id: userData.id,
            picture: userData.picture,
          },
          budgets: budgetsResponse.data,
          currentBudget: sortedBudgets[0],
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
      const expenseTags = defaultTags.filter((tag) => tag.category_id === 6);
      const incomeTags = defaultTags.filter((tag) => tag.category_id === 7);
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

  addEntry: async (entryData: Entry, tagId: number | null) => {
    const { entries, user, currentBudget, selectedCategory } = get();
    console.log(entryData, " is the entry data");
    console.log(selectedCategory, " is the category");
    console.log(tagId, " is the tag id");
    if (!user) {
      console.error("User is not authenticated.");
      return;
    }

    let budget = currentBudget;

    console.log(budget, " the current budget from addEntry");
    if (!budget || !budget.id) {
      const defaultBudgetName = "";
      const newBudget = await get().createNewBudget(defaultBudgetName);
      if (!newBudget) {
        console.error("Failed to create new budget. Aborting entry creation.");
        return;
      }
      budget = newBudget;
    }

    // Handle case where tagId is missing (null or undefined)
    if (tagId === null || tagId === undefined) {
      console.log("No tagId provided. Creating new entry without a tag.");
    }

    const newEntryPayload = {
      budget_id: budget.id,
      start_date: entryData.start_date,
      amount: entryData.amount,
      description: entryData.description,
      frequency: entryData.frequency,
      custom_frequency_days: entryData.custom_frequency_days,
      category_id: CategoryIdMap[selectedCategory],
      frequency_number: entryData.frequency_number,
      end_date: entryData.end_date,
      tag_ids: [tagId], // matching join table for entries_tags
    };

    try {
      const response = await axios.post(`${apiUrl}/entries`, {
        entry: newEntryPayload,
      });

      if (response.status === 201) {
        const savedEntry = response.data;

        // Fetch the updated budget to update the local state
        const updatedBudgetRes = await axios.get(
          `${apiUrl}/budgets/${budget.id}`
        );
        const updatedBudget = updatedBudgetRes.data;

        // Update local store
        set({
          entries: {
            ...entries,
            [categoryId]: [...(entries[categoryId] || []), savedEntry],
          },
          currentBudget: updatedBudget,
        });
      } else {
        console.error(
          "Unexpected response status while saving entry:",
          response.status
        );
      }
    } catch (error) {
      console.error("Error saving entry:", error);
    }
  },
  createNewBudget: async (name: string) => {
    const { user } = get();
    if (!user) {
      console.error("User is not authenticated.");
      return null;
    }

    try {
      const response = await axios.post(`${apiUrl}/budgets`, {
        budget: {
          user_id: user.id,
          name,
        },
      });

      if (response.status === 201) {
        const newBudget = response.data;
        set((state) => ({
          budgets: [...state.budgets, newBudget],
          currentBudget: newBudget,
        }));
        return newBudget;
      } else {
        console.error("Unexpected response status:", response.status);
        return null;
      }
    } catch (error) {
      console.error("Error creating new budget:", error);
      return null;
    }
  },
}));
