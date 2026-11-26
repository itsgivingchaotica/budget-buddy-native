// C2: shared Forest Floor building blocks for the Activity screens
// (bb-server/docs/product/SCREENS_ACTIVITY.md "Shared rules", bb-server/docs/product/screens/).
// Real buttons, 44-pt touch targets, selected state exposed to accessibility.
import React, { useState, type ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type PressableProps, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, fonts, minTouch, radius } from "@/constants/Theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

/**
 * A Pressable with a static style and its own pressed state. Never pass
 * `style` as a function: on the phone (NativeWind 4's JSX wrapper) a
 * style function left the Activity buttons with no background, so white
 * text sat invisible on a white card (C2 phone test, 2026-11-25).
 */
export function PressableBox({
  style,
  pressedStyle,
  children,
  ...rest
}: Omit<PressableProps, "style" | "children"> & {
  style?: StyleProp<ViewStyle>;
  pressedStyle?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      {...rest}
      onPressIn={(e) => {
        setPressed(true);
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        rest.onPressOut?.(e);
      }}
      style={[style, pressed && (pressedStyle ?? styles.dim)]}
    >
      {children}
    </Pressable>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  /** primary: Pine fill. secondary: white, Pine border. outline / outlinePine: small, light or Pine border. */
  variant?: "primary" | "secondary" | "outline" | "outlinePine";
  icon?: IconName;
  disabled?: boolean;
  busy?: boolean;
  style?: ViewStyle;
  accessibilityHint?: string;
};

export function Button({ label, onPress, variant = "primary", icon, disabled, busy, style, accessibilityHint }: ButtonProps) {
  const v = VARIANTS[variant];
  return (
    <PressableBox
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!(disabled || busy), busy: !!busy }}
      style={[styles.button, v.box, disabled && styles.dim, style]}
    >
      {busy ? (
        <ActivityIndicator color={v.text.color as string} />
      ) : (
        <View style={styles.buttonInner}>
          {icon ? <Ionicons name={icon} size={20} color={v.text.color as string} /> : null}
          <Text style={[styles.buttonText, v.text]}>{label}</Text>
        </View>
      )}
    </PressableBox>
  );
}

const VARIANTS: Record<NonNullable<ButtonProps["variant"]>, { box: ViewStyle; text: TextStyle }> = {
  primary: { box: { backgroundColor: colors.pine, minHeight: 52 }, text: { color: colors.white } },
  secondary: { box: { backgroundColor: colors.white, borderWidth: 2, borderColor: colors.pine }, text: { color: colors.pine } },
  outline: {
    box: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 16 },
    text: { color: colors.bark, fontFamily: fonts.bodyMedium, fontSize: 15 },
  },
  outlinePine: {
    box: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.pine, paddingHorizontal: 16 },
    text: { color: colors.pine, fontFamily: fonts.bodySemiBold, fontSize: 15 },
  },
};

