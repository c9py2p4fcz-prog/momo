import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useFinance } from '@/db/FinanceContext';
import { parseReceiptText, recognizeReceiptFromBase64, SAMPLE_RECEIPTS } from '@/services/ocrService';
import { saveReceiptImage } from '@/services/storageService';
import { ReceiptCropperModal } from '@/components/ReceiptCropperModal';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';

export default function ScanScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const { accounts, categories, addNewReceipt, addNewTransaction } = useFinance();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [cropperVisible, setCropperVisible] = useState(false);
  const [rawImageForCrop, setRawImageForCrop] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [storeName, setStoreName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState('BGN');
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState('cat_supermarket');
  const [notes, setNotes] = useState('');
  const [rawText, setRawText] = useState('');
  const [showRawText, setShowRawText] = useState(false);

  // Take photo with camera
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Изисква се разрешение',
          'Моля разрешете достъп до камерата в настройките на телефона за сканиране на бележки.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false, // We use our custom tall receipt cropper
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        // Open the custom receipt cropper immediately to cut out the table/background
        setRawImageForCrop(result.assets[0].uri);
        setCropperVisible(true);
      }
    } catch (err) {
      console.error('Camera error:', err);
      Alert.alert('Грешка', 'Неуспешно стартиране на камерата.');
    }
  };

  // Pick from photo gallery
  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Изисква се разрешение',
          'Моля разрешете достъп до галерията в настройките на телефона.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        setRawImageForCrop(result.assets[0].uri);
        setCropperVisible(true);
      }
    } catch (err) {
      console.error('Gallery error:', err);
      Alert.alert('Грешка', 'Неуспешен избор от галерията.');
    }
  };

  // Called when cropping is done
  const handleCropComplete = (croppedUri: string, base64: string) => {
    setCropperVisible(false);
    processReceipt(croppedUri, null, base64);
  };

  // Process sample receipt (for demo and immediate testing)
  const handleSampleReceipt = (sample: { title: string; text: string }) => {
    const sampleUri = 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80';
    processReceipt(sampleUri, sample.text, null);
  };

  // Run OCR parser with image compression
  const processReceipt = async (uri: string, sampleText: string | null, base64?: string | null) => {
    setIsProcessing(true);
    setImageUri(uri);
    setProcessingStatus('Разчитане на бележката...');

    try {
      let parsed;

      if (sampleText) {
        // Sample receipt
        parsed = parseReceiptText(sampleText);
      } else {
        let base64Data = base64;
        if (!base64Data) {
          setProcessingStatus('Оптимизиране на изрязаната снимка...');
          const manipResult = await manipulateAsync(
            uri,
            [{ resize: { width: 1200 } }],
            { compress: 0.8, format: SaveFormat.JPEG, base64: true }
          );
          base64Data = manipResult.base64 || '';
        }

        setProcessingStatus('Оптично разпознаване на търговец и сума (OCR)...');
        parsed = await recognizeReceiptFromBase64(base64Data);
      }

      setStoreName(parsed.storeName);
      setTotalAmount(parsed.totalAmount > 0 ? parsed.totalAmount.toFixed(2) : '');
      setReceiptDate(parsed.date);
      setCurrency(parsed.currency);
      setRawText(parsed.rawText);

      if (parsed.suggestedCategoryId) {
        setSelectedCategoryId(parsed.suggestedCategoryId);
      }
    } catch (error) {
      console.error('OCR processing error:', error);
      Alert.alert(
        'Информация',
        'Не успяхме да разпознаем напълно бележката автоматично. Можете да въведете данните ръчно.'
      );
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Reset scanner
  const handleReset = () => {
    setImageUri(null);
    setStoreName('');
    setTotalAmount('');
    setRawText('');
    setNotes('');
  };

  // Save to local archive and database
  const handleSaveToArchive = async () => {
    if (!imageUri) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('Моля заснемете или изберете касова бележка.');
      } else {
        Alert.alert('Грешка', 'Моля заснемете или изберете касова бележка.');
      }
      return;
    }

    let parsedAmount = parseFloat(totalAmount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      parsedAmount = 0;
    }

    const receiptId = `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    try {
      setIsProcessing(true);

      // 1. Save image file locally into the app document directory / web storage
      const { localUri, filename } = await saveReceiptImage(imageUri);

      // 2. Add receipt to SQLite / Web archive
      await addNewReceipt({
        id: receiptId,
        image_uri: localUri,
        filename,
        store_name: storeName.trim() || 'Касова бележка',
        total_amount: parsedAmount,
        currency,
        receipt_date: receiptDate,
        raw_ocr_text: rawText,
        transaction_id: parsedAmount > 0 ? txId : undefined,
      });

      // 3. Create expense transaction linked to this receipt if amount > 0
      if (parsedAmount > 0) {
        await addNewTransaction({
          id: txId,
          account_id: selectedAccountId || accounts[0]?.id || 'acc_bank_1',
          category_id: selectedCategoryId || 'cat_supermarket',
          type: 'expense',
          amount: parsedAmount,
          currency,
          title: storeName.trim() || 'Покупка с касова бележка',
          date: receiptDate,
          notes: notes.trim() || undefined,
          receipt_id: receiptId,
        });
      }

      setIsProcessing(false);

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('Касовата бележка беше запазена успешно в архива!');
        handleReset();
        router.push('/(tabs)/archive');
      } else {
        Alert.alert(
          'Успешно запазено!',
          'Касовата бележка е архивирана локално на телефона, а разходът е записан в бюджета.',
          [
            {
              text: 'Към архива',
              onPress: () => {
                handleReset();
                router.push('/(tabs)/archive');
              },
            },
            {
              text: 'Сканирай нова',
              onPress: handleReset,
              style: 'cancel',
            },
          ]
        );
      }
    } catch (error: any) {
      setIsProcessing(false);
      console.error('Save error:', error);
      const msg = error?.message || 'Възникна проблем при запазването на бележката.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(`Грешка: ${msg}`);
      } else {
        Alert.alert('Грешка', msg);
      }
    }
  };

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          {!imageUri ? (
            /* Capture screen */
            <View style={styles.captureContainer}>
              <View style={[styles.cameraFrame, { borderColor: theme.tint, backgroundColor: theme.cardBackground }]}>
                <Ionicons name="scan" size={80} color={theme.tint} />
                <Text style={[styles.frameTitle, { color: theme.text }]}>Сканиране на касова бележка</Text>
                <Text style={[styles.frameSubtitle, { color: theme.textSecondary }]}>
                  Поставете бележката на равна повърхност и добра светлина. Текстът се разпознава автоматично на телефона.
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.captureButtonsRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.primaryCaptureBtn,
                    { backgroundColor: theme.tint, opacity: pressed ? 0.85 : 1 },
                  ]}
                  onPress={handleTakePhoto}>
                  <Ionicons name="camera" size={24} color="#FFFFFF" />
                  <Text style={styles.primaryCaptureBtnText}>Заснеми с камера</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.secondaryCaptureBtn,
                    { backgroundColor: theme.cardBackground, borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
                  ]}
                  onPress={handlePickImage}>
                  <Ionicons name="images-outline" size={22} color={theme.text} />
                  <Text style={[styles.secondaryCaptureBtnText, { color: theme.text }]}>Избери от галерия</Text>
                </Pressable>
              </View>

              {/* Sample Receipts for Quick Test */}
              <View style={styles.sampleSection}>
                <Text style={[styles.sampleSectionTitle, { color: theme.textSecondary }]}>
                  БЪРЗ ТЕСТ С БЪЛГАРСКИ БЕЛЕЖКИ
                </Text>
                <View style={styles.sampleButtonsRow}>
                  {SAMPLE_RECEIPTS.map((sample, idx) => (
                    <Pressable
                      key={idx}
                      style={[styles.sampleBtn, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                      onPress={() => handleSampleReceipt(sample)}>
                      <Ionicons name="document-text-outline" size={16} color={theme.tint} />
                      <Text style={[styles.sampleBtnText, { color: theme.text }]}>{sample.title}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Privacy Notice */}
              <View style={[styles.privacyNotice, { backgroundColor: theme.cardBackground }]}>
                <Ionicons name="shield-checkmark" size={20} color={theme.success} />
                <Text style={[styles.privacyNoticeText, { color: theme.textSecondary }]}>
                  100% локална сигурност: Всички снимки се пазят изцяло на вашия iPhone и никога не се изпращат към външни сървъри.
                </Text>
              </View>
            </View>
          ) : (
            /* Review & Verification Form */
            <View style={styles.reviewContainer}>
              {/* Image Preview */}
              <View style={[styles.previewWrap, { backgroundColor: theme.cardBackground }]}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
                <Pressable style={styles.retakeBtn} onPress={handleReset}>
                  <Ionicons name="reload" size={16} color="#FFFFFF" />
                  <Text style={styles.retakeBtnText}>Нова снимка</Text>
                </Pressable>
              </View>

              {isProcessing ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color={theme.tint} />
                  <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                    {processingStatus || 'Разпознаване на сумата и търговеца...'}
                  </Text>
                </View>
              ) : (
                <View style={[styles.formCard, { backgroundColor: theme.cardBackground }]}>
                  <View style={styles.formHeaderRow}>
                    <Text style={[styles.formHeaderTitle, { color: theme.text }]}>Разпознати данни</Text>
                    <Pressable
                      style={styles.rawTextToggle}
                      onPress={() => setShowRawText(!showRawText)}>
                      <Ionicons name="code-working-outline" size={16} color={theme.tint} />
                      <Text style={[styles.rawTextToggleText, { color: theme.tint }]}>
                        {showRawText ? 'Скрий текста' : 'Виж текста'}
                      </Text>
                    </Pressable>
                  </View>

                  {showRawText && (
                    <View style={[styles.rawTextBox, { backgroundColor: theme.background }]}>
                      <Text style={[styles.rawTextContent, { color: theme.textSecondary }]}>{rawText}</Text>
                    </View>
                  )}

                  {/* Store Name */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Търговец / Обект</Text>
                    <TextInput
                      style={[styles.textInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                      value={storeName}
                      onChangeText={setStoreName}
                      placeholder="Име на магазина"
                      placeholderTextColor={theme.textTertiary}
                    />
                  </View>

                  {/* Total Amount */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Обща сума</Text>
                    <View style={[styles.amountRow, { borderBottomColor: theme.border }]}>
                      <TextInput
                        style={[styles.amountInput, { color: theme.danger }]}
                        value={totalAmount}
                        onChangeText={setTotalAmount}
                        placeholder="0.00"
                        placeholderTextColor={theme.textTertiary}
                        keyboardType="decimal-pad"
                      />
                      <Text style={[styles.currencyText, { color: theme.tint }]}>{currency}</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: theme.textTertiary, marginTop: 4 }}>
                      * Въведете сумата или оставете 0.00, ако е само за архивиране
                    </Text>
                  </View>

                  {/* Date */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Дата на бележката</Text>
                    <TextInput
                      style={[styles.textInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                      value={receiptDate}
                      onChangeText={setReceiptDate}
                      placeholder="ГГГГ-ММ-ДД"
                      placeholderTextColor={theme.textTertiary}
                    />
                  </View>

                  {/* Account Selector */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Платено от сметка</Text>
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
                            <Text style={[styles.pillText, { color: isSelected ? '#FFFFFF' : theme.text }]}>
                              {acc.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* Category Selector */}
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
                            <Text style={[styles.pillText, { color: isSelected ? cat.color : theme.text }]}>
                              {cat.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* Save Button */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.saveButton,
                      { backgroundColor: theme.tint, opacity: pressed ? 0.85 : 1 },
                    ]}
                    onPress={handleSaveToArchive}>
                    <Ionicons name="archive-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>Запази в архива & Отчети разход</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Background Removal & Receipt Cropper Modal */}
      <ReceiptCropperModal
        visible={cropperVisible}
        imageUri={rawImageForCrop}
        onCancel={() => {
          setCropperVisible(false);
          setRawImageForCrop(null);
        }}
        onCropComplete={handleCropComplete}
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
    padding: 16,
    paddingBottom: 40,
  },
  captureContainer: {
    gap: 16,
  },
  cameraFrame: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  frameTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  frameSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  captureButtonsRow: {
    gap: 12,
  },
  primaryCaptureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryCaptureBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryCaptureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
  },
  secondaryCaptureBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sampleSection: {
    marginTop: 10,
  },
  sampleSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  sampleButtonsRow: {
    gap: 8,
  },
  sampleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  sampleBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    gap: 12,
    marginTop: 10,
  },
  privacyNoticeText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  reviewContainer: {
    gap: 16,
  },
  previewWrap: {
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  retakeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  retakeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingBox: {
    padding: 30,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  formCard: {
    borderRadius: 20,
    padding: 18,
    gap: 14,
  },
  formHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  rawTextToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rawTextToggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  rawTextBox: {
    padding: 12,
    borderRadius: 10,
  },
  rawTextContent: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 18,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
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
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
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
