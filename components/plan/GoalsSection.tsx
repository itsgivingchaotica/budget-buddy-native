// C8: Plan → Goals (SCREENS_PLAN §5, screens/Plan-Goals.png). Every figure
// comes from GET /goals (G2's `progress`); the app only formats.
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button, Card, LinkButton } from "@/components/brand/ui";
import { colors, fonts, radius } from "@/constants/Theme";
import { amountWithoutSign } from "@/utils/format";
import { dollarsDown, dollarsUp } from "@/utils/money";
import { longDay, shortMonth } from "@/utils/plan";
import type { DebtProgress, Goal, Milestone, SavingProgress } from "@/utils/planApi";

const TYPE_LABEL = { upcoming_payment: "Upcoming payment", purchase: "Purchase", debt_payoff: "Debt" } as const;

/** The card's lines, as text (pure, tested). */
export function goalLines(goal: Goal): {
  subtitle: string;
  chip: { label: string; good: boolean } | null;
  headline: string;
  headlineSuffix: string;
  percent: string;
  weekly: string | null;
  payoff: string | null;
  whatIf: string | null;
} {
  if (goal.progress.kind === "debt") {
    const p = goal.progress as DebtProgress;
    const apr = goal.apr ? `${Number(goal.apr)}% APR` : "";
    const payoff = p.payoff.never_pays_off
      ? `At ${dollarsDown(goal.monthly_payment ?? "0")} a month this never gets paid off: the payment doesn't cover the interest. · ${amountWithoutSign(p.interest_this_month)} interest this month`
      : `Paid off in ${shortMonth(p.payoff.payoff_month!)} at ${dollarsDown(goal.monthly_payment ?? "0")} a month · ${amountWithoutSign(p.interest_this_month)} interest this month`;
    const w = p.what_if;
    const whatIf =
      w.never_pays_off || !w.payoff_month
        ? null
        : `Paying ${dollarsDown(w.extra)} more a month: paid off ${shortMonth(w.payoff_month)}${w.interest_saved ? `, saving ${dollarsDown(w.interest_saved)} in interest` : ""}.`;
    return {
      subtitle: `Debt · ${apr}`,
      chip: { label: p.on_track ? "On track" : "Behind", good: p.on_track },
      headline: dollarsUp(p.balance),
      headlineSuffix: "left to pay",
      percent: `${p.percent_paid}% paid`,
      weekly: null,
      payoff,
      whatIf,
    };
  }
  const p = goal.progress as SavingProgress;
  const dated = !!goal.target_date;
  let weekly: string | null = null;
  if (dated && p.needed_per_week && Number(p.remaining) > 0)
    weekly = p.past_target_date
      ? `The date has passed: ${dollarsUp(p.remaining)} still to save.`
      : `Set aside ${dollarsUp(p.needed_per_week)} a week to get there on time.`;
  if (Number(p.remaining) <= 0) weekly = "Target reached.";
  return {
    subtitle: `${TYPE_LABEL[goal.goal_type]}${dated ? ` · by ${longDay(goal.target_date!)}` : ""}`,
    chip: p.on_track === null ? null : { label: p.on_track ? "On track" : "Behind", good: p.on_track },
    headline: dollarsDown(p.saved),
    headlineSuffix: `of ${dollarsDown(p.target)}`,
    percent: `${p.percent}%`,
    weekly,
    payoff: null,
    whatIf: null,
  };
}

export function GoalsSection({ goals, onAction, onCoach }: { goals: Goal[]; onAction: (goal: Goal) => void; onCoach: () => void }) {
  if (goals.length === 0) {
    return (
      <Card style={styles.card}>
        <Text style={styles.body}>Goals come from your plan. Ask your coach to add one.</Text>
        <LinkButton label="Ask your coach" onPress={onCoach} />
      </Card>
    );
  }
  return (
    <View style={styles.wrap}>
      {goals.map((goal) => (
        <GoalCard key={goal.id} goal={goal} onAction={() => onAction(goal)} />
      ))}
    </View>
  );
}

function GoalCard({ goal, onAction }: { goal: Goal; onAction: () => void }) {
  const l = goalLines(goal);
  const share = goal.progress.kind === "debt" ? (goal.progress as DebtProgress).percent_paid : (goal.progress as SavingProgress).percent;
  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <View style={styles.titleBlock}>
          <Text style={styles.name} accessibilityRole="header">
            {goal.name}
          </Text>
          <Text style={styles.sub}>{l.subtitle}</Text>
        </View>
        {l.chip ? (
          <View style={[styles.chip, { backgroundColor: l.chip.good ? colors.fern : colors.reviewChip }]}>
            <Text style={[styles.chipText, { color: l.chip.good ? colors.pine : colors.chestnut }]}>{l.chip.label}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.amountRow}>
        <Text style={styles.amount}>
          {l.headline} <Text style={styles.amountSuffix}>{l.headlineSuffix}</Text>
        </Text>
        <Text style={styles.percent}>{l.percent}</Text>
      </View>
      <View style={styles.bar} accessibilityLabel={l.percent}>
        <View style={[styles.barFill, { width: `${Math.min(100, share)}%` }]} />
      </View>
      <Milestones items={goal.progress.milestones} />
      {l.weekly ? <Text style={styles.line}>{l.weekly}</Text> : null}
      {l.payoff ? <Text style={styles.line}>{l.payoff}</Text> : null}
      {l.whatIf ? <Text style={[styles.line, styles.whatIf]}>{l.whatIf}</Text> : null}
      <Button label={goal.progress.kind === "debt" ? "Update balance" : "Set aside money"} variant="secondary" onPress={onAction} style={styles.action} />
    </Card>
  );
}

function Milestones({ items }: { items: Milestone[] }) {
  return (
    <View style={styles.milestones}>
      {items.map((m) => (
        <View key={m.percent} style={styles.milestone} accessible accessibilityLabel={`${m.percent}% ${m.reached ? "reached" : "not reached yet"}`}>
          <View style={[styles.dot, m.reached && styles.dotFilled]} />
          <Text style={styles.milestoneText}>{m.percent}%</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  card: { padding: 20, gap: 10 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 23, color: colors.bark },
  top: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  titleBlock: { flex: 1, gap: 2 },
  name: { fontFamily: fonts.heading, fontSize: 24, color: colors.bark },
  sub: { fontFamily: fonts.body, fontSize: 15, color: colors.barkSecondary },
  chip: { borderRadius: radius.chip, paddingHorizontal: 12, paddingVertical: 5 },
  chipText: { fontFamily: fonts.bodySemiBold, fontSize: 14 },
  amountRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  amount: { fontFamily: fonts.heading, fontSize: 24, color: colors.bark },
  amountSuffix: { fontFamily: fonts.body, fontSize: 17, color: colors.barkSecondary },
  percent: { fontFamily: fonts.body, fontSize: 16, color: colors.barkSecondary },
  bar: { height: 10, borderRadius: 5, backgroundColor: colors.tile, overflow: "hidden" },
  barFill: { height: 10, borderRadius: 5, backgroundColor: colors.moss },
  milestones: { flexDirection: "row", justifyContent: "space-between" },
  milestone: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: colors.pine },
  dotFilled: { backgroundColor: colors.pine },
  milestoneText: { fontFamily: fonts.body, fontSize: 14, color: colors.barkSecondary },
  line: { fontFamily: fonts.body, fontSize: 16, lineHeight: 23, color: colors.bark },
  whatIf: { color: colors.pine },
  action: { alignSelf: "flex-start" },
});
