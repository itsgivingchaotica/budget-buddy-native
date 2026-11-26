import React, { useCallback, useMemo, useState } from "react";
import { Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { openBrowserAsync } from "expo-web-browser";
import { Body, Button, Card, Chip, ErrorBox, Heading, LinkButton, Loading, NETWORK_ERROR, NumberTile } from "@/components/brand/ui";
import { colors, fonts, minTouch, radius } from "@/constants/Theme";
import {
  countTransactions,
  listAccounts,
  listCategories,
  listTransactions,
  templateUrl,
  type Account,
  type Transaction,
} from "@/utils/activityApi";
import { earliestDay, formatCount, formatDayWithWeekday, formatMoney, groupByDay, plural } from "@/utils/format";

const PER_PAGE = 50;

/** C2: Activity tab root (docs/product/SCREENS_ACTIVITY.md §1). */
export default function ActivityScreen() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({});
  const [reviewCount, setReviewCount] = useState(0);
  const [filter, setFilter] = useState<number | null>(null);
  const [rows, setRows] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(
    async (accountId: number | null) => {
      setLoading(true);
      setError(null);
      try {
        const [accs, cats, toReview, first] = await Promise.all([
          listAccounts(),
          listCategories(),
          countTransactions({ needs_review: true }),
          listTransactions({ page: 1, per_page: PER_PAGE, ...(accountId ? { account_id: accountId } : {}) }),
        ]);
        setAccounts(accs);
        setCategoryNames(Object.fromEntries(cats.map((c) => [c.slug, c.name])));
        setReviewCount(toReview);
        setRows(first.transactions);
        setTotal(first.total);
        setPage(1);
      } catch {
        setError(NETWORK_ERROR);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Reload whenever the tab comes back into view (e.g. after an import).
  useFocusEffect(
    useCallback(() => {
      load(filter);
    }, [load, filter])
  );

  const loadMore = async () => {
    if (loadingMore || rows.length >= total) return;
    setLoadingMore(true);
    try {
      const next = await listTransactions({ page: page + 1, per_page: PER_PAGE, ...(filter ? { account_id: filter } : {}) });
      setRows((current) => [...current, ...next.transactions]);
      setPage(page + 1);
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setLoadingMore(false);
    }
  };

  const accountName = useMemo(() => Object.fromEntries((accounts ?? []).map((a) => [a.id, a.name])), [accounts]);
  const sections = useMemo(() => groupByDay(rows), [rows]);

  const noAccounts = !!accounts && accounts.length === 0;
  // Import with no accounts opens Add account first (it leads on to Import).
  const openImport = () => router.push(noAccounts ? "/activity/new-account" : "/activity/import");
  const dataThrough = earliestDay((accounts ?? []).map((a) => a.data_through));

  const header = (
    <View style={styles.headerBlock}>
      <View style={styles.titleRow}>
        <Heading>Activity</Heading>
        <Button label="Import" icon="push-outline" onPress={openImport} style={styles.importButton} />
      </View>
      {accounts ? (
        <View style={styles.summaryRow}>
          <Body secondary>
            {plural(accounts.length, "account")}
            {dataThrough ? ` · data through ${formatDayWithWeekday(dataThrough)}` : ""}
          </Body>
          <LinkButton label="Accounts" onPress={() => router.push("/activity/accounts")} />
        </View>
      ) : null}
      {reviewCount > 0 ? (
        // A "transfers to confirm" tile joins this row with TR1 (transfer matching).
        <View style={styles.tiles}>
          <Pressable
            style={styles.tileTouch}
            onPress={() => router.push("/activity/review")}
            accessibilityRole="button"
            accessibilityLabel={`${reviewCount} to review`}
          >
            <NumberTile value={formatCount(reviewCount)} label="to review" tone="outlinedReview" />
          </Pressable>
          <View style={styles.tileTouch} />
        </View>
      ) : null}
      {accounts && accounts.length > 1 ? (
        <View style={styles.chips} accessibilityLabel="Filter by account">
          <Chip size="large" label="All" selected={filter === null} onPress={() => setFilter(null)} />
          {accounts.map((a) => (
            <Chip size="large" key={a.id} label={a.name} selected={filter === a.id} onPress={() => setFilter(a.id)} />
          ))}
        </View>
      ) : null}
      {error ? <ErrorBox message={error} onRetry={() => load(filter)} /> : null}
    </View>
  );

  if (loading && !accounts) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.pad}>{header}</View>
        <Loading />
      </SafeAreaView>
    );
  }

  if (noAccounts && !error) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={[styles.pad, styles.gap]}>
          {header}
          <Card style={styles.emptyCard}>
            <Body>Add an account, then import a CSV export from your bank to see your transactions here.</Body>
            <Button label="Add your first account" onPress={() => router.push("/activity/new-account")} />
            <LinkButton
              label="Download the CSV template"
              tone="chestnut"
              underline
              center
              onPress={() => openBrowserAsync(templateUrl())}
            />
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <SectionList
        sections={sections}
        keyExtractor={(t) => String(t.id)}
        contentContainerStyle={styles.pad}
        ListHeaderComponent={header}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => load(filter)} tintColor={colors.pine} />}
        renderSectionHeader={({ section }) => (
          <Text style={styles.day} accessibilityRole="header">
            {formatDayWithWeekday(section.title).toUpperCase()}
          </Text>
        )}
        renderItem={({ item }) => (
          <TransactionRow
            transaction={item}
            accountName={accountName[item.account_id]}
            categoryName={item.category ? categoryNames[item.category] ?? item.category : null}
          />
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !loading && !error ? (
            <Card>
              <Body>No transactions yet. Import a CSV export from your bank.</Body>
            </Card>
          ) : null
        }
        ListFooterComponent={loadingMore ? <Loading /> : null}
        stickySectionHeadersEnabled={false}
      />
    </SafeAreaView>
  );
}

function TransactionRow({
  transaction,
  accountName,
  categoryName,
}: {
  transaction: Transaction;
  accountName?: string;
  categoryName: string | null;
}) {
  const money = formatMoney(transaction.amount);
  return (
    <View style={styles.row} accessible accessibilityLabel={`${transaction.description}, ${money.text}`}>
      <View style={styles.rowMain}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {transaction.description}
        </Text>
        <View style={styles.rowMeta}>
          {transaction.needs_review || !categoryName ? (
            <Chip label="Needs review" tone="review" />
          ) : (
            <Chip label={categoryName} tone="positive" />
          )}
          {accountName ? <Body secondary>{accountName}</Body> : null}
        </View>
      </View>
      <Text style={[styles.amount, { color: money.direction === "in" ? colors.pine : colors.bark }]}>{money.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.birch },
  pad: { padding: 20, paddingBottom: 40 },
  gap: { gap: 16 },
  emptyCard: { padding: 20, gap: 14 },
  headerBlock: { gap: 12, marginBottom: 8 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  importButton: { paddingHorizontal: 16 },
  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  tiles: { flexDirection: "row", gap: 12 },
  tileTouch: { flex: 1 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  day: { fontFamily: fonts.bodySemiBold, fontSize: 13, letterSpacing: 0.8, color: colors.dayHeader, marginTop: 16, marginBottom: 8 },
  row: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    minHeight: minTouch,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowMain: { flex: 1, gap: 4 },
  rowTitle: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.bark },
  rowMeta: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  amount: { fontFamily: fonts.bodySemiBold, fontSize: 17 },
});
