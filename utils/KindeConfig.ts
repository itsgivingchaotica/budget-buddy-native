import { KindeSDK } from "@kinde-oss/react-native-sdk-0-7x";

export const client = new KindeSDK(
  process.env.EXPO_PUBLIC_KINDE_APP_DOMAIN,
  process.env.EXPO_PUBLIC_KINDE_ALLOWED_CALLBACK_URL,
  process.env.EXPO_PUBLIC_KINDE_CLIENT_ID,
  process.env.EXPO_PUBLIC_KINDE_LOGOUT_REDIRECT_URL
);
