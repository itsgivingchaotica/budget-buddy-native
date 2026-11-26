// C3 (Home screen): the one shared helper for conservative money display
// (SPEC_LEFT_TO_SPEND §5, plan C3). Amounts arrive from the API as exact
// strings ("63.73"); this works in whole cents, never floats, and rounds so
// the user never sees more available than there is:
//   left ≥ 0       → whole dollars rounded DOWN   ("$63")
//   left < 0       → "$0", and the overage rounded UP ("over by $22")
//   allowance      → rounded DOWN ("of $149")
//   still needed   → rounded UP (a goal never looks closer than it is)

/** "63.73" → 6373, "-21.67" → -2167, "149" → 14900. */
export function toCents(amount: string): number {
  const trimmed = amount.trim();
  const negative = trimmed.startsWith("-");
  const [whole, fraction = ""] = trimmed.replace(/^[-+]/, "").split(".");
  const cents = Number(whole || "0") * 100 + Number((fraction + "00").slice(0, 2));
  return negative ? -cents : cents;
}

/** 1234 (whole dollars) → "$1,234". */
export function dollarText(wholeDollars: number): string {
  return `$${String(wholeDollars).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

/** Whole dollars rounded down: "149.33" → "$149"; never below $0. */
export function dollarsDown(amount: string): string {
  return dollarText(Math.max(0, Math.floor(toCents(amount) / 100)));
}

/** Whole dollars rounded up, size only: "21.67" → "$22"; "-21.67" → "$22". */
export function dollarsUp(amount: string): string {
  return dollarText(Math.ceil(Math.abs(toCents(amount)) / 100));
}

export type LeftDisplay = { amount: string; overBy: string | null };

/** The headline: "$63" left, or "$0" left and over by "$22". */
export function leftDisplay(left: string): LeftDisplay {
  return toCents(left) < 0 ? { amount: "$0", overBy: dollarsUp(left) } : { amount: dollarsDown(left), overBy: null };
}

/** Spent ÷ allowance for the progress bar, between 0 and 1. */
export function spentShare(spent: string, allowance: string): number {
  const a = toCents(allowance);
  const s = Math.max(0, toCents(spent));
  if (a <= 0) return s > 0 ? 1 : 0;
  return Math.min(1, s / a);
}
