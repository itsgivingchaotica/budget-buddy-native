import React from "react";
import { SvgXml } from "react-native-svg";
import { MASCOT_SVG } from "@/components/brand/mascotSvg";

/** The Budget Buddy mascot (D-020: celebrations, empty states, onboarding, coach). */
export function Mascot({ size = 120 }: { size?: number }) {
  return <SvgXml xml={MASCOT_SVG} width={size} height={size} accessibilityLabel="Budget Buddy mascot" />;
}
