import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useFinance } from '@/db/FinanceContext';
import { Bill } from '@/db/schema';
import { BillModal } from '@/components/BillModal';
import { UtilityBillUploadModal } from '@/components/UtilityBillUploadModal';
import {
  PROVIDERS_CONFIG,
  openProviderPayPortal,
} from '@/services/utilitySyncService';

export default function BillsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'web' ? 24 : 0);
  const {
    accounts,
    bills,
    addNewTransaction,
    toggleBillStatus,
    deleteBillById,
  } = useFinance();

  const [modalVisible, setModalVisible] = useState(false);
  const [uploadInvoiceVisible, setUploadInvoiceVisible] = useState(false);

  const { totalMonthly, totalPaid, totalUnpaid } = useMemo(() => {
    let monthly = 0;
    let paid = 0;
    let unpaid = 0;

    for (const b of bills) {
      monthly += b.amount;
      if (b.is_paid === 1) {
        paid += b.amount;
      } else {
        unpaid += b.amount;
      }
    }

    return { totalMonthly: monthly, totalPaid: paid, totalUnpaid: unpaid };
  }, [bills]);

  const handleDeleteBill = (id: string, title: string) => {
    Alert.alert(
      'Изтриване на сметка',
      `Сигурни ли сте, че искате да премахнете "${title}" от периодичните сметки?`,
      [
        { text: 'Отказ', style: 'cancel' },
        {
          text: 'Изтрий',
          style: 'destructive',
          onPress: () => deleteBillById(id),
        },
      ]
    );
  };

  const getProviderInfo = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('a1') || t.includes('а1')) return PROVIDERS_CONFIG.a1;
    if (t.includes('viva') || t.includes('виваком')) return PROVIDERS_CONFIG.vivacom;
    if (t.includes('yettel') || t.includes('йеттел') || t.includes('теленор')) return PROVIDERS_CONFIG.yettel;
    if (t.includes('електрохолд') || t.includes('чез') || t.includes('electrohold')) return PROVIDERS_CONFIG.electrohold;
    if (t.includes('evn') || t.includes('евн')) return PROVIDERS_CONFIG.evn;
    if (t.includes('енерго') || t.includes('energo')) return PROVIDERS_CONFIG.energo_pro;
    if (t.includes('вода') || t.includes('софийска вода') || t.includes('вик')) return PROVIDERS_CONFIG.sofiyska_voda;
    if (t.includes('топло') || t.includes('парно')) return PROVIDERS_CONFIG.toplofikacia;
    return null;
  };

  const handlePayOnline = async (item: Bill) => {
    const provider = getProviderInfo(item.title);
    const pKey = provider ? provider.key : 'a1';

    try {
      await openProviderPayPortal(pKey);
      Alert.alert(
        'Плащане на сметка',
        `Успешно ли платихте "${item.title}" (${item.amount.toFixed(2)} ${item.currency})?`,
        [
          { text: 'Не още', style: 'cancel' },
          {
            text: 'Да, маркирай като платена',
            onPress: async () => {
              await toggleBillStatus(item.id, true);
              const primaryAcc = accounts[0]?.id || 'acc_checking';
              await addNewTransaction({
                id: `tx_pay_${Date.now()}`,
                account_id: primaryAcc,
                category_id: item.category_id || 'cat_bills',
                amount: item.amount,
                currency: item.currency,
                title: `Платена сметка: ${item.title}`,
                type: 'expense',
                date: new Date().toISOString().split('T')[0],
                notes: 'Платена онлайн през портала на доставчика',
              });
            },
          },
        ]
      );
    } catch (err) {
      console.error('Failed to open payment portal:', err);
    }
  };

  const renderHeader = () => (
    <View>
      {/* Top Summary Card */}
      <View style={[styles.summaryCard, { backgroundColor: theme.cardBackground }]}>
        <Text style={[styles.summaryHeader, { color: theme.textSecondary }]}>
          Месечни периодични сметки
        </Text>
        <Text style={[styles.summaryTotal, { color: theme.text }]}>
          {totalMonthly.toFixed(2)} <Text style={{ fontSize: 20, color: theme.tint }}>BGN</Text>
        </Text>

        <View style={[styles.summaryBreakdown, { borderTopColor: theme.border }]}>
          <View style={styles.breakdownItem}>
            <View style={[styles.dot, { backgroundColor: theme.success }]} />
            <Text style={[styles.breakdownLabel, { color: theme.textSecondary }]}>
              Платени: <Text style={{ color: theme.success, fontWeight: '700' }}>{totalPaid.toFixed(2)} BGN</Text>
            </Text>
          </View>

          <View style={styles.breakdownItem}>
            <View style={[styles.dot, { backgroundColor: theme.warning }]} />
            <Text style={[styles.breakdownLabel, { color: theme.textSecondary }]}>
              Чакащи: <Text style={{ color: theme.warning, fontWeight: '700' }}>{totalUnpaid.toFixed(2)} BGN</Text>
            </Text>
          </View>
        </View>

        {/* Action Buttons: Scan invoice or Add manually */}
        <View style={styles.actionButtonsRow}>
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: theme.tint, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => setUploadInvoiceVisible(true)}>
            <Ionicons name="document-text-outline" size={17} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>Сканирай фактура (PDF / Снимка)</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionBtnSecondary,
              { backgroundColor: theme.tint + '15', opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => setModalVisible(true)}>
            <Ionicons name="add-circle-outline" size={17} color={theme.tint} />
            <Text style={[styles.actionBtnTextSecondary, { color: theme.tint }]}>
              Ръчно въвеждане на сметка
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Section Title */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Списък със сметки</Text>
        <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
          {bills.length} {bills.length === 1 ? 'сметка' : 'сметки'}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        <FlatList
          data={bills}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isPaid = item.is_paid === 1;
            const iconName = (item.category_icon || 'receipt-outline') as any;
            const iconColor = item.category_color || theme.tint;
            const provider = getProviderInfo(item.title);

            return (
              <View style={[styles.billCard, { backgroundColor: theme.cardBackground }]}>
                <View style={styles.billMainRow}>
                  {/* Due day badge */}
                  <View
                    style={[
                      styles.dueDayBadge,
                      { backgroundColor: isPaid ? theme.border : theme.tint + '18' },
                    ]}>
                    <Text
                      style={[
                        styles.dueDayNumber,
                        { color: isPaid ? theme.textTertiary : theme.tint },
                      ]}>
                      {item.due_day}
                    </Text>
                    <Text
                      style={[
                        styles.dueDaySub,
                        { color: isPaid ? theme.textTertiary : theme.tint },
                      ]}>
                      число
                    </Text>
                  </View>

                  {/* Icon */}
                  <View style={[styles.billIconWrap, { backgroundColor: iconColor + '20' }]}>
                    <Ionicons name={iconName} size={22} color={iconColor} />
                  </View>

                  {/* Details */}
                  <View style={styles.billDetails}>
                    <Text
                      style={[
                        styles.billTitle,
                        {
                          color: isPaid ? theme.textSecondary : theme.text,
                          textDecorationLine: isPaid ? 'line-through' : 'none',
                        },
                      ]}
                      numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[styles.billCategory, { color: theme.textTertiary }]}>
                      {item.category_name || 'Битови сметки'}
                      {item.notes ? ` • ${item.notes}` : ''}
                    </Text>
                  </View>

                  {/* Amount & Status Button */}
                  <View style={styles.billRightCol}>
                    <Text
                      style={[
                        styles.billAmount,
                        { color: isPaid ? theme.textSecondary : theme.text },
                      ]}>
                      {item.amount.toFixed(2)} {item.currency}
                    </Text>

                    <Pressable
                      style={[
                        styles.statusToggle,
                        {
                          backgroundColor: isPaid ? theme.success + '20' : theme.background,
                          borderColor: isPaid ? theme.success : theme.border,
                        },
                      ]}
                      onPress={() => toggleBillStatus(item.id, !isPaid)}>
                      <Ionicons
                        name={isPaid ? 'checkmark-circle' : 'ellipse-outline'}
                        size={14}
                        color={isPaid ? theme.success : theme.textTertiary}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          { color: isPaid ? theme.success : theme.textSecondary },
                        ]}>
                        {isPaid ? 'Платена' : 'Маркирай'}
                      </Text>
                    </Pressable>
                  </View>

                  {/* Delete button */}
                  <Pressable
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteBill(item.id, item.title)}
                    hitSlop={8}>
                    <Ionicons name="trash-outline" size={16} color={theme.danger} />
                  </Pressable>
                </View>

                {/* Optional Action: Pay online button if unpaid & known provider */}
                {!isPaid && provider && (
                  <View style={[styles.billBottomActionRow, { borderTopColor: theme.border + '60' }]}>
                    <Pressable
                      style={[styles.payOnlineRowBtn, { backgroundColor: provider.color + '15' }]}
                      onPress={() => handlePayOnline(item)}>
                      <Ionicons name="card-outline" size={14} color={provider.color} />
                      <Text style={[styles.payOnlineRowBtnText, { color: provider.color }]}>
                        Плати онлайн ({provider.shortName})
                      </Text>
                      <Ionicons name="open-outline" size={12} color={provider.color} />
                    </Pressable>
                  </View>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={[styles.emptyCard, { backgroundColor: theme.cardBackground }]}>
              <Ionicons name="receipt-outline" size={48} color={theme.textTertiary} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                Няма въведени сметки
              </Text>
              <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                Сканирайте PDF фактура или добавете ръчно сметка за ток, вода, телефон, интернет или наем.
              </Text>
            </View>
          }
        />

        {/* Floating Add Bill Button */}
        <View style={styles.fabContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.fab,
              { backgroundColor: theme.tint, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <BillModal visible={modalVisible} onClose={() => setModalVisible(false)} />
      <UtilityBillUploadModal
        visible={uploadInvoiceVisible}
        onClose={() => setUploadInvoiceVisible(false)}
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
  summaryCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryHeader: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  summaryTotal: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 14,
  },
  summaryBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  breakdownLabel: {
    fontSize: 13,
  },
  actionButtonsRow: {
    gap: 10,
    marginTop: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    gap: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  actionBtnTextSecondary: {
    fontSize: 14,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 13,
  },
  listContent: {
    paddingBottom: 80,
  },
  billCard: {
    borderRadius: 18,
    marginVertical: 6,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  billMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDayBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  dueDayNumber: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 18,
  },
  dueDaySub: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  billIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  billDetails: {
    flex: 1,
  },
  billTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  billCategory: {
    fontSize: 12,
    marginTop: 2,
  },
  billRightCol: {
    alignItems: 'flex-end',
    marginRight: 6,
  },
  billAmount: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 6,
  },
  billBottomActionRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  payOnlineRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  payOnlineRowBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySub: {
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
