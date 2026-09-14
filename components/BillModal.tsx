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
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useFinance } from '@/db/FinanceContext';
import { BillFrequency } from '@/db/schema';

interface BillModalProps {
  visible: boolean;
  onClose: () => void;
}

export function BillModal({ visible, onClose }: BillModalProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { categories, addNewBill } = useFinance();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('15');
  const [frequency, setFrequency] = useState<BillFrequency>('monthly');
  const [selectedCategoryId, setSelectedCategoryId] = useState('cat_bills');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (visible) {
      setTitle('');
      setAmount('');
      setDueDay('15');
      setFrequency('monthly');
      setSelectedCategoryId('cat_bills');
      setReminderEnabled(true);
      setNotes('');
    }
  }, [visible]);

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Грешка', 'Моля въведете валидна сума');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Грешка', 'Моля въведете име на сметката');
      return;
    }

    const dayNum = parseInt(dueDay, 10);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
      Alert.alert('Грешка', 'Денят на падеж трябва да е между 1 и 31');
      return;
    }

    try {
      await addNewBill({
        id: `bill_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: title.trim(),
        category_id: selectedCategoryId,
        amount: parsedAmount,
        currency: 'BGN',
        due_day: dayNum,
        frequency,
        is_paid: 0,
        reminder_enabled: reminderEnabled ? 1 : 0,
        notes: notes.trim() || undefined,
      });

      onClose();
    } catch (error) {
      console.error('Failed to create bill:', error);
      Alert.alert('Грешка', 'Възникна проблем при създаването на сметката');
    }
  };

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}>
        <View style={[styles.modalSheet, { backgroundColor: theme.cardBackground }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Нова периодична сметка</Text>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
              <Ionicons name="close-circle" size={28} color={theme.textTertiary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Име на сметката</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
                ]}
                placeholder="напр. Електроенергия, Вода, Интернет, Наем..."
                placeholderTextColor={theme.textTertiary}
                value={title}
                onChangeText={setTitle}
                autoFocus
              />
            </View>

            {/* Amount */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Сума (приблизителна)</Text>
              <View style={[styles.amountInputRow, { borderBottomColor: theme.border }]}>
                <TextInput
                  style={[styles.amountInput, { color: theme.text }]}
                  placeholder="0.00"
                  placeholderTextColor={theme.textTertiary}
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                />
                <Text style={[styles.amountCurrency, { color: theme.tint }]}>BGN</Text>
              </View>
            </View>

            {/* Due Day */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Ден от месеца (падеж)</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
                ]}
                placeholder="1 - 31"
                placeholderTextColor={theme.textTertiary}
                keyboardType="number-pad"
                value={dueDay}
                onChangeText={setDueDay}
                maxLength={2}
              />
            </View>

            {/* Frequency */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Периодичност</Text>
              <View style={styles.frequencyRow}>
                {(['monthly', 'yearly', 'one_time'] as BillFrequency[]).map((f) => {
                  const labels = {
                    monthly: 'Всеки месец',
                    yearly: 'Годишно',
                    one_time: 'Еднократно',
                  };
                  const isSelected = frequency === f;
                  return (
                    <Pressable
                      key={f}
                      style={[
                        styles.frequencyBtn,
                        {
                          backgroundColor: isSelected ? theme.tint : theme.background,
                          borderColor: isSelected ? theme.tint : theme.border,
                        },
                      ]}
                      onPress={() => setFrequency(f)}>
                      <Text
                        style={[
                          styles.frequencyBtnText,
                          { color: isSelected ? '#FFFFFF' : theme.text },
                        ]}>
                        {labels[f]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Category */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Категория</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
                {expenseCategories.map((cat) => {
                  const isSelected = selectedCategoryId === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      style={[
                        styles.pill,
                        {
                          backgroundColor: isSelected ? cat.color + '25' : theme.background,
                          borderColor: isSelected ? cat.color : theme.border,
                          borderWidth: isSelected ? 2 : 1,
                        },
                      ]}
                      onPress={() => setSelectedCategoryId(cat.id)}>
                      <Ionicons
                        name={cat.icon as any}
                        size={16}
                        color={isSelected ? cat.color : theme.textSecondary}
                      />
                      <Text
                        style={[
                          styles.pillText,
                          { color: isSelected ? cat.color : theme.text },
                        ]}>
                        {cat.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Reminder Switch */}
            <View style={[styles.switchRow, { borderTopColor: theme.border, borderBottomColor: theme.border }]}>
              <View>
                <Text style={[styles.switchLabel, { color: theme.text }]}>Напомняне за падеж</Text>
                <Text style={[styles.switchSubLabel, { color: theme.textSecondary }]}>
                  Индикация на главното табло преди падежа
                </Text>
              </View>
              <Switch
                value={reminderEnabled}
                onValueChange={setReminderEnabled}
                trackColor={{ false: theme.border, true: theme.tint }}
              />
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Бележки</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
                ]}
                placeholder="Клиентски номер, титуляр, линк..."
                placeholderTextColor={theme.textTertiary}
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            {/* Submit */}
            <Pressable
              style={({ pressed }) => [
                styles.saveButton,
                { backgroundColor: theme.tint, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={handleSave}>
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Добави сметка</Text>
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
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    paddingVertical: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '800',
    paddingVertical: 0,
  },
  amountCurrency: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 8,
  },
  frequencyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  frequencyBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  frequencyBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  switchSubLabel: {
    fontSize: 12,
    marginTop: 2,
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
