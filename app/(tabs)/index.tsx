import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Pressable,
  RefreshControl,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useFinance } from '@/db/FinanceContext';
import { BalanceOverviewCard } from '@/components/StatCard';
import { TransactionItem } from '@/components/TransactionItem';
import { ExpenseModal } from '@/components/ExpenseModal';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isIOS =
    Platform.OS === 'ios' ||
    (Platform.OS === 'web' &&
      typeof navigator !== 'undefined' &&
      /iPad|iPhone|iPod/.test(navigator.userAgent));
  const topInset = Math.max(insets.top, isIOS ? 54 : (Platform.OS === 'web' ? 24 : 0));

  const {
    loading,
    totalBalance,
    monthIncome,
    monthExpense,
    accounts,
    transactions,
    bills,
    unpaidBillsTotal,
    unpaidBillsCount,
    refreshData,
    deleteTransactionById,
  } = useFinance();

  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'expense' | 'income'>('expense');

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleAddTransaction = (type: 'expense' | 'income') => {
    setModalType(type);
    setModalVisible(true);
  };

  const recentTransactions = transactions.slice(0, 6);

  // Today's formatted date in Bulgarian
  const todayFormatted = new Intl.DateTimeFormat('bg-BG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background, paddingTop: topInset }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <View>
            <Text style={[styles.dateText, { color: theme.textTertiary }]}>
              {todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1)}
            </Text>
            <Text style={[styles.greetingText, { color: theme.text }]}>Лични финанси</Text>
          </View>

          <Pressable
            style={[styles.scannerShortcut, { backgroundColor: theme.cardBackground }]}
            onPress={() => router.push('/(tabs)/scan')}>
            <Ionicons name="scan-outline" size={22} color={theme.tint} />
          </Pressable>
        </View>

        {/* Main Balance Overview */}
        <BalanceOverviewCard
          totalBalance={totalBalance}
          monthIncome={monthIncome}
          monthExpense={monthExpense}
          currency="BGN"
          accounts={accounts}
          onAddTransaction={handleAddTransaction}
          onScanReceipt={() => router.push('/(tabs)/scan')}
        />

        {/* Unpaid Bills Alert banner if any */}
        {unpaidBillsCount > 0 && (
          <Pressable
            style={[styles.billsAlertCard, { backgroundColor: theme.warning + '18', borderColor: theme.warning }]}
            onPress={() => router.push('/(tabs)/bills')}>
            <View style={[styles.billsAlertIcon, { backgroundColor: theme.warning }]}>
              <Ionicons name="alert" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.billsAlertContent}>
              <Text style={[styles.billsAlertTitle, { color: theme.text }]}>
                {unpaidBillsCount} чакащи сметки за плащане
              </Text>
              <Text style={[styles.billsAlertSubtitle, { color: theme.textSecondary }]}>
                Общо {unpaidBillsTotal.toFixed(2)} BGN за този месец
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
          </Pressable>
        )}

        {/* Accounts Horizontal Scroll */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Сметки & Портфейли</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.accountsRow}>
          {accounts.map((account) => (
            <View
              key={account.id}
              style={[styles.accountCard, { backgroundColor: theme.cardBackground }]}>
              <View style={[styles.accountIconWrap, { backgroundColor: account.color + '20' }]}>
                <Ionicons name={account.icon as any} size={20} color={account.color} />
              </View>
              <Text style={[styles.accountName, { color: theme.textSecondary }]} numberOfLines={1}>
                {account.name}
              </Text>
              <Text style={[styles.accountBalance, { color: theme.text }]}>
                {account.balance.toFixed(2)} {account.currency}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Последни транзакции</Text>
          <Pressable onPress={() => router.push('/(tabs)/transactions')}>
            <Text style={[styles.seeAllText, { color: theme.tint }]}>Виж всички</Text>
          </Pressable>
        </View>

        {recentTransactions.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.cardBackground }]}>
            <Ionicons name="receipt-outline" size={40} color={theme.textTertiary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Няма записани транзакции
            </Text>
          </View>
        ) : (
          recentTransactions.map((tx) => (
            <TransactionItem
              key={tx.id}
              transaction={tx}
              onDelete={deleteTransactionById}
            />
          ))
        )}
      </ScrollView>

      {/* Add Transaction Modal */}
      <ExpenseModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        initialType={modalType}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 30,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 2,
  },
  scannerShortcut: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  billsAlertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  billsAlertIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  billsAlertContent: {
    flex: 1,
  },
  billsAlertTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  billsAlertSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  accountsRow: {
    gap: 12,
    paddingBottom: 10,
  },
  accountCard: {
    width: 140,
    padding: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  accountIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  accountName: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  accountBalance: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
