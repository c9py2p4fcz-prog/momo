import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Receipt } from '@/db/schema';
import { getReceiptFullUri } from '@/services/storageService';
import { useRouter } from 'expo-router';

interface ReceiptCardProps {
  receipt: Receipt & { transaction_title?: string; category_name?: string };
  onDelete?: (id: string, filename: string) => void;
}

export function ReceiptCard({ receipt, onDelete }: ReceiptCardProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const fullImageUri = getReceiptFullUri(receipt.image_uri || receipt.filename);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const months = ['яну', 'фев', 'мар', 'апр', 'май', 'юни', 'юли', 'авг', 'сеп', 'окт', 'ное', 'дек'];
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.cardBackground, opacity: pressed ? 0.9 : 1 },
      ]}
      onPress={() => router.push(`/receipt/${receipt.id}`)}>
      {/* Thumbnail or Fallback Icon */}
      <View style={[styles.imageContainer, { backgroundColor: theme.background }]}>
        {fullImageUri ? (
          <Image
            source={{ uri: fullImageUri }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <Ionicons name="receipt-outline" size={36} color={theme.textTertiary} />
        )}
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        <View style={styles.topRow}>
          <Text style={[styles.storeName, { color: theme.text }]} numberOfLines={1}>
            {receipt.store_name || 'Касова бележка'}
          </Text>
          <Text style={[styles.amount, { color: theme.tint }]}>
            {receipt.total_amount.toFixed(2)} {receipt.currency}
          </Text>
        </View>

        <Text style={[styles.date, { color: theme.textSecondary }]}>
          {formatDate(receipt.receipt_date)}
        </Text>

        <View style={styles.bottomRow}>
          {receipt.transaction_title ? (
            <View style={[styles.badge, { backgroundColor: theme.success + '15' }]}>
              <Ionicons name="link-outline" size={12} color={theme.success} />
              <Text style={[styles.badgeText, { color: theme.success }]} numberOfLines={1}>
                {receipt.transaction_title}
              </Text>
            </View>
          ) : (
            <View style={[styles.badge, { backgroundColor: theme.textTertiary + '20' }]}>
              <Text style={[styles.badgeText, { color: theme.textSecondary }]}>
                Само бележка
              </Text>
            </View>
          )}

          {onDelete && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onDelete(receipt.id, receipt.filename);
              }}
              style={styles.deleteBtn}
              hitSlop={8}>
              <Ionicons name="trash-outline" size={16} color={theme.danger} />
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 12,
    marginVertical: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  imageContainer: {
    width: 68,
    height: 68,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'space-between',
    height: 68,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storeName: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  amount: {
    fontSize: 16,
    fontWeight: '800',
  },
  date: {
    fontSize: 13,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
    maxWidth: '80%',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 4,
  },
});