/** Text link. Pine for navigation ("Accounts"), Chestnut underlined for secondary actions ("Done for now"). */
export function LinkButton({
  label,
  onPress,
  tone = "pine",
  underline,
  center,
}: {
  label: string;
  onPress: () => void;
  tone?: "pine" | "chestnut";
  underline?: boolean;
  center?: boolean;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="link" hitSlop={12} style={[styles.link, center && styles.center]}>
      <Text
        style={[
          styles.linkText,
          { color: tone === "chestnut" ? colors.chestnut : colors.pine },
          underline && styles.underline,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** suggestion: Claude's unsure pick, "<Category>?" (Fern background, Pine border). */
type ChipTone = "neutral" | "review" | "positive" | "suggestion";

export function Chip({
  label,
  tone = "neutral",
  selected,
  onPress,
  size = "small",
}: {
  label: string;
  tone?: ChipTone;
  selected?: boolean;
  onPress?: () => void;
  /** small: status chips in rows. large: selectable chips (filters, form choices). */
  size?: "small" | "large";
}) {
  const toneStyle =
    tone === "review"
      ? styles.chipReview
      : tone === "positive"
        ? styles.chipPositive
        : tone === "suggestion"
          ? styles.chipSuggestion
          : styles.chipNeutral;
  const textColor = tone === "review" ? colors.chestnut : tone === "positive" || tone === "suggestion" ? colors.pine : colors.bark;
  const body = (
    <View style={[styles.chip, size === "large" && styles.chipLarge, toneStyle, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, size === "large" && styles.chipTextLarge, { color: selected ? colors.white : textColor }]}>
        {label}
      </Text>
    </View>
  );
  if (!onPress) return body;
  return (
    <PressableBox
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!selected }}
      style={styles.chipTouch}
    >
      {body}
    </PressableBox>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle | ViewStyle[] }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** A big number with a label under it (Activity counts, import results). */
export function NumberTile({
  value,
  label,
  tone = "neutral",
  style,
}: {
  value: string;
  label: string;
  /** neutral: Birch tile. review: review colours. outlined: white with a light border (Activity). */
  tone?: "neutral" | "review" | "outlinedReview" | "outlinedPositive";
  style?: ViewStyle;
}) {
  const box =
    tone === "review"
      ? { backgroundColor: colors.reviewChip }
      : tone === "neutral"
        ? { backgroundColor: colors.tile }
        : { backgroundColor: colors.white, borderWidth: 1.5, borderColor: tone === "outlinedReview" ? colors.reviewChip : colors.fern };
  const valueColor = tone === "review" || tone === "outlinedReview" ? colors.chestnut : tone === "outlinedPositive" ? colors.pine : colors.bark;
  const labelColor = tone === "review" ? colors.chestnut : colors.bark;
  return (
    <View style={[styles.tile, box, style]}>
      <Text style={[styles.tileValue, { color: valueColor }]}>{value}</Text>
      <Text style={[styles.tileLabel, { color: labelColor }]}>{label}</Text>
    </View>
  );
}

export function Heading({ children }: { children: ReactNode }) {
  return (
    <Text style={styles.heading} accessibilityRole="header">
      {children}
    </Text>
  );
}

export function Body({ children, secondary, style }: { children: ReactNode; secondary?: boolean; style?: TextStyle }) {
  return <Text style={[styles.body, secondary && styles.secondaryText, style]}>{children}</Text>;
}

/** "‹ Activity" back link, then a large title (screens pushed on the Activity stack). */
export function ScreenHeader({ title, backLabel, onBack, intro }: { title: string; backLabel: string; onBack: () => void; intro?: string }) {
  return (
    <View style={styles.screenHeader}>
      <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={`Back to ${backLabel}`} hitSlop={12} style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={colors.pine} />
        <Text style={styles.backText}>{backLabel}</Text>
      </Pressable>
      <Heading>{title}</Heading>
      {intro ? <Body secondary>{intro}</Body> : null}
    </View>
  );
}

/** "Cancel" on the left, centred title (forms such as Add account). */
export function FormHeader({ title, onCancel }: { title: string; onCancel: () => void }) {
  return (
    <View style={styles.formHeader}>
      <Pressable onPress={onCancel} accessibilityRole="button" hitSlop={12} style={styles.cancel}>
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
      <Text style={styles.formTitle} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.cancel} />
    </View>
  );
}

/** A short message and Retry (spec: every network error, never silent). */
export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card style={styles.errorCard}>
      <Body>{message}</Body>
      {onRetry ? <Button label="Try again" variant="secondary" onPress={onRetry} /> : null}
    </Card>
  );
}

export function Loading() {
  return (
    <View style={styles.loading} accessibilityLabel="Loading">
      <ActivityIndicator color={colors.pine} />
    </View>
  );
}

export const NETWORK_ERROR = "Couldn't reach Budget Buddy. Check your connection and try again.";

const styles = StyleSheet.create({
  button: { minHeight: minTouch, borderRadius: radius.button, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  buttonInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  dim: { opacity: 0.6 },
  buttonText: { fontFamily: fonts.bodySemiBold, fontSize: 17 },
  link: { minHeight: minTouch, justifyContent: "center" },
  center: { alignSelf: "center" },
  linkText: { fontFamily: fonts.bodySemiBold, fontSize: 16 },
  underline: { textDecorationLine: "underline", fontFamily: fonts.bodyMedium },
  chipTouch: { minHeight: minTouch, justifyContent: "center" },
  chip: { borderRadius: radius.chip, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, alignSelf: "flex-start" },
  chipLarge: { paddingHorizontal: 16, paddingVertical: 9, borderWidth: 1.5 },
  chipNeutral: { backgroundColor: colors.white, borderColor: colors.line },
  chipReview: { backgroundColor: colors.reviewChip, borderColor: colors.reviewChip },
  chipPositive: { backgroundColor: colors.fern, borderColor: colors.fern },
  chipSuggestion: { backgroundColor: colors.fern, borderColor: colors.pine },
  chipSelected: { backgroundColor: colors.pine, borderColor: colors.pine },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 13 },
  chipTextLarge: { fontSize: 16, fontFamily: fonts.body },
  card: { backgroundColor: colors.card, borderRadius: radius.card, padding: 16, gap: 8 },
  tile: { flex: 1, borderRadius: 14, padding: 12, gap: 2 },
  tileValue: { fontFamily: fonts.heading, fontSize: 24 },
  tileLabel: { fontFamily: fonts.body, fontSize: 14 },
  heading: { fontFamily: fonts.heading, fontSize: 32, color: colors.bark },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.bark },
  secondaryText: { color: colors.barkSecondary, fontSize: 14 },
  screenHeader: { gap: 8, marginBottom: 4 },
  back: { flexDirection: "row", alignItems: "center", minHeight: minTouch, alignSelf: "flex-start", gap: 2 },
  backText: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.pine },
  formHeader: { flexDirection: "row", alignItems: "center", minHeight: minTouch, marginBottom: 8 },
  cancel: { minWidth: 64, minHeight: minTouch, justifyContent: "center" },
  cancelText: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.pine },
  formTitle: { flex: 1, textAlign: "center", fontFamily: fonts.heading, fontSize: 20, color: colors.bark },
  errorCard: { gap: 12 },
  loading: { padding: 24, alignItems: "center" },
});
