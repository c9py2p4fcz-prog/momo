import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Transaction } from '@/db/schema';
import { useRouter } from 'expo-router';

interface TransactionItemProps {
  transaction: Transaction & {
    category_name?: string;
    category_icon?: string;
    category_color?: string;
    account_name?: string;
  };
  onDelete?: (id: string) => void;
  onPress?: () => void;
}

export function TransactionItem({ transaction, onDelete, onPress }: TransactionItemProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const isIncome = transaction.type === 'income';
  const sign = isIncome ? '+' : '-';
  const amountColor = isIncome ? theme.success : theme.text;

  const iconName = (transaction.category_icon || 'pricetag-outline') as any;
  const iconBg = transaction.category_color || theme.tint;

  const formatDate = (dateStr: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (dateStr === today) return 'Днес';
      if (dateStr === yesterday) return 'Вчера';

      const d = new Date(dateStr);
      const months = ['яну', 'фев', 'мар', 'апр', 'май', 'юни', 'юли', 'авг', 'сеп', 'окт', 'ное', 'дек'];
      return `${d.getDate()} ${months[d.getMonth()]}`;
    } catch {
      return dateStr;
    }
  };

  const handleOpenReceipt = () => {
    if (transaction.receipt_id) {
      router.push(`/receipt/${transaction.receipt_id}`);
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: theme.cardBackground, opacity: pressed ? 0.8 : 1 },
      ]}
      onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: iconBg + '20' }]}>
        <Ionicons name={iconName} size={22} color={iconBg} />
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.topRow}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {transaction.title}
          </Text>
          <Text style={[styles.amount, { color: amountColor }]}>
            {sign}
            {transaction.amount.toFixed(2)} {transaction.currency}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.metaRow}>
            <Text style={[styles.subText, { color: theme.textSecondary }]}>
              {transaction.category_name || 'Без категория'}
            </Text>
            {transaction.account_name && (
              <>
                <Text style={[styles.dot, { color: theme.textTertiary }]}>•</Text>
                <Text style={[styles.subText, { color: theme.textSecondary }]}>
                  {transaction.account_name}
                </Text>
              </>
            )}
            <Text style={[styles.dot, { color: theme.textTertiary }]}>•</Text>
            <Text style={[styles.subText, { color: theme.textSecondary }]}>
              {formatDate(transaction.date)}
            </Text>
          </View>

          {transaction.receipt_id ? (
            <Pressable
              onPress={handleOpenReceipt}
              style={[styles.receiptBadge, { backgroundColor: theme.tint + '15' }]}>
              <Ionicons name="receipt-outline" size={12} color={theme.tint} />
              <Text style={[styles.receiptBadgeText, { color: theme.tint }]}>Бележка</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {onDelete && (
        <Pressable
          style={styles.deleteButton}
          onPress={() => onDelete(transaction.id)}
          hitSlop={8}>
          <Ionicons name="trash-outline" size={18} color={theme.danger} />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginVertical: 4,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  detailsContainer: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  subText: {
    fontSize: 13,
  },
  dot: {
    marginHorizontal: 4,
    fontSize: 12,
  },
  receiptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
    marginLeft: 6,
  },
  receiptBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  deleteButton: {
    marginLeft: 8,
    padding: 6,
  },
});
