import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axios from "axios";
import { client } from "@/utils/KindeConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  fetchCategoryEntries: (
    budget_id: number,
    category_id: number
  ) => Promise<void>;
  clearUser: () => void;
  setCategory: (category: Category) => Promise<void>;
  addEntry: (entryData: Entry, tagId: number | null) => Promise<void>;
  createNewBudget: (name: string) => Promise<Budget | void>;
  beginNewBudget: () => Promise<void>;
  setBudgetName: (name: string) => void;
}

const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      user: null,
      budgets: [],
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
        const { user, incomeTags, tags, entries, selectedCategory } = get();
        let category;
        // console.log("selected CATEGORY: ", selectedCategory);

        if (Object.keys(entries).length === 0) {
          console.log("entries is empty");
          const entriesResponse = await axios.get(
            `${apiUrl}/entries/entries_by_budget_with_default_categories`,
            {
              params: {
                budget_id: get().currentBudget?.id,
                category_id: CategoryIdMap[selectedCategory],
              },
            }
          );
          // console.log(
          //   entriesResponse.data,
          //   " the entries response from fetchUserData"
          // );
        }
        if (user && incomeTags?.length && tags?.length) {
          console.log("user data already exists");
          return;
        } else {
          console.log("tags state not saved, fetching user data");
        }
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
              email,
              picture,
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
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            );

            const response = await axios.get(`${apiUrl}/tags/default_tags`, {
              params: { user_id: 1 },
            });

            const defaultTags = response.data;

            const expenseTags = defaultTags.filter(
              (tag) => tag.category_id === 6
            );
            const incomeTags = defaultTags.filter(
              (tag) => tag.category_id === 7
            );
            const savingsTags = defaultTags.filter(
              (tag) => tag.category_id === 8
            );
            const miscTags = defaultTags.filter((tag) => tag.category_id === 9);
            const strategyTags = defaultTags.filter(
              (tag) => tag.category_id === 10
            );

            set({
              tags: defaultTags,
              incomeTags,
              expenseTags,
              savingsTags,
              miscTags,
              strategyTags,
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

      clearUser: () => {
        // Clear the user data and reset all store values
        set({
          user: null,
          budgets: [],
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
        });

        // Clear AsyncStorage to ensure persisted data is also removed
        AsyncStorage.clear()
          .then(() => {
            console.log("AsyncStorage has been cleared");
          })
          .catch((error) => {
            console.error("Error clearing AsyncStorage:", error);
          });
      },

      fetchCategoryEntries: async (category_id: number) => {
        try {
          const budgetId = get().currentBudget?.id;
          if (!budgetId) {
            console.warn("No current budget found.");
            return;
          }

          // Fetch entries from the backend for the specific category
          const { data: entriesData } = await axios.get(
            `${apiUrl}/entries/entries_by_budget_with_default_categories`,
            {
              params: {
                budget_id: budgetId,
                category_id,
              },
            }
          );

          // console.log("Fetched entries:", entriesData);

          const mappedEntries = entriesData.map((entry) => ({
            id: entry.id,
            start_date: entry.start_date,
            amount: entry.amount,
            description: entry.description,
            frequency: entry.frequency,
            custom_frequency_days: entry.custom_frequency_days,
            frequency_number: entry.frequency_number,
            end_date: entry.end_date,
            budget_id: entry.budget_id,
            category:
              entry.tags && entry.tags.length > 0
                ? {
                    id: entry.tags[0].category_id, // Get category_id from the first tag
                    name: entry.tags[0].name, // Get name from the first tag
                  }
                : { id: null, name: null }, // Fallback if no tags exist
            categoryTag:
              entry.tags && entry.tags.length > 0
                ? {
                    id: entry.tags[0].id, // Get tag id from the first tag
                    name: entry.tags[0].name, // Get tag name from the first tag
                  }
                : { id: null, name: null }, // Fallback if no tags exist
          }));

          // Log the mapped entries to see the result
          // console.log("Mapped Entries:", mappedEntries);

          // Find the category key based on category_id
          const categoryKey = Object.keys(CategoryIdMap).find(
            (key) => CategoryIdMap[key as Category] === category_id
          ) as Category | undefined;

          if (!categoryKey) {
            console.warn("Invalid category_id for CategoryIdMap");
            return;
          }

          // Update the entries in the Zustand store by category
          set((state) => ({
            entries: {
              ...state.entries,
              [categoryKey]: mappedEntries, // Update with the fetched entries for the category
            },
          }));

          // console.log("Updated entries in Zustand:", get().entries);
        } catch (error) {
          console.error("Error fetching category entries:", error);
        }
      },

      setCategory: async (category: Category) => {
        const currentTagsCategoryIds = get().tags.map((tag) => tag.category_id);
        const requiredCategoryId = CategoryIdMap[category];
        const isCategoryPresent =
          currentTagsCategoryIds.includes(requiredCategoryId);
        const { entries } = get();
        let category_id: number | undefined;

        console.log(
          category,
          " the category that was passed as type CATEGORY in setCategory"
        );

        if (Object.values(Category).includes(category)) {
          // console.log("its in category");
          category_id = CategoryIdMap[category];
          // console.log(category_id, "category ID processed in fetchUserData");
        } else {
          console.log("cannot find category ID");
        }

        // if (Object.keys(entries).length === 0) {
        //   console.log("entries is empty");
        await get().fetchCategoryEntries(category_id);
        //   console.log("completed fetch category entries");
        //   console.log(get().entries, "the ENTIRES YAY");
        // } else {
        //   console.log(get().entries, "the ENTIRES YAY");
        // }

        // if (Object.keys(entries).length !== 0) {
        //   console.log(get().entries, "the ENTIRES YAY");
        // }

        if (!isCategoryPresent) {
          try {
            const response = await axios.get(`${apiUrl}/tags/default_tags`, {
              params: { user_id: 1 },
            });

            const newTags = response.data.filter(
              (tag: TagType) => tag.category_id === requiredCategoryId
            );

            set((state) => ({
              ...state,
              selectedCategory: category,
              tags: [...state.tags, ...newTags],
            }));
          } catch (error) {
            console.error("Error fetching default tags:", error);
          }
        } else {
          set((state) => ({
            ...state,
            selectedCategory: category,
            tags: CategoryTags[category],
          }));
        }
      },

      setBudgetName: (name: string) => {
        set((state) => ({
          currentBudget: { ...state.currentBudget, name },
        }));
      },

      beginNewBudget: async () => {
        try {
          const response = await axios.get(`${apiUrl}/tags/default_tags`, {
            params: { user_id: 1 },
          });

          const defaultTags = response.data;
          const expenseTags = defaultTags.filter(
            (tag) => tag.category_id === 6
          );
          const incomeTags = defaultTags.filter((tag) => tag.category_id === 7);
          const savingsTags = defaultTags.filter(
            (tag) => tag.category_id === 8
          );
          const miscTags = defaultTags.filter((tag) => tag.category_id === 9);
          const strategyTags = defaultTags.filter(
            (tag) => tag.category_id === 10
          );

          set((state) => ({
            tags: defaultTags,
            incomeTags,
            expenseTags,
            savingsTags,
            miscTags,
            strategyTags,
          }));
        } catch (error) {
          console.error("Error fetching default tags:", error);
        }
      },
      addEntry: async (entryData, tagId) => {
        const { entries, user, currentBudget, selectedCategory } = get();

        // Ensure the user is authenticated
        if (!user) {
          console.error("User is not authenticated.");
          return;
        }

        // Ensure we have a budget, create a new one if necessary
        let budget = currentBudget;
        if (!budget || !budget.id) {
          const newBudget = await get().createNewBudget("");
          if (!newBudget) {
            console.error(
              "Failed to create new budget. Aborting entry creation."
            );
            return;
          }
          budget = newBudget;
        }

        // Prepare the new entry payload
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
          tag_ids: tagId !== null ? [tagId] : [],
        };

        try {
          // Create the new entry via API
          const response = await axios.post(`${apiUrl}/entries`, {
            entry: newEntryPayload,
          });

          if (response.status === 201) {
            const savedEntry = response.data;

            // Fetch the updated budget data
            const updatedBudgetRes = await axios.get(
              `${apiUrl}/budgets/${budget.id}`
            );
            const updatedBudget = updatedBudgetRes.data;
            // Extract the first tag from the response
            const tag = savedEntry.tags?.[0];

            // Filter entries for the selected category and log them based on tagId
            // const updatedEntries =
            //   get().entries[CategoryIdMap[selectedCategory]] || [];
            // Construct the updated entry with both category and categoryTag
            const updatedEntry = {
              ...savedEntry,
              category: Category[selectedCategory], // Set the category field
              categoryTag: tag
                ? {
                    id: tag.id,
                    name: tag.name,
                    categoryId: tag.category_id,
                  }
                : null,
            };

            set((state) => ({
              entries: {
                ...state.entries,
                [selectedCategory]: [
                  ...(state.entries[selectedCategory] || []),
                  updatedEntry,
                ],
              },
            }));
            // Check if the newly saved entry appears in the filtered list after the update
            // const rerenderedEntries = get().entries || {};

            // console.log(rerenderedEntries, " the rerendered entries");
          }
        } catch (error) {
          console.error("Error adding entry:", error.message || error);
          if (error.stack) {
            console.error(error.stack);
          }
        }
      },

      createNewBudget: async (name: string) => {
        const { user } = get();
        if (!user?.id) {
          console.error("User ID is missing.");
          return;
        }

        try {
          const response = await axios.post(`${apiUrl}/budgets`, {
            budget: { name, user_id: user.id },
          });

          if (response.status === 201) {
            const newBudget = response.data;
            set((state) => ({
              budgets: [newBudget, ...state.budgets],
              currentBudget: newBudget,
            }));
            return newBudget;
          }
        } catch (error) {
          console.error("Error creating new budget:", error);
        }
      },
    }),
    {
      name: "budget-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
