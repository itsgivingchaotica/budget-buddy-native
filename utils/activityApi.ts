// C2 (accounts and import screens): typed calls for the Activity tab. All
// requests go through utils/api.ts (C0), never axios directly.
import { api } from "@/utils/api";

export type AccountKind = "checking" | "savings" | "credit_card" | "p2p" | "cash" | "other";
export type AccountPurpose = "spending" | "bills" | "savings" | "side_income" | "other";

export type Account = {
  id: number;
  name: string;
  kind: AccountKind;
  purpose: AccountPurpose;
  purpose_note: string | null;
  archived_at: string | null;
  data_through: string | null;
  transaction_count: number;
};

export type Transaction = {
  id: number;
  account_id: number;
  import_id: number | null;
  posted_on: string;
  amount: string;
  description: string;
  category: string | null; // slug
  categorization_source: string;
  needs_review: boolean;
};

export type TransactionPage = { transactions: Transaction[]; page: number; per_page: number; total: number };

export type Category = { id: number; slug: string; name: string; kind: string };

export type ImportResult = {
  id: number;
  account_id: number;
  filename: string;
  row_count: number;
  inserted_count: number;
  duplicate_count: number;
  error_count: number;
  skipped_count: number;
  row_errors: { line: number; code: string }[];
  data_from: string | null;
  data_through: string | null;
  categorized: { remaining: number; needs_review: number };
};

export type CategorizeResult = { processed: number; remaining: number };

export type CsvFile = { uri: string; name: string; mimeType?: string | null };

export async function listAccounts(includeArchived = false): Promise<Account[]> {
  const { data } = await api.get<Account[]>("/accounts", { params: includeArchived ? { include_archived: true } : {} });
  return data;
}

export async function createAccount(attrs: { name: string; kind: AccountKind; purpose: AccountPurpose }): Promise<Account> {
  const { data } = await api.post<Account>("/accounts", { account: attrs });
  return data;
}

export async function listTransactions(params: {
  account_id?: number;
  import_id?: number;
  needs_review?: boolean;
  page?: number;
  per_page?: number;
}): Promise<TransactionPage> {
  const { data } = await api.get<TransactionPage>("/transactions", { params });
  return data;
}

/** Just the count (one row fetched). */
export async function countTransactions(params: { needs_review?: boolean; import_id?: number }): Promise<number> {
  return (await listTransactions({ ...params, per_page: 1 })).total;
}

export async function listCategories(): Promise<Category[]> {
  const { data } = await api.get<Category[]>("/categories");
  return data;
}

export async function importCsv(accountId: number, file: CsvFile): Promise<ImportResult> {
  const form = new FormData();
  // React Native's FormData takes a { uri, name, type } file part.
  form.append("file", { uri: file.uri, name: file.name, type: file.mimeType || "text/csv" } as unknown as Blob);
  const { data } = await api.post<ImportResult>(`/accounts/${accountId}/imports`, form, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60000,
  });
  return data;
}

export async function categorize(): Promise<CategorizeResult> {
  const { data } = await api.post<CategorizeResult>("/transactions/categorize");
  return data;
}

/**
 * After an import, ask the server to categorize until nothing is left for
 * Claude (AI2), at most `maxRounds` calls. Stops early, without failing,
 * when the daily AI cap or the hourly limit is reached (S4-min): those rows
 * are categorized later. Returns how many were still waiting.
 */
export async function categorizeUntilDone(
  remaining: number,
  maxRounds = 10,
  call: () => Promise<CategorizeResult> = categorize
): Promise<{ remaining: number; stoppedByLimit: boolean }> {
  let left = remaining;
  for (let round = 0; left > 0 && round < maxRounds; round++) {
    try {
      left = (await call()).remaining;
    } catch (error) {
      if ((error as { response?: { status?: number } }).response?.status === 429) {
        return { remaining: left, stoppedByLimit: true };
      }
      throw error;
    }
  }
  return { remaining: left, stoppedByLimit: false };
}

/** Server's whole-file / validation error: { error, message } or { errors }. */
export function apiError(error: unknown): { status?: number; code?: string; message?: string; fields?: Record<string, string[]> } {
  const response = (error as { response?: { status?: number; data?: any } }).response;
  const data = response?.data ?? {};
  return { status: response?.status, code: data.error, message: data.message, fields: data.errors };
}

/** The CSV template served by Rails (public/csv-templates). */
export function templateUrl(): string {
  const base = (process.env.EXPO_PUBLIC_API_BASE_URL || "").replace(/\/api\/v1\/?$/, "");
  return `${base}/csv-templates/generic.csv`;
}
