import { Text, type TextProps } from "react-native";
import { styled } from "nativewind";
import { useThemeColor } from "@/hooks/useThemeColor";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
};

const StyledText = styled(Text);

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "default",
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");

  const typeClasses = {
    default: "text-base leading-6",
    title: "text-4xl font-bold leading-8",
    defaultSemiBold: "text-base leading-6 font-semibold",
    subtitle: "text-xl font-bold",
    link: "text-base leading-7 text-blue-600",
  };

  return (
    <StyledText
      style={[{ color }, style]}
      className={typeClasses[type]}
      {...rest}
    />
  );
}
