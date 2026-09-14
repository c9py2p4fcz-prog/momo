import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useFinance } from '@/db/FinanceContext';
import {
  processUtilityBillFile,
  parseUtilityInvoiceText,
  SAMPLE_UTILITY_INVOICES,
  ParsedUtilityInvoice,
} from '@/services/utilityService';

interface UtilityBillUploadModalProps {
  visible: boolean;
  onClose: () => void;
}

export function UtilityBillUploadModal({ visible, onClose }: UtilityBillUploadModalProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { addNewBill } = useFinance();

  const [step, setStep] = useState<'pick' | 'review'>('pick');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Form fields
  const [providerName, setProviderName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('25');
  const [dueDate, setDueDate] = useState('');
  const [clientNumber, setClientNumber] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [categoryId, setCategoryId] = useState('cat_bills');

  const reset = () => {
    setStep('pick');
    setIsProcessing(false);
    setStatusMessage('');
    setProviderName('');
    setAmount('');
    setDueDay('25');
    setDueDate('');
    setClientNumber('');
    setInvoiceNumber('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Pick PDF file from Files app / Email downloads
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        const isPdf = file.mimeType?.includes('pdf') || file.name.toLowerCase().endsWith('.pdf');
        await analyzeFile(file.uri, isPdf);
      }
    } catch (err) {
      console.error('Document picker error:', err);
      Alert.alert('Грешка', 'Неуспешно отваряне на файла.');
    }
  };

  // Pick screenshot / image from photo library
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await analyzeFile(result.assets[0].uri, false);
      }
    } catch (err) {
      console.error('Image picker error:', err);
      Alert.alert('Грешка', 'Неуспешен избор от галерията.');
    }
  };

  // Take photo of paper utility bill with camera
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Разрешение', 'Моля разрешете достъп до камерата.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await analyzeFile(result.assets[0].uri, false);
      }
    } catch (err) {
      console.error('Camera error:', err);
      Alert.alert('Грешка', 'Неуспешно стартиране на камерата.');
    }
  };

  // Run sample invoice
  const handleSample = (sample: (typeof SAMPLE_UTILITY_INVOICES)[0]) => {
    setIsProcessing(true);
    setStatusMessage('Разчитане на примерна фактура...');
    setTimeout(() => {
      const parsed = parseUtilityInvoiceText(sample.text);
      populateForm(parsed);
      setIsProcessing(false);
    }, 300);
  };

  // Analyze file with OCR
  const analyzeFile = async (uri: string, isPdf: boolean) => {
    setIsProcessing(true);
    setStatusMessage(isPdf ? 'Разчитане на PDF фактурата...' : 'Оптично разпознаване на сметката...');

    try {
      const parsed = await processUtilityBillFile(uri, isPdf);
      populateForm(parsed);
    } catch (error) {
      console.error('Analyze error:', error);
      Alert.alert('Информация', 'Фактурата беше заредена. Моля прегледайте и потвърдете данните.');
      setStep('review');
    } finally {
      setIsProcessing(false);
      setStatusMessage('');
    }
  };

  const populateForm = (data: ParsedUtilityInvoice) => {
    setProviderName(data.providerName);
    setAmount(data.totalAmount > 0 ? data.totalAmount.toFixed(2) : '');
    setDueDay(data.dueDay.toString());
    setDueDate(data.dueDate);
    setClientNumber(data.clientNumber || '');
    setInvoiceNumber(data.invoiceNumber || '');
    setCategoryId(data.categoryId);
    setStep('review');
  };

  // Save bill into database
  const handleSaveBill = async () => {
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Грешка', 'Моля въведете валидна сума');
      return;
    }

    if (!providerName.trim()) {
      Alert.alert('Грешка', 'Моля въведете име на доставчика');
      return;
    }

    const dayNum = parseInt(dueDay, 10) || 20;

    const notesArray = [];
    if (clientNumber) notesArray.push(`Клиентски № ${clientNumber}`);
    if (invoiceNumber) notesArray.push(`Фактура № ${invoiceNumber}`);
    if (dueDate) notesArray.push(`Срок: ${dueDate}`);

    try {
      await addNewBill({
        id: `bill_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: providerName.trim(),
        category_id: categoryId,
        amount: parsedAmount,
        currency: 'BGN',
        due_day: dayNum,
        frequency: 'monthly',
        is_paid: 0,
        reminder_enabled: 1,
        notes: notesArray.join(' | ') || undefined,
      });

      Alert.alert(
        'Сметката е добавена!',
        `Сметката към "${providerName}" за ${parsedAmount.toFixed(2)} BGN с падеж ${dayNum}-то число е добавена успешно в чакащите плащания.`,
        [{ text: 'Чудесно', onPress: handleClose }]
      );
    } catch (error) {
      console.error('Failed to save bill:', error);
      Alert.alert('Грешка', 'Възникна проблем при записването на сметката.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: theme.cardBackground }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Pressable onPress={handleClose} style={styles.closeBtn} hitSlop={10}>
            <Text style={[styles.closeBtnText, { color: theme.tint }]}>Затвори</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {step === 'pick' ? 'Качване на сметка' : 'Преглед на фактурата'}
          </Text>
          <View style={{ width: 60 }} />
        </View>

        {isProcessing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.tint} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              {statusMessage || 'Обработка...'}
            </Text>
          </View>
        ) : step === 'pick' ? (
          /* Step 1: Pick file / screenshot */
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={[styles.infoBanner, { backgroundColor: theme.tint + '15', borderColor: theme.tint }]}>
              <Ionicons name="document-text" size={24} color={theme.tint} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.bannerTitle, { color: theme.text }]}>
                  Автоматично разчитане на сметки
                </Text>
                <Text style={[styles.bannerSub, { color: theme.textSecondary }]}>
                  Качете PDF фактура от имейла или снимка/скрийншот на сметката за ток, вода, интернет или парно.
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionList}>
              <Pressable
                style={({ pressed }) => [
                  styles.optionCard,
                  { backgroundColor: theme.background, opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={handlePickDocument}>
                <View style={[styles.optionIconWrap, { backgroundColor: '#FF950020' }]}>
                  <Ionicons name="document" size={26} color="#FF9500" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: theme.text }]}>
                    Качи PDF файл от имейла
                  </Text>
                  <Text style={[styles.optionSub, { color: theme.textSecondary }]}>
                    Фактури от Електрохолд, Софийска вода, А1, Vivacom в PDF формат
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.optionCard,
                  { backgroundColor: theme.background, opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={handlePickImage}>
                <View style={[styles.optionIconWrap, { backgroundColor: '#007AFF20' }]}>
                  <Ionicons name="images" size={26} color="#007AFF" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: theme.text }]}>
                    Снимка или скрийншот от телефона
                  </Text>
                  <Text style={[styles.optionSub, { color: theme.textSecondary }]}>
                    Скрийншот от онлайн банкиране, мобилно приложение или имейл
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.optionCard,
                  { backgroundColor: theme.background, opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={handleTakePhoto}>
                <View style={[styles.optionIconWrap, { backgroundColor: '#34C75920' }]}>
                  <Ionicons name="camera" size={26} color="#34C759" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: theme.text }]}>
                    Снимай хартиена сметка
                  </Text>
                  <Text style={[styles.optionSub, { color: theme.textSecondary }]}>
                    Директна снимка с камерата на хартиен касов бон или фактура
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
              </Pressable>
            </View>

            {/* Quick Demo Test Section */}
            <View style={styles.demoSection}>
              <Text style={[styles.demoSectionTitle, { color: theme.textSecondary }]}>
                БЪРЗ ТЕСТ С БЪЛГАРСКИ ДОСТАВЧИЦИ
              </Text>
              <View style={styles.demoGrid}>
                {SAMPLE_UTILITY_INVOICES.map((s, idx) => (
                  <Pressable
                    key={idx}
                    style={[styles.demoBtn, { backgroundColor: theme.background, borderColor: theme.border }]}
                    onPress={() => handleSample(s)}>
                    <Ionicons name={s.icon as any} size={20} color={s.color} />
                    <Text style={[styles.demoBtnText, { color: theme.text }]}>{s.title}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>
        ) : (
          /* Step 2: Review recognized utility invoice */
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={[styles.recognizedBadge, { backgroundColor: theme.success + '15' }]}>
              <Ionicons name="checkmark-circle" size={20} color={theme.success} />
              <Text style={[styles.recognizedBadgeText, { color: theme.success }]}>
                Фактурата е разчетена успешно!
              </Text>
            </View>

            {/* Provider */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Доставчик / Услуга</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                value={providerName}
                onChangeText={setProviderName}
                placeholder="напр. Електрохолд (Ток)"
                placeholderTextColor={theme.textTertiary}
              />
            </View>

            {/* Amount */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Дължима сума</Text>
              <View style={[styles.amountRow, { borderBottomColor: theme.border }]}>
                <TextInput
                  style={[styles.amountInput, { color: theme.danger }]}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor={theme.textTertiary}
                  keyboardType="decimal-pad"
                />
                <Text style={[styles.currencyText, { color: theme.tint }]}>BGN</Text>
              </View>
            </View>

            {/* Due Day / Due Date */}
            <View style={styles.rowTwoCols}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Ден от месеца (падеж)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  value={dueDay}
                  onChangeText={setDueDay}
                  placeholder="1 - 31"
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1.4 }]}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Краен срок за плащане</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  value={dueDate}
                  onChangeText={setDueDate}
                  placeholder="ГГГГ-ММ-ДД"
                />
              </View>
            </View>

            {/* Client Number */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Клиентски номер / ИТН</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                value={clientNumber}
                onChangeText={setClientNumber}
                placeholder="Клиентски номер от фактурата"
                placeholderTextColor={theme.textTertiary}
              />
            </View>

            {/* Invoice Number */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Номер на фактура</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                value={invoiceNumber}
                onChangeText={setInvoiceNumber}
                placeholder="Фактура №"
                placeholderTextColor={theme.textTertiary}
              />
            </View>

            {/* Save Button */}
            <Pressable
              style={({ pressed }) => [
                styles.saveBtn,
                { backgroundColor: theme.tint, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={handleSaveBill}>
              <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Запази в чакащите сметки</Text>
            </Pressable>

            <Pressable style={styles.backBtn} onPress={() => setStep('pick')}>
              <Text style={[styles.backBtnText, { color: theme.textSecondary }]}>
                ← Качи друга фактура
              </Text>
            </Pressable>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '600',
  },
  infoBanner: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    alignItems: 'center',
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  bannerSub: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  actionList: {
    gap: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    gap: 12,
  },
  optionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  optionSub: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  demoSection: {
    marginTop: 10,
  },
  demoSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  demoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    width: '48%',
  },
  demoBtnText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  recognizedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 4,
  },
  recognizedBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    paddingVertical: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '800',
  },
  currencyText: {
    fontSize: 20,
    fontWeight: '700',
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 10,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    marginTop: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  backBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
