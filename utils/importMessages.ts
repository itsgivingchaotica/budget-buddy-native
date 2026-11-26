// C2 (accounts and import screens): plain-words messages for import errors.
// The server sends codes only (never row text, AD13); this is the one place
// they become sentences.

const FILE_ERRORS: Record<string, string> = {
  empty_file: "This file is empty.",
  no_rows: "This file has a header row but no transactions.",
  missing_headers: "This file is missing required columns. It needs date, description and amount.",
  duplicate_headers: "A column name appears twice in this file.",
  malformed_csv: "This file isn't a valid CSV (check for an unclosed quote).",
  invalid_encoding: "This file isn't plain UTF-8 text. Export it again as CSV (UTF-8).",
  file_too_large: "This file is over 2 MB. Export a shorter date range.",
  too_many_rows: "This file has more than 10,000 rows. Export a shorter date range.",
  wrong_file_type: "That isn't a CSV file. Choose a .csv export from your bank.",
  file_missing: "No file was attached. Choose a CSV file.",
  account_archived: "This account is archived, so it can't take new imports.",
};

const ROW_ERRORS: Record<string, string> = {
  missing_date: "the date is missing",
  bad_date: "the date isn't in a format we read (use YYYY-MM-DD or M/D/YYYY)",
  missing_description: "the description is missing",
  description_too_long: "the description is longer than 255 characters",
  missing_amount: "the amount is missing",
  bad_amount: "the amount isn't a number we read",
  amount_too_large: "the amount is too large",
  transaction_id_too_long: "the transaction ID is longer than 255 characters",
};

/**
 * A whole-file error. For missing columns the server's message names the
 * missing ones, so it's used when present.
 */
export function fileErrorMessage(code: string | undefined, serverMessage?: string): string {
  if (code === "missing_headers" && serverMessage) return serverMessage;
  return (code && FILE_ERRORS[code]) || serverMessage || "This file couldn't be imported.";
}

/** "Line 7: the date isn't in a format we read" (never row text). */
export function rowErrorMessage(error: { line: number; code: string }): string {
  return `Line ${error.line}: ${ROW_ERRORS[error.code] ?? "this row couldn't be read"}`;
}

export type ImportFigures = {
  added: number;
  range: { from: string; through: string } | null;
  categorizedAutomatically: number;
  toReview: number;
  duplicates: number;
  unreadable: number;
  laterNote: boolean;
};

/**
 * The result card (spec §4). `toReview` is this import's rows still waiting
 * for review after categorization; `stillWaiting` is how many rows the AI
 * hasn't reached yet (daily cap or hourly limit), which shows "Some
 * transactions will be categorized later".
 */
export function importFigures(
  result: { inserted_count: number; duplicate_count: number; error_count: number; data_from: string | null; data_through: string | null },
  toReview: number,
  stillWaiting: number
): ImportFigures {
  return {
    added: result.inserted_count,
    range: result.data_from && result.data_through ? { from: result.data_from, through: result.data_through } : null,
    categorizedAutomatically: Math.max(result.inserted_count - toReview, 0),
    toReview,
    duplicates: result.duplicate_count,
    unreadable: result.error_count,
    laterNote: stillWaiting > 0,
  };
}
