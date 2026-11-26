// C9 (welcome and account screens): display helpers for the account sheet.
import { api, deviceTimeZone } from "@/utils/api";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** week_starts_on uses Ruby's wday (0 = Sunday, 1 = Monday). Default Monday. */
export function weekStartLabel(wday: number | null | undefined): string {
  return WEEKDAYS[wday ?? 1] ?? "Monday";
}

/** "America/New_York" -> "New York"; "Europe/London" -> "London". */
export function timeZoneCity(zone: string | null | undefined): string {
  if (!zone) return "Not set";
  const city = zone.split("/").pop() ?? zone;
  return city.replace(/_/g, " ");
}

/** First letter of the first name, else of the email, else "?". */
export function initial(firstName?: string | null, email?: string | null): string {
  const source = (firstName || "").trim() || (email || "").trim();
  return source ? source.charAt(0).toUpperCase() : "?";
}

export type Me = {
  id: number;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  profile: { week_starts_on: number | null; time_zone: string | null } | null;
};

/** GET /me (finds or creates the caller's user and profile). */
export async function fetchMe(): Promise<Me> {
  const { data } = await api.get<Me>("/me", { params: { time_zone: deviceTimeZone() } });
  return data;
}

/** Values for the sheet; a missing profile shows the defaults (Monday, device zone). */
export function accountRows(me: Pick<Me, "profile"> | null, deviceZone: string | undefined = deviceTimeZone()) {
  return {
    weekStartsOn: weekStartLabel(me?.profile?.week_starts_on),
    timeZone: timeZoneCity(me?.profile?.time_zone ?? deviceZone),
  };
}
