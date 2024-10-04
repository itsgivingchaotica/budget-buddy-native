// types.ts

// Define your categories
export enum Category {
  EXPENSE = "Expenses",
  INCOME = "Income",
  SAVINGS_GOALS = "Savings & \n Goals",
  MISCELLANEOUS = "Miscellaneous",
  BUDGETING_STRATEGY = "Budgeting \n Strategy",
}

export type Budget = {
  id: number | null;
  name: string | null;
  created_at: Date | null;
  updated_at: Date | null;
};

export type Entry = {
  start_date: string;
  amount: string;
  description: TagType;
  frequency: string | null;
  custom_frequency_days: string | null;
  frequency_number: number;
  end_date: string | null;
  budget_id: number | null;
  category: Category;
  categoryTag: TagType;
};

// Define default tags
export const DefaultTags = {
  urgent: "Urgent",
  important: "Important",
  completed: "Completed",
  pending: "Pending",
} as const;
// Define tags for each category
export const CategoryTags: Record<Category, string[]> = {
  [Category.EXPENSE]: [
    "Groceries",
    "Utilities",
    "Rent",
    "Dining Out",
    "Entertainment",
    "Transportation",
    "Healthcare",
    "Education",
    "Clothing",
    "Personal Care",
    "Gifts",
    "Travel",
    "Subscriptions",
    "Home Improvement",
    "Debt Repayment",
  ],
  [Category.INCOME]: ["Salary", "Freelance", "Gifts Received", "Bonuses"],
  [Category.SAVINGS_GOALS]: [
    "Emergency Fund",
    "Vacation Fund",
    "Retirement Savings",
    "New Car Fund",
    "Home Down Payment",
    "Education Fund",
    "Major Purchase",
    "Debt Reduction",
  ],
  [Category.MISCELLANEOUS]: [
    "One-time",
    "Recurring",
    "Essential",
    "Non-Essential",
    "Planned",
    "Unexpected",
  ],
  [Category.BUDGETING_STRATEGY]: [
    "Fixed Expense",
    "Variable Expense",
    "Needs",
    "Wants",
    "Discretionary",
  ],
};

export type CategoryType = keyof typeof CategoryTags;
export type TagType = (typeof CategoryTags)[CategoryType][number];
