import type { Transaction } from "@/utils/activityApi";

/**
 * C2b chip states for an Activity row: in a suggested transfer pair →
 * "Transfer?"; waiting for review → "<Suggestion>?" or "Needs review" (review
 * colours); otherwise the category.
 */
export function rowChip(
  t: Pick<Transaction, "transfer_suggested" | "needs_review">,
  categoryName: string | null,
  suggestionName: string | null
): { label: string; tone: "review" | "positive" } {
  if (t.transfer_suggested) return { label: "Transfer?", tone: "review" };
  if (t.needs_review || !categoryName) return { label: suggestionName ? `${suggestionName}?` : "Needs review", tone: "review" };
  return { label: categoryName, tone: "positive" };
}
