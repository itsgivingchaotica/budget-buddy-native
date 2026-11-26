import React from "react";
import { PlaceholderScreen } from "@/components/brand/PlaceholderScreen";

/** LG1: Plan tab placeholder until M2 (plan drafting, goals, bills). */
export default function PlanScreen() {
  return (
    <PlaceholderScreen
      title="Plan"
      subtitle="Your monthly plan: category budgets, bills and goals, drafted with the coach."
      comingIn="Coming in milestone 2."
    />
  );
}
