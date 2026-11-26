import { KindeSDK } from "@kinde-oss/react-native-sdk-0-7x";

// Same as the SDK's built-in default; passed explicitly only because
// `additionalParameters` is the next positional argument.
const KINDE_SCOPE = "openid profile email offline";

// Audience of our own Rails API (Kinde: Settings → APIs → "Budget Buddy API").
// Must be referenced as process.env.EXPO_PUBLIC_… so Expo inlines it at build time.
const audience = process.env.EXPO_PUBLIC_KINDE_AUDIENCE?.trim();

// The SDK throws at construction if `audience` is present but not a string,
// so only include it when configured. Without it, login still works but the
// access token won't be accepted by the API once S1b is enabled.
const additionalParameters = audience ? { audience } : {};

export const client = new KindeSDK(
  process.env.EXPO_PUBLIC_KINDE_APP_DOMAIN,
  process.env.EXPO_PUBLIC_KINDE_ALLOWED_CALLBACK_URL,
  process.env.EXPO_PUBLIC_KINDE_CLIENT_ID,
  process.env.EXPO_PUBLIC_KINDE_LOGOUT_REDIRECT_URL,
  KINDE_SCOPE,
  additionalParameters
);
