// C0 (app sends the login token): the one HTTP client for the Rails API.
//
// - Attaches the Kinde access token as `Authorization: Bearer <token>`.
// - On a 401, refreshes the token once and retries; if that fails, clears the
//   "logged in" flag and sends the user to the login screen.
// - Never logs the token.
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { router } from "expo-router";
import { client } from "@/utils/KindeConfig";
import services from "@/utils/services";

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL, // must include /api/v1
  timeout: 15000,
});

async function currentAccessToken(): Promise<string | null> {
  try {
    const token = await client.getToken();
    return token?.access_token ?? null;
  } catch {
    // Not signed in, or the stored session can't be used.
    return null;
  }
}

api.interceptors.request.use(async (config) => {
  const token = await currentAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

type RetriableConfig = InternalAxiosRequestConfig & { _bbRetried?: boolean };

let redirectingToLogin = false;

async function sendToLogin(): Promise<void> {
  if (redirectingToLogin) return;
  redirectingToLogin = true;
  try {
    await services.removeData("login");
    router.replace("/login");
  } finally {
    // Let one redirect finish before another can start.
    setTimeout(() => {
      redirectingToLogin = false;
    }, 1000);
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;

    if (error.response?.status === 401 && config) {
      if (!config._bbRetried) {
        config._bbRetried = true;
        try {
          await client.forceTokenRefresh();
          return api(config);
        } catch {
          // No refresh token, or Kinde refused it: fall through to login.
        }
      }
      await sendToLogin();
    }

    return Promise.reject(error);
  }
);

// The device's IANA time zone (e.g. "Europe/London"), sent to GET /me so the
// server can store it once (PO-12). Undefined if the runtime can't tell.
export function deviceTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}
