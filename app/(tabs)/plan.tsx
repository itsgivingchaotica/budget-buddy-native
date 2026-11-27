import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ErrorBox, Loading, NETWORK_ERROR, PressableBox } from "@/components/brand/ui";
import { NoPlanCard } from "@/components/home/HomeCards";
import { BillSheet } from "@/components/plan/BillSheet";
import { BillsSection } from "@/components/plan/BillsSection";
import { BudgetSheet } from "@/components/plan/BudgetSheet";
import { BudgetsSection } from "@/components/plan/BudgetsSection";
import { ContributionSheet } from "@/components/plan/ContributionSheet";
import { GoalsSection } from "@/components/plan/GoalsSection";
import { colors, fonts, minTouch, radius } from "@/constants/Theme";
import { toCents } from "@/utils/money";
import { isoDay, shiftMonth } from "@/utils/plan";
import {
  budgetMonth,
  listBills,
  listGoals,
  undoContribution,
  type Bill,
  type BillList,
  type BudgetMonth,
  type Goal,
} from "@/utils/planApi";

export type Section = "budgets" | "bills" | "goals";
const SECTIONS: { key: Section; label: string }[] = [
  { key: "budgets", label: "Budgets" },
  { key: "bills", label: "Bills" },
  { key: "goals", label: "Goals" },
];
// Remembers the last section while the app is open (SCREENS_PLAN §2).
let lastSection: Section = "budgets";

/**
 * C8: the Plan tab (bb-server/docs/product/SCREENS_PLAN.md, screens/Plan-*.png):
 * Budgets (the monthly dashboard, change a budget), Bills (add, edit, mark
 * paid, archive), Goals (set aside, update balance, undo). The manual path
 * into the same tables the coach drafts. The app does no maths.
 */
