import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useFinance } from '@/db/FinanceContext';
import { TransactionType } from '@/db/schema';

interface ExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  initialType?: TransactionType;
  initialAmount?: number;
  initialTitle?: string;
  initialCategoryId?: string;
  initialReceiptId?: string;
  initialDate?: string;
}

export function ExpenseModal({
  visible,
  onClose,
  initialType = 'expense',
  initialAmount,
  initialTitle = '',
  initialCategoryId,
  initialReceiptId,
  initialDate,
}: ExpenseModalProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { accounts, categories, addNewTransaction } = useFinance();

  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState(initialTitle);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (visible) {
      setType(initialType);
      setAmount(initialAmount ? initialAmount.toFixed(2) : '');
      setTitle(initialTitle || '');
      setDate(initialDate || new Date().toISOString().split('T')[0]);
      setNotes('');
      setErrorMessage('');

      if (accounts.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accounts[0].id);
      }

      if (initialCategoryId) {
        setSelectedCategoryId(initialCategoryId);
      } else {
        const matchingCat = categories.find((c) => c.type === initialType);
        if (matchingCat) setSelectedCategoryId(matchingCat.id);
      }
    }
  }, [visible, initialType, initialAmount, initialTitle, initialCategoryId, initialDate, accounts, categories]);

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleSave = async () => {
    setErrorMessage('');
    const cleanAmount = amount.trim().replace(',', '.');
    const parsedAmount = parseFloat(cleanAmount);
    if (!cleanAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Моля въведете валидна сума в лева (напр. 25.50)');
      return;
    }

    const fallbackCat = filteredCategories[0]?.id || (type === 'expense' ? 'cat_supermarket' : 'cat_salary');
    const targetCatId = selectedCategoryId || fallbackCat;
    const catObj = categories.find((c) => c.id === targetCatId);

    const finalTitle = title.trim() || catObj?.name || (type === 'expense' ? 'Разход' : 'Приход');
    const targetAccountId = selectedAccountId || accounts[0]?.id || 'acc_bank_1';

    try {
      await addNewTransaction({
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        account_id: targetAccountId,
        category_id: targetCatId,
        type,
        amount: parsedAmount,
        currency: 'BGN',
        title: finalTitle,
        date,
        notes: notes.trim() || undefined,
        receipt_id: initialReceiptId,
      });

      onClose();
    } catch (error) {
      console.error('Failed to create transaction:', error);
      setErrorMessage('Възникна проблем при записването на транзакцията');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}>
        <View style={[styles.modalSheet, { backgroundColor: theme.cardBackground }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {initialReceiptId ? 'Бележка -> Разход' : type === 'expense' ? 'Нов разход' : 'Нов приход'}
            </Text>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
              <Ionicons name="close-circle" size={28} color={theme.textTertiary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Type Toggle */}
            {!initialReceiptId && (
              <View style={[styles.typeToggleContainer, { backgroundColor: theme.background }]}>
                <Pressable
                  style={[
                    styles.typeBtn,
                    type === 'expense' && { backgroundColor: theme.danger, shadowOpacity: 0.1 },
                  ]}
                  onPress={() => {
                    setType('expense');
                    const firstExpCat = categories.find((c) => c.type === 'expense');
                    if (firstExpCat) setSelectedCategoryId(firstExpCat.id);
                  }}>
                  <Text
                    style={[
                      styles.typeBtnText,
                      { color: type === 'expense' ? '#FFFFFF' : theme.textSecondary },
                    ]}>
                    Разход
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.typeBtn,
                    type === 'income' && { backgroundColor: theme.success, shadowOpacity: 0.1 },
                  ]}
                  onPress={() => {
                    setType('income');
                    const firstIncCat = categories.find((c) => c.type === 'income');
                    if (firstIncCat) setSelectedCategoryId(firstIncCat.id);
                  }}>
                  <Text
                    style={[
                      styles.typeBtnText,
                      { color: type === 'income' ? '#FFFFFF' : theme.textSecondary },
                    ]}>
                    Приход
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Amount Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Сума</Text>
              <View style={[styles.amountInputRow, { borderBottomColor: theme.border }]}>
                <TextInput
                  style={[styles.amountInput, { color: type === 'income' ? theme.success : theme.text }]}
                  placeholder="0.00"
                  placeholderTextColor={theme.textTertiary}
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                  autoFocus={!initialAmount}
                />
                <Text style={[styles.amountCurrency, { color: theme.tint }]}>BGN</Text>
              </View>
            </View>

            {/* Title / Merchant */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                {type === 'expense' ? 'Търговец / Описание' : 'Източник на прихода'}
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
                ]}
                placeholder={type === 'expense' ? 'напр. Billa, Кафе, Наем...' : 'напр. Заплата, Премия...'}
                placeholderTextColor={theme.textTertiary}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Account Selection */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Сметка</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
                {accounts.map((acc) => {
                  const isSelected = selectedAccountId === acc.id;
                  return (
                    <Pressable
                      key={acc.id}
                      style={[
                        styles.pill,
                        {
                          backgroundColor: isSelected ? theme.tint : theme.background,
                          borderColor: isSelected ? theme.tint : theme.border,
                        },
                      ]}
                      onPress={() => setSelectedAccountId(acc.id)}>
                      <Ionicons
                        name={acc.icon as any}
                        size={16}
                        color={isSelected ? '#FFFFFF' : theme.text}
                      />
                      <Text
                        style={[
                          styles.pillText,
                          { color: isSelected ? '#FFFFFF' : theme.text },
                        ]}>
                        {acc.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Category Selection */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Категория</Text>
              <View style={styles.categoriesGrid}>
                {filteredCategories.map((cat) => {
                  const isSelected = selectedCategoryId === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      style={[
                        styles.categoryItem,
                        {
                          backgroundColor: isSelected ? cat.color + '25' : theme.background,
                          borderColor: isSelected ? cat.color : theme.border,
                          borderWidth: isSelected ? 2 : 1,
                        },
                      ]}
                      onPress={() => setSelectedCategoryId(cat.id)}>
                      <Ionicons
                        name={cat.icon as any}
                        size={18}
                        color={isSelected ? cat.color : theme.textSecondary}
                      />
                      <Text
                        style={[
                          styles.categoryName,
                          { color: isSelected ? cat.color : theme.text, fontWeight: isSelected ? '700' : '400' },
                        ]}
                        numberOfLines={1}>
                        {cat.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Date Selection */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Дата</Text>
              <View style={styles.datePillsRow}>
                <Pressable
                  style={[
                    styles.datePill,
                    {
                      backgroundColor:
                        date === new Date().toISOString().split('T')[0]
                          ? theme.tint
                          : theme.background,
                    },
                  ]}
                  onPress={() => setDate(new Date().toISOString().split('T')[0])}>
                  <Text
                    style={{
                      color:
                        date === new Date().toISOString().split('T')[0] ? '#FFFFFF' : theme.text,
                      fontWeight: '600',
                      fontSize: 13,
                    }}>
                    Днес
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.datePill,
                    {
                      backgroundColor:
                        date === new Date(Date.now() - 86400000).toISOString().split('T')[0]
                          ? theme.tint
                          : theme.background,
                    },
                  ]}
                  onPress={() =>
                    setDate(new Date(Date.now() - 86400000).toISOString().split('T')[0])
                  }>
                  <Text
                    style={{
                      color:
                        date === new Date(Date.now() - 86400000).toISOString().split('T')[0]
                          ? '#FFFFFF'
                          : theme.text,
                      fontWeight: '600',
                      fontSize: 13,
                    }}>
                    Вчера
                  </Text>
                </Pressable>

                <TextInput
                  style={[
                    styles.dateInput,
                    { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
                  ]}
                  value={date}
                  onChangeText={setDate}
                  placeholder="ГГГГ-ММ-ДД"
                  placeholderTextColor={theme.textTertiary}
                />
              </View>
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Бележки (по избор)</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
                ]}
                placeholder="Допълнителни детайли..."
                placeholderTextColor={theme.textTertiary}
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            {/* Error Message */}
            {!!errorMessage && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color={theme.danger} />
                <Text style={[styles.errorText, { color: theme.danger }]}>{errorMessage}</Text>
              </View>
            )}

            {/* Submit Button */}
            <Pressable
              style={({ pressed }) => [
                styles.saveButton,
                {
                  backgroundColor: type === 'income' ? theme.success : theme.tint,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
              onPress={handleSave}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Запази транзакцията</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    paddingBottom: 24,
  },
  typeToggleContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  typeBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    paddingVertical: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 34,
    fontWeight: '800',
    paddingVertical: 0,
  },
  amountCurrency: {
    fontSize: 22,
    fontWeight: '700',
    marginLeft: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    maxWidth: '48%',
  },
  categoryName: {
    fontSize: 13,
  },
  datePillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  datePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FF3B3015',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 16,
    gap: 8,
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
