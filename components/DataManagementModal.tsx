import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useFinance } from '@/db/FinanceContext';

interface DataManagementModalProps {
  visible: boolean;
  onClose: () => void;
}

export function DataManagementModal({ visible, onClose }: DataManagementModalProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const {
    transactions,
    receipts,
    bills,
    clearAllTransactions,
    clearAllBills,
    clearAllReceipts,
    resetAccountBalances,
    resetEverything,
  } = useFinance();

  const [isProcessing, setIsProcessing] = useState(false);

  const confirmAction = (title: string, message: string, onConfirm: () => Promise<void>) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const ok = window.confirm(title + '\n\n' + message);
      if (ok) {
        executeAction(onConfirm);
      }
    } else {
      Alert.alert(title, message, [
        { text: 'Отказ', style: 'cancel' },
        {
          text: 'Изтрий / Занули',
          style: 'destructive',
          onPress: () => executeAction(onConfirm),
        },
      ]);
    }
  };

  const executeAction = async (action: () => Promise<void>) => {
    try {
      setIsProcessing(true);
      await action();
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('Действието беше изпълнено успешно.');
      } else {
        Alert.alert('Готово', 'Действието беше изпълнено успешно.');
      }
    } catch (error) {
      console.error('Error executing reset action:', error);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('Грешка при обработка на данните.');
      } else {
        Alert.alert('Грешка', 'Неуспешна операция.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: theme.cardBackground }]}>
          {/* Sheet Handle */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: theme.border }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                Управление и нулиране
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                Изчистете данни поотделно или направете пълен рестарт
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.background }]}>
              <Ionicons name="close" size={20} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {isProcessing && (
              <View style={[styles.loadingBox, { backgroundColor: theme.tint + '15' }]}>
                <ActivityIndicator color={theme.tint} size="small" />
                <Text style={[styles.loadingText, { color: theme.tint }]}>
                  Изчистване на данните...
                </Text>
              </View>
            )}

            {/* SECTION: Поотделно изчистване */}
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              ИЗЧИСТВАНЕ ПООТДЕЛНО
            </Text>

            <View style={[styles.cardGroup, { backgroundColor: theme.background, borderColor: theme.border }]}>
              {/* Clear Transactions */}
              <Pressable
                style={({ pressed }) => [
                  styles.actionRow,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={() =>
                  confirmAction(
                    'Изчистване на всички транзакции',
                    'Сигурни ли сте, че искате да изтриете всички ' + transactions.length + ' транзакции? Сметките и салдата ще се запазят.',
                    clearAllTransactions
                  )
                }>
                <View style={[styles.actionIconWrap, { backgroundColor: '#FF3B301A' }]}>
                  <Ionicons name="swap-horizontal-outline" size={20} color="#FF3B30" />
                </View>
                <View style={styles.actionInfo}>
                  <Text style={[styles.actionLabel, { color: theme.text }]}>
                    Изчисти само транзакциите
                  </Text>
                  <Text style={[styles.actionSub, { color: theme.textTertiary }]}>
                    {transactions.length} {transactions.length === 1 ? 'запис' : 'записа'} в историята
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
              </Pressable>

              <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />

              {/* Clear Receipts */}
              <Pressable
                style={({ pressed }) => [
                  styles.actionRow,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={() =>
                  confirmAction(
                    'Изчистване на касовите бележки',
                    'Сигурни ли сте, че искате да изтриете всички ' + receipts.length + ' сканирани касови бележки от архива?',
                    clearAllReceipts
                  )
                }>
                <View style={[styles.actionIconWrap, { backgroundColor: '#FF95001A' }]}>
                  <Ionicons name="receipt-outline" size={20} color="#FF9500" />
                </View>
                <View style={styles.actionInfo}>
                  <Text style={[styles.actionLabel, { color: theme.text }]}>
                    Изчисти само касовите бележки
                  </Text>
                  <Text style={[styles.actionSub, { color: theme.textTertiary }]}>
                    {receipts.length} {receipts.length === 1 ? 'бележка' : 'бележки'} в архива
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
              </Pressable>

              <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />

              {/* Clear Bills */}
              <Pressable
                style={({ pressed }) => [
                  styles.actionRow,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={() =>
                  confirmAction(
                    'Изчистване на периодичните сметки',
                    'Сигурни ли сте, че искате да изтриете всички ' + bills.length + ' месечни сметки?',
                    clearAllBills
                  )
                }>
                <View style={[styles.actionIconWrap, { backgroundColor: '#AF52DE1A' }]}>
                  <Ionicons name="flash-outline" size={20} color="#AF52DE" />
                </View>
                <View style={styles.actionInfo}>
                  <Text style={[styles.actionLabel, { color: theme.text }]}>
                    Изчисти само сметките
                  </Text>
                  <Text style={[styles.actionSub, { color: theme.textTertiary }]}>
                    {bills.length} {bills.length === 1 ? 'месечна сметка' : 'месечни сметки'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
              </Pressable>

              <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />

              {/* Reset Balances to 0 */}
              <Pressable
                style={({ pressed }) => [
                  styles.actionRow,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={() =>
                  confirmAction(
                    'Зануляване на балансите',
                    'Сигурни ли сте, че искате да нулирате наличните пари във всички банкови сметки и портфейли на 0.00 BGN?',
                    () => resetAccountBalances(0)
                  )
                }>
                <View style={[styles.actionIconWrap, { backgroundColor: '#007AFF1A' }]}>
                  <Ionicons name="wallet-outline" size={20} color="#007AFF" />
                </View>
                <View style={styles.actionInfo}>
                  <Text style={[styles.actionLabel, { color: theme.text }]}>
                    Занули балансите на сметките (0.00 лв)
                  </Text>
                  <Text style={[styles.actionSub, { color: theme.textTertiary }]}>
                    Банкова сметка, кеш и спестявания стават 0.00 BGN
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
              </Pressable>
            </View>

            {/* SECTION: Пълно нулиране и фабрични данни */}
            <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 24 }]}>
              ГЛОБАЛНО НУЛИРАНЕ
            </Text>

            <View style={[styles.cardGroup, { backgroundColor: theme.background, borderColor: theme.border }]}>
              {/* Total Zero Reset */}
              <Pressable
                style={({ pressed }) => [
                  styles.actionRow,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={() =>
                  confirmAction(
                    'Пълно зануляване (Чист старт)',
                    'ВНИМАНИЕ: Това действие ще изтрие ВСИЧКИ транзакции, касови бележки и сметки, и ще нулира всички баланси на точно 0.00 BGN. Искате ли чист старт?',
                    () => resetEverything('zero')
                  )
                }>
                <View style={[styles.actionIconWrap, { backgroundColor: '#FF3B3025' }]}>
                  <Ionicons name="trash" size={20} color="#FF3B30" />
                </View>
                <View style={styles.actionInfo}>
                  <Text style={[styles.actionLabel, { color: '#FF3B30', fontWeight: '700' }]}>
                    Пълно зануляване (0.00 BGN)
                  </Text>
                  <Text style={[styles.actionSub, { color: theme.textTertiary }]}>
                    Чист старт: празна история и баланс 0.00 лв
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#FF3B30" />
              </Pressable>

              <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />

              {/* Restore Factory Demo Data */}
              <Pressable
                style={({ pressed }) => [
                  styles.actionRow,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={() =>
                  confirmAction(
                    'Възстановяване на демо данни',
                    'Искате ли да презаредите фабричните примерни данни за демонстрация (примерни транзакции и баланси)?',
                    () => resetEverything('demo')
                  )
                }>
                <View style={[styles.actionIconWrap, { backgroundColor: '#34C7591A' }]}>
                  <Ionicons name="refresh-outline" size={20} color="#34C759" />
                </View>
                <View style={styles.actionInfo}>
                  <Text style={[styles.actionLabel, { color: theme.text }]}>
                    Възстанови примерни данни (Демо)
                  </Text>
                  <Text style={[styles.actionSub, { color: theme.textTertiary }]}>
                    Зарежда първоначалните примерни сметки и разходи
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
              </Pressable>
            </View>

            <View style={styles.safeBottomSpacer} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'web' ? 34 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentScroll: {
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  cardGroup: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  actionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionInfo: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  actionSub: {
    fontSize: 12,
    marginTop: 2,
  },
  rowDivider: {
    height: 1,
    marginLeft: 68,
  },
  safeBottomSpacer: {
    height: 30,
  },
});