import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useFinance } from '@/db/FinanceContext';
import { getReceiptById } from '@/db/database';
import { getReceiptFullUri, shareReceiptImage } from '@/services/storageService';
import { Receipt } from '@/db/schema';

export default function ReceiptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { deleteReceiptById } = useFinance();

  const [receipt, setReceipt] = useState<
    (Receipt & { transaction_title?: string; category_name?: string; category_icon?: string }) | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [showOcrText, setShowOcrText] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const data = await getReceiptById(id);
        setReceipt(data);
      } catch (err) {
        console.error('Failed to load receipt:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleShare = async () => {
    if (!receipt) return;
    try {
      await shareReceiptImage(receipt.image_uri || receipt.filename);
    } catch (err) {
      console.error('Share error:', err);
      Alert.alert('Информация', 'Споделянето не е налично в текущата среда.');
    }
  };

  const handleDelete = () => {
    if (!receipt) return;
    Alert.alert(
      'Изтриване на касова бележка',
      'Сигурни ли сте? Снимката ще бъде изтрита от локалната памет на телефона.',
      [
        { text: 'Отказ', style: 'cancel' },
        {
          text: 'Изтрий',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReceiptById(receipt.id, receipt.filename);
              router.back();
            } catch (err) {
              console.error('Delete error:', err);
              Alert.alert('Грешка', 'Неуспешно изтриване.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
      </SafeAreaView>
    );
  }

  if (!receipt) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.textSecondary }]}>
          Бележката не беше намерена.
        </Text>
      </SafeAreaView>
    );
  }

  const fullImageUri = getReceiptFullUri(receipt.image_uri || receipt.filename);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: receipt.store_name || 'Касова бележка',
          headerRight: () => (
            <Pressable onPress={handleShare} style={styles.headerShareBtn}>
              <Ionicons name="share-outline" size={22} color={theme.tint} />
            </Pressable>
          ),
        }}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Receipt Image */}
        <View style={[styles.imageCard, { backgroundColor: theme.cardBackground }]}>
          <Image
            source={{ uri: fullImageUri }}
            style={styles.receiptImage}
            resizeMode="contain"
          />
        </View>

        {/* Action Buttons Row */}
        <View style={styles.actionsRow}>
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: theme.tint, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={handleShare}>
            <Ionicons name="share-outline" size={18} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>Сподели / AirDrop</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionBtnSecondary,
              { backgroundColor: theme.danger + '18', opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color={theme.danger} />
            <Text style={[styles.actionBtnSecondaryText, { color: theme.danger }]}>Изтрий</Text>
          </Pressable>
        </View>

        {/* Details Card */}
        <View style={[styles.infoCard, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Информация за бележката</Text>

          <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Търговец / Обект</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>{receipt.store_name}</Text>
          </View>

          <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Обща сума</Text>
            <Text style={[styles.amountValue, { color: theme.tint }]}>
              {receipt.total_amount.toFixed(2)} {receipt.currency}
            </Text>
          </View>

          <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Дата на покупката</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>{receipt.receipt_date}</Text>
          </View>

          {receipt.transaction_title && (
            <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Свързан разход</Text>
              <View style={styles.linkedTxBadge}>
                <Ionicons name="link-outline" size={14} color={theme.success} />
                <Text style={[styles.detailValue, { color: theme.success }]}>
                  {receipt.transaction_title}
                </Text>
              </View>
            </View>
          )}

          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Съхранение</Text>
            <View style={styles.localBadge}>
              <Ionicons name="phone-portrait-outline" size={14} color={theme.textSecondary} />
              <Text style={[styles.localBadgeText, { color: theme.textSecondary }]}>
                Локално на iPhone
              </Text>
            </View>
          </View>
        </View>

        {/* Raw OCR text toggle */}
        {receipt.raw_ocr_text ? (
          <View style={[styles.infoCard, { backgroundColor: theme.cardBackground, marginTop: 12 }]}>
            <Pressable
              style={styles.ocrToggleRow}
              onPress={() => setShowOcrText(!showOcrText)}>
              <View style={styles.ocrToggleLeft}>
                <Ionicons name="document-text-outline" size={18} color={theme.tint} />
                <Text style={[styles.ocrToggleTitle, { color: theme.text }]}>
                  Разпознат OCR текст
                </Text>
              </View>
              <Ionicons
                name={showOcrText ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={theme.textTertiary}
              />
            </Pressable>

            {showOcrText && (
              <View style={[styles.ocrTextBox, { backgroundColor: theme.background }]}>
                <Text style={[styles.ocrTextContent, { color: theme.textSecondary }]}>
                  {receipt.raw_ocr_text}
                </Text>
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  headerShareBtn: {
    padding: 6,
  },
  imageCard: {
    borderRadius: 20,
    height: 380,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  receiptImage: {
    width: '100%',
    height: '100%',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
  },
  actionBtnSecondaryText: {
    fontSize: 15,
    fontWeight: '700',
  },
  infoCard: {
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  linkedTxBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  localBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  localBadgeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  ocrToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ocrToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ocrToggleTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  ocrTextBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
  },
  ocrTextContent: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
