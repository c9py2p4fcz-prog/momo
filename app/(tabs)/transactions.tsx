import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useFinance } from '@/db/FinanceContext';
import { TransactionItem } from '@/components/TransactionItem';
import { ExpenseModal } from '@/components/ExpenseModal';
import { TransactionType } from '@/db/schema';

export default function TransactionsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'web' ? 24 : 0);
  const { transactions, deleteTransactionById } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<TransactionType>('expense');

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesFilter = filterType === 'all' || tx.type === filterType;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        tx.title.toLowerCase().includes(q) ||
        (tx.category_name && tx.category_name.toLowerCase().includes(q)) ||
        (tx.notes && tx.notes.toLowerCase().includes(q));
      return matchesFilter && matchesSearch;
    });
  }, [transactions, filterType, searchQuery]);

  // Totals for filtered transactions
  const { totalFilteredAmount } = useMemo(() => {
    let total = 0;
    for (const t of filteredTransactions) {
      if (t.type === 'income') total += t.amount;
      else total -= t.amount;
    }
    return { totalFilteredAmount: total };
  }, [filteredTransactions]);

  const handleOpenAdd = (type: TransactionType) => {
    setModalType(type);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Ionicons name="search" size={18} color={theme.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Търсене по име, категория, бележка..."
            placeholderTextColor={theme.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={theme.textTertiary} />
            </Pressable>
          )}
        </View>

        {/* Filter Pills */}
        <View style={styles.filtersRow}>
          {(['all', 'expense', 'income'] as const).map((filter) => {
            const labels = {
              all: 'Всички',
              expense: 'Разходи',
              income: 'Приходи',
            };
            const isSelected = filterType === filter;
            return (
              <Pressable
                key={filter}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? theme.tint : theme.cardBackground,
                    borderColor: isSelected ? theme.tint : theme.border,
                  },
                ]}
                onPress={() => setFilterType(filter)}>
                <Text
                  style={[
                    styles.filterText,
                    { color: isSelected ? '#FFFFFF' : theme.textSecondary },
                  ]}>
                  {labels[filter]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* List Header / Stats */}
        <View style={styles.statsSummaryRow}>
          <Text style={[styles.countText, { color: theme.textSecondary }]}>
            {filteredTransactions.length}{' '}
            {filteredTransactions.length === 1 ? 'транзакция' : 'транзакции'}
          </Text>
          <Text
            style={[
              styles.sumText,
              { color: totalFilteredAmount >= 0 ? theme.success : theme.danger },
            ]}>
            {totalFilteredAmount >= 0 ? '+' : ''}
            {totalFilteredAmount.toFixed(2)} BGN
          </Text>
        </View>

        {/* Transactions List */}
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TransactionItem
              transaction={item}
              onDelete={deleteTransactionById}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={[styles.emptyContainer, { backgroundColor: theme.cardBackground }]}>
              <Ionicons name="search-outline" size={48} color={theme.textTertiary} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>Няма намерени резултати</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                {searchQuery
                  ? 'Опитайте с друго търсене'
                  : 'Добавете първата си транзакция с бутона +'}
              </Text>
            </View>
          }
        />

        {/* Floating Action Button */}
        <View style={styles.fabContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.fab,
              { backgroundColor: theme.tint, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => handleOpenAdd('expense')}>
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

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
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statsSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  countText: {
    fontSize: 13,
    fontWeight: '500',
  },
  sumText: {
    fontSize: 14,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 80,
  },
  emptyContainer: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 20,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
});
