import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Account } from '@/db/schema';

interface BalanceCardProps {
  totalBalance: number;
  monthIncome: number;
  monthExpense: number;
  currency?: string;
  accounts: Account[];
  onAddTransaction: (type: 'expense' | 'income') => void;
  onScanReceipt: () => void;
}

export function BalanceOverviewCard({
  totalBalance,
  monthIncome,
  monthExpense,
  currency = 'BGN',
  accounts,
  onAddTransaction,
  onScanReceipt,
}: BalanceCardProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.mainCard, { backgroundColor: theme.cardBackground }]}>
      {/* Top Total Balance */}
      <View style={styles.balanceHeader}>
        <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>Общ баланс</Text>
        <Text style={[styles.balanceValue, { color: theme.text }]}>
          {totalBalance.toLocaleString('bg-BG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
          <Text style={[styles.currency, { color: theme.tint }]}>{currency}</Text>
        </Text>
      </View>

      {/* Income / Expense Stats */}
      <View style={[styles.statsRow, { borderTopColor: theme.border, borderBottomColor: theme.border }]}>
        <View style={styles.statItem}>
          <View style={[styles.statIconBadge, { backgroundColor: theme.success + '15' }]}>
            <Ionicons name="arrow-down-outline" size={16} color={theme.success} />
          </View>
          <View>
            <Text style={[styles.statTitle, { color: theme.textSecondary }]}>Приходи (този месец)</Text>
            <Text style={[styles.statAmount, { color: theme.success }]}>
              +{monthIncome.toFixed(2)} {currency}
            </Text>
          </View>
        </View>

        <View style={[styles.dividerVertical, { backgroundColor: theme.border }]} />

        <View style={styles.statItem}>
          <View style={[styles.statIconBadge, { backgroundColor: theme.danger + '15' }]}>
            <Ionicons name="arrow-up-outline" size={16} color={theme.danger} />
          </View>
          <View>
            <Text style={[styles.statTitle, { color: theme.textSecondary }]}>Разходи (този месец)</Text>
            <Text style={[styles.statAmount, { color: theme.danger }]}>
              -{monthExpense.toFixed(2)} {currency}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Action Buttons */}
      <View style={styles.actionsRow}>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: theme.tint, opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={onScanReceipt}>
          <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Снимай бележка</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.secondaryActionBtn,
            { backgroundColor: theme.danger + '15', opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={() => onAddTransaction('expense')}>
          <Ionicons name="remove-circle-outline" size={18} color={theme.danger} />
          <Text style={[styles.secondaryActionText, { color: theme.danger }]}>Разход</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.secondaryActionBtn,
            { backgroundColor: theme.success + '15', opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={() => onAddTransaction('income')}>
          <Ionicons name="add-circle-outline" size={18} color={theme.success} />
          <Text style={[styles.secondaryActionText, { color: theme.success }]}>Приход</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  balanceHeader: {
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceValue: {
    fontSize: 34,
    fontWeight: '800',
  },
  currency: {
    fontSize: 22,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  statAmount: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  dividerVertical: {
    width: 1,
    height: 36,
    marginHorizontal: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 4,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
