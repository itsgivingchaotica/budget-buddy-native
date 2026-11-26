// C2: the words the Activity screens use for account kinds and purposes
// (docs/product/SCREENS_ACTIVITY.md §3), mapped to the API's values.
import type { AccountKind, AccountPurpose } from "@/utils/activityApi";

export const KIND_LABELS: Record<AccountKind, string> = {
  checking: "Checking",
  savings: "Savings",
  credit_card: "Credit card",
  p2p: "Payment app",
  cash: "Cash",
  other: "Other",
};

export const PURPOSE_LABELS: Record<AccountPurpose, string> = {
  spending: "Everyday spending",
  bills: "Paying bills",
  savings: "Saving for goals",
  side_income: "Side-job income",
  other: "Other",
};

export const KINDS = Object.keys(KIND_LABELS) as AccountKind[];
export const PURPOSES = Object.keys(PURPOSE_LABELS) as AccountPurpose[];
