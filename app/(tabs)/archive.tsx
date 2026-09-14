import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  Alert,
  SafeAreaView,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useFinance } from '@/db/FinanceContext';
import { ReceiptCard } from '@/components/ReceiptCard';
import { useRouter } from 'expo-router';

export default function ArchiveScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'web' ? 24 : 0);

  const { receipts, refreshData, deleteReceiptById } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const filteredReceipts = useMemo(() => {
    if (!searchQuery.trim()) return receipts;
    const q = searchQuery.toLowerCase().trim();
    return receipts.filter(
      (r) =>
        r.store_name.toLowerCase().includes(q) ||
        r.receipt_date.includes(q) ||
        r.total_amount.toString().includes(q)
    );
  }, [receipts, searchQuery]);

  const totalSpentOnReceipts = useMemo(() => {
    return filteredReceipts.reduce((sum, r) => sum + r.total_amount, 0);
  }, [filteredReceipts]);

  const handleDeleteReceipt = (id: string, filename: string) => {
    Alert.alert(
      'Изтриване на бележка',
      'Сигурни ли сте, че искате да изтриете тази касова бележка от телефона? Файлът ще бъде премахнат от локалната памет.',
      [
        { text: 'Отказ', style: 'cancel' },
        {
          text: 'Изтрий',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReceiptById(id, filename);
            } catch (err) {
              console.error('Failed to delete receipt:', err);
              Alert.alert('Грешка', 'Неуспешно изтриване на бележката.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        {/* Top Summary Banner */}
        <View style={[styles.summaryBanner, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.summaryCol}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Архивирани бележки</Text>
            <Text style={[styles.summaryVal, { color: theme.text }]}>
              {receipts.length} <Text style={{ fontSize: 16, fontWeight: '500' }}>бр.</Text>
            </Text>
          </View>

          <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />

          <View style={styles.summaryCol}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Обща сума</Text>
            <Text style={[styles.summaryVal, { color: theme.tint }]}>
              {totalSpentOnReceipts.toFixed(2)}{' '}
              <Text style={{ fontSize: 16, fontWeight: '500' }}>BGN</Text>
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Ionicons name="search" size={18} color={theme.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Търсене по търговец, дата или сума..."
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

        {/* Receipts List */}
        <FlatList
          data={filteredReceipts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ReceiptCard
              receipt={item}
              onDelete={handleDeleteReceipt}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={[styles.emptyBox, { backgroundColor: theme.cardBackground }]}>
              <Ionicons name="images-outline" size={54} color={theme.textTertiary} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                {searchQuery ? 'Няма намерени бележки' : 'Архивът е празен'}
              </Text>
              <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                {searchQuery
                  ? 'Опитайте да потърсите с друго име на търговец'
                  : 'Заснемете първата си касова бележка. Тя ще се съхранява сигурно само на вашия iPhone.'}
              </Text>

              {!searchQuery && (
                <Pressable
                  style={[styles.scanFirstBtn, { backgroundColor: theme.tint }]}
                  onPress={() => router.push('/(tabs)/scan')}>
                  <Ionicons name="camera-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.scanFirstBtnText}>Сканирай сега</Text>
                </Pressable>
              )}
            </View>
          }
        />
      </View>
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
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  summaryVal: {
    fontSize: 22,
    fontWeight: '800',
  },
  summaryDivider: {
    width: 1,
    height: 36,
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
  listContent: {
    paddingBottom: 30,
  },
  emptyBox: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  scanFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 8,
  },
  scanFirstBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
