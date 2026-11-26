import React, { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { AccountSheet } from "@/components/account/AccountSheet";
import { ErrorBox, Loading, NETWORK_ERROR, PressableBox } from "@/components/brand/ui";
import { AccountsNote, BillsCard, GoalsCard, LeftToSpendCard, NoPlanCard, StateNote } from "@/components/home/HomeCards";
import { OutlookSheet } from "@/components/home/OutlookSheet";
import { colors, fonts } from "@/constants/Theme";
import { useLogout } from "@/hooks/useSession";
import { useBudgetStore } from "@/store/budget";
import { initial } from "@/utils/account";
import { listAccounts } from "@/utils/activityApi";
import { formatDayWithWeekday, parseDay } from "@/utils/format";
import { longDate, stateMessage } from "@/utils/home";
import { markBillPaid, markBillUnpaid, weekOutlook, type BillItem, type WeekOutlook } from "@/utils/homeApi";

/**
 * C3: Home, the W1 outlook (bb-server/docs/product/SPEC_LEFT_TO_SPEND.md §5,
 * screens/Home-No-Plan.png). Left to spend this week, bills in the next 7
 * days with mark paid, goal contributions this week. The app does no maths:
 * every figure is the API's, formatted by utils/money.ts.
 * C9: the account button (top right) opens the account sheet with Log out.
 */
export default function HomeScreen() {
  const router = useRouter();
  const firstName = useBudgetStore((s) => s.user?.given_name);
  const email = useBudgetStore((s) => s.user?.email);
  const logout = useLogout();
  const [accountOpen, setAccountOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [outlook, setOutlook] = useState<WeekOutlook | null>(null);
  const [accountCount, setAccountCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await weekOutlook();
      setOutlook(data);
      setError(null);
      if (data.state === "no_plan") setAccountCount((await listAccounts()).length);
    } catch {
      setError(NETWORK_ERROR);
    }
  }, []);

  // Reload whenever Home is shown: after an import, a review or a plan change.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const toggleBill = async (bill: BillItem) => {
    const key = `${bill.obligation_id}:${bill.due_on}`;
    setBusyKey(key);
    try {
      if (bill.paid) await markBillUnpaid(bill.obligation_id, bill.due_on);
      else await markBillPaid(bill.obligation_id, bill.due_on);
      await load();
    } catch {
      setError("Couldn't save that. Check your connection and try again.");
    } finally {
      setBusyKey(null);
    }
  };

  const message = outlook ? stateMessage(outlook.state, outlook.data_through, outlook.today) : null;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
      >
        <View style={styles.titleRow}>
          <View style={styles.titles}>
            {outlook ? <Text style={styles.date}>{longDate(outlook.today)}</Text> : null}
            <Text style={styles.title} accessibilityRole="header">
              Your week
            </Text>
          </View>
          <PressableBox onPress={() => setAccountOpen(true)} accessibilityRole="button" accessibilityLabel="Account" style={styles.avatar}>
            <Text style={styles.avatarText}>{initial(firstName, email)}</Text>
          </PressableBox>
        </View>

        {error ? <ErrorBox message={error} onRetry={load} /> : null}
        {!outlook && !error ? <Loading /> : null}

        {outlook?.state === "no_plan" ? (
          <>
            <NoPlanCard onPlan={() => router.push("/coach")} />
            {accountCount !== null ? (
              <AccountsNote
                count={accountCount}
                dataThrough={outlook.data_through ? formatDayWithWeekday(outlook.data_through, parseDay(outlook.today)) : null}
                onImport={() => router.push("/activity")}
              />
            ) : null}
          </>
        ) : null}

        {outlook && outlook.state !== "no_plan" ? (
          <>
            {message ? (
              <StateNote
                message={message}
                action={outlook.state === "stale" ? "Import new transactions" : undefined}
                onAction={() => router.push("/activity")}
              />
            ) : null}
            <LeftToSpendCard
              outlook={outlook}
              onDetails={() => setDetailsOpen(true)}
              onMonth={() => router.push("/plan")}
              onReview={() => router.push("/activity/review")}
            />
            <BillsCard bills={outlook.bills_due.items} today={outlook.today} busyKey={busyKey} onToggle={toggleBill} />
            <GoalsCard goals={outlook.goal_contributions} />
            <OutlookSheet outlook={outlook} visible={detailsOpen} onClose={() => setDetailsOpen(false)} />
          </>
        ) : null}
      </ScrollView>
      <AccountSheet
        visible={accountOpen}
        firstName={firstName}
        email={email}
        onClose={() => setAccountOpen(false)}
        onLogout={() => {
          setAccountOpen(false);
          logout();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.birch },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  titles: { flex: 1, gap: 2 },
  date: { fontFamily: fonts.body, fontSize: 15, color: colors.barkSecondary },
  title: { fontFamily: fonts.heading, fontSize: 32, color: colors.bark },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.pine, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.white },
});
