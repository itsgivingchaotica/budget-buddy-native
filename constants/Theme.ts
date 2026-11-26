// Forest Floor brand tokens (D-020): the one place new screens take colours,
// fonts and shapes from (LG1). Legacy screens keep constants/Colors.ts.
// Spec: bb-server/docs/product/SCREENS_ACTIVITY.md ("Shared rules").

export const colors = {
  pine: "#2F5D46", // primary
  moss: "#7A9A5B",
  fern: "#DCE6D2", // confirmed / positive chips
  birch: "#F6F1E7", // background
  acorn: "#B5652E", // mascot only
  chestnut: "#8E4A1F", // accent text, "needs review" chip text
  bark: "#3A2A1E", // text
  barkSecondary: "#5B4A3C", // secondary text
  ember: "#C0563A", // over budget: always with an icon and a label; Log out border
  emberDark: "#A8432B", // error text, Log out label (C9)
  reviewChip: "#F6E7DA", // "needs review" chip background
  line: "#E6DCCF", // light borders: chips, outlined buttons, dividers (design screenshots)
  tile: "#F6F1E7", // number tiles inside white cards (Birch)
  dayHeader: "#5E7A4E", // day headers in the Activity list (muted green, from the design)
  card: "#FFFFFF",
  white: "#FFFFFF",
} as const;

// Font family names as registered in app/_layout.tsx (@expo-google-fonts).
export const fonts = {
  heading: "BricolageGrotesque_700Bold",
  display: "BricolageGrotesque_800ExtraBold", // the "Budget Buddy" name on Welcome (C9)
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemiBold: "Inter_600SemiBold",
} as const;

export const radius = {
  card: 18,
  button: 12,
  chip: 999,
} as const;

// Minimum touch target (accessibility rule in the spec).
export const minTouch = 44;

export const theme = { colors, fonts, radius, minTouch } as const;
export default theme;