export default function PlanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ section?: string }>();
  const [section, setSectionState] = useState<Section>(lastSection);
  const [month, setMonth] = useState<string | null>(null); // null: this month
  const [budgets, setBudgets] = useState<BudgetMonth | null>(null);
  const [thisMonth, setThisMonth] = useState<string | null>(null);
  const [bills, setBills] = useState<BillList | null>(null);
  const [goals, setGoals] = useState<Goal[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [budgetTarget, setBudgetTarget] = useState<{ slug: string; name: string; amount: number } | null>(null);
  const [billOpen, setBillOpen] = useState(false);
  const [billEditing, setBillEditing] = useState<Bill | null>(null);
  const [goalTarget, setGoalTarget] = useState<Goal | null>(null);
  const [toast, setToast] = useState<{ message: string; goalId: number; contributionId: number } | null>(null);

  const setSection = (s: Section) => {
    lastSection = s;
    setSectionState(s);
  };

  useEffect(() => {
    if (params.section === "budgets" || params.section === "bills" || params.section === "goals") setSection(params.section);
  }, [params.section]);

  const load = useCallback(async (forMonth: string | null = null) => {
    try {
      const [b, bl, g] = await Promise.all([budgetMonth(forMonth ?? undefined), listBills(), listGoals()]);
      setBudgets(b);
      if (forMonth === null) setThisMonth(b.month);
      setBills(bl);
      setGoals(g);
      setError(null);
    } catch {
      setError(NETWORK_ERROR);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(month);
    }, [load, month])
  );

  const today = bills?.today ?? isoDay(new Date());
  const isCurrentMonth = !month || month === thisMonth;
  const noPlan = budgets !== null && isCurrentMonth && !budgets.plan_exists && (bills?.obligations.length ?? 0) === 0 && (goals?.length ?? 0) === 0;
  const loaded = budgets && bills && goals;

  const goMonth = (by: number) => {
    const base = budgets?.month ?? thisMonth;
    if (!base) return;
    const next = shiftMonth(base, by);
    const target = thisMonth && next >= thisMonth ? null : next;
    setMonth(target); // the focus effect reloads for the new month
  };

  const afterChange = () => load(month);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load(month);
              setRefreshing(false);
            }}
          />
        }
      >
        <View style={styles.titleRow}>
          <View style={styles.titles}>
            <Text style={styles.title} accessibilityRole="header">
              Your plan
            </Text>
            <Text style={styles.subtitle}>Budgets, bills and goals</Text>
          </View>
          <PressableBox onPress={() => router.push("/coach")} accessibilityRole="button" accessibilityLabel="Ask coach" style={styles.ask}>
            <Text style={styles.askText}>Ask coach</Text>
          </PressableBox>
        </View>

        {error ? <ErrorBox message={error} onRetry={() => load(month)} /> : null}
        {!loaded && !error ? <Loading /> : null}

        {loaded && noPlan ? <NoPlanCard onPlan={() => router.push("/onboarding")} /> : null}

        {loaded && !noPlan ? (
          <>
            <View style={styles.segments} accessibilityRole="tablist">
              {SECTIONS.map((s) => (
                <PressableBox
                  key={s.key}
                  onPress={() => setSection(s.key)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: section === s.key }}
                  accessibilityLabel={s.label}
                  style={[styles.segment, section === s.key && styles.segmentActive]}
                >
                  <Text style={[styles.segmentText, section === s.key && styles.segmentTextActive]}>{s.label}</Text>
                </PressableBox>
              ))}
            </View>

            {section === "budgets" ? (
              <BudgetsSection
                data={budgets}
                today={today}
                isCurrentMonth={isCurrentMonth}
                onPrev={() => goMonth(-1)}
                onNext={() => goMonth(1)}
                onEdit={(row) => setBudgetTarget({ slug: row.category, name: row.name, amount: Math.floor(toCents(row.budget) / 100) })}
                onAddBudget={(row) => setBudgetTarget({ slug: row.category, name: row.name, amount: 0 })}
                onBills={() => setSection("bills")}
                onReview={() => router.push("/activity/review")}
              />
            ) : null}
            {section === "bills" ? (
              <BillsSection
                data={bills}
                onOpen={(bill) => {
                  setBillEditing(bill);
                  setBillOpen(true);
                }}
                onAdd={() => {
                  setBillEditing(null);
                  setBillOpen(true);
                }}
              />
            ) : null}
            {section === "goals" ? <GoalsSection goals={goals} onAction={setGoalTarget} onCoach={() => router.push("/coach")} /> : null}
          </>
        ) : null}
      </ScrollView>

      <BudgetSheet
        target={budgetTarget}
        onClose={() => setBudgetTarget(null)}
        onSaved={() => {
          setBudgetTarget(null);
          afterChange();
        }}
      />
      <BillSheet
        open={billOpen}
        bill={billEditing}
        today={today}
        onClose={() => setBillOpen(false)}
        onChanged={() => {
          setBillOpen(false);
          afterChange();
        }}
      />
      <ContributionSheet
        goal={goalTarget}
        today={today}
        onClose={() => setGoalTarget(null)}
        onSaved={(goal, contributionId, message) => {
          setGoalTarget(null);
          setToast({ message, goalId: goal.id, contributionId });
          afterChange();
        }}
      />
      {toast ? (
        <UndoToast
          message={toast.message}
          onUndo={async () => {
            const t = toast;
            setToast(null);
            try {
              await undoContribution(t.goalId, t.contributionId);
            } catch {
              setError("Couldn't undo that. Check your connection and try again.");
            }
            afterChange();
          }}
          onDone={() => setToast(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}

export const UNDO_MS = 5000;

/** "Set aside for Car fund · Undo", for 5 seconds (SCREENS_PLAN §5). */
export function UndoToast({ message, onUndo, onDone }: { message: string; onUndo: () => void; onDone: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    const timer = setTimeout(onDone, UNDO_MS);
    return () => clearTimeout(timer);
  }, [opacity, onDone]);
  return (
    <Animated.View style={[styles.toast, { opacity }]} accessibilityLiveRegion="polite">
      <Text style={styles.toastText}>{message}</Text>
      <PressableBox onPress={onUndo} accessibilityRole="button" accessibilityLabel="Undo" style={styles.undo}>
        <Text style={styles.undoText}>Undo</Text>
      </PressableBox>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.birch },
  content: { padding: 20, gap: 16, paddingBottom: 100 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  titles: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.heading, fontSize: 32, color: colors.bark },
  subtitle: { fontFamily: fonts.body, fontSize: 15, color: colors.barkSecondary },
  ask: { minHeight: minTouch, paddingHorizontal: 18, borderRadius: radius.chip, borderWidth: 1.5, borderColor: colors.pine, justifyContent: "center" },
  askText: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.pine },
  segments: { flexDirection: "row", backgroundColor: colors.line, borderRadius: radius.button + 2, padding: 4 },
  segment: { flex: 1, minHeight: minTouch, borderRadius: radius.button, alignItems: "center", justifyContent: "center" },
  segmentActive: { backgroundColor: colors.pine },
  segmentText: { fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.bark },
  segmentTextActive: { color: colors.white, fontFamily: fonts.bodySemiBold },
  toast: { position: "absolute", left: 16, right: 16, bottom: 16, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.bark, borderRadius: radius.card, paddingLeft: 16 },
  toastText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.white },
  undo: { minHeight: minTouch + 8, paddingHorizontal: 18, justifyContent: "center" },
  undoText: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.fern },
});
