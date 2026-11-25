import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api, deviceTimeZone } from "@/utils/api";
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

type BudgetData = Pick<
  BudgetState,
  | "user"
  | "budgets"
  | "currentBudget"
  | "selectedCategory"
  | "tags"
  | "incomeTags"
  | "expenseTags"
  | "savingsTags"
  | "miscTags"
  | "strategyTags"
  | "entries"
>;

// A fresh copy of the store's data: the starting state, what logout resets
// to, and what old persisted data migrates to.
export function initialBudgetData(): BudgetData {
  return {
    user: null,
    budgets: [],
    currentBudget: {
      id: null,
      name: null,
      created_at: null,
      updated_at: null,
    } as unknown as Budget,
    selectedCategory: null,
    tags: [],
    incomeTags: [],
    expenseTags: [],
    savingsTags: [],
    miscTags: [],
    strategyTags: [],
    entries: {},
  };
}

// Persisted-state version. Version 1 (2026-11-24, after C0 and the move to
// the fresh MVP database): anything saved by an older build referred to the
// old database's users, budgets and tags, so it is discarded, not migrated.
export const BUDGET_STORE_VERSION = 1;

export function migrateBudgetStore(persisted: unknown, version: number): BudgetData {
  if (version < BUDGET_STORE_VERSION) {
    return initialBudgetData();
  }
  return persisted as BudgetData;
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      ...initialBudgetData(),

      fetchUserData: async () => {
        const { entries, selectedCategory } = get();
        let category;
        // console.log("selected CATEGORY: ", selectedCategory);

        // C0: only ask for entries when there is a budget. Since S3 (ownership
        // rules) an unknown budget id is a 404, which used to abort this whole
        // function. The response was never used here.
        if (Object.keys(entries).length === 0 && get().currentBudget?.id) {
          try {
            await api.get("/entries/entries_by_budget_with_default_categories", {
              params: {
                budget_id: get().currentBudget?.id,
                category_id: CategoryIdMap[selectedCategory],
              },
            });
          } catch (error) {
            console.warn("Could not prefetch entries");
          }
        }
        // Always ask the server who the caller is, even when a user is saved
        // on the phone: saved data may belong to another login or an old
        // database, and /me is what links or creates the backend user (S2).
        try {
          // C0: GET /me finds or creates the caller's user from their Kinde
          // login (S2), replacing the old "look up by email, else create" flow.
          const { data: userData } = await api.get("/me", {
            params: { time_zone: deviceTimeZone() },
          });

          {
            const budgetsResponse = await api.get("/budgets");

            const sortedBudgets = budgetsResponse.data.sort(
              (a: Budget, b: Budget) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            );

            const response = await api.get("/tags/default_tags");

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
        set(initialBudgetData());

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
          const { data: entriesData } = await api.get(
            "/entries/entries_by_budget_with_default_categories",
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
            const response = await api.get("/tags/default_tags");

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
          const response = await api.get("/tags/default_tags");

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
          const response = await api.post("/entries", {
            entry: newEntryPayload,
          });

          if (response.status === 201) {
            const savedEntry = response.data;

            // Fetch the updated budget data
            const updatedBudgetRes = await api.get(`/budgets/${budget.id}`);
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
          const response = await api.post("/budgets", {
            budget: { name },
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
      version: BUDGET_STORE_VERSION,
      migrate: migrateBudgetStore,
    }
  )
);
