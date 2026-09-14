import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Dimensions,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface ReceiptCropperModalProps {
  visible: boolean;
  imageUri: string | null;
  onCancel: () => void;
  onCropComplete: (croppedUri: string, base64: string) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PREVIEW_WIDTH = SCREEN_WIDTH - 32;
const PREVIEW_HEIGHT = 420;

export function ReceiptCropperModal({
  visible,
  imageUri,
  onCancel,
  onCropComplete,
}: ReceiptCropperModalProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const [imageDims, setImageDims] = useState<{ width: number; height: number } | null>(null);
  const [cropWidthPct, setCropWidthPct] = useState(0.65); // 65% width by default (typical vertical receipt)
  const [cropHeightPct, setCropHeightPct] = useState(0.85); // 85% height
  const [offsetXPct, setOffsetXPct] = useState(0.5); // centered horizontally
  const [offsetYPct, setOffsetYPct] = useState(0.5); // centered vertically
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (visible && imageUri) {
      Image.getSize(
        imageUri,
        (width, height) => {
          setImageDims({ width, height });
        },
        (error) => {
          console.error('Failed to get image size:', error);
          setImageDims({ width: 1200, height: 1600 });
        }
      );
      // Default to supermarket vertical receipt
      setCropWidthPct(0.65);
      setCropHeightPct(0.85);
      setOffsetXPct(0.5);
      setOffsetYPct(0.5);
      setIsProcessing(false);
    }
  }, [visible, imageUri]);

  if (!visible || !imageUri) return null;

  // Calculate pixel bounds of the crop box on screen preview
  const boxWidth = PREVIEW_WIDTH * cropWidthPct;
  const boxHeight = PREVIEW_HEIGHT * cropHeightPct;
  const maxLeft = PREVIEW_WIDTH - boxWidth;
  const maxTop = PREVIEW_HEIGHT - boxHeight;
  const boxLeft = maxLeft * offsetXPct;
  const boxTop = maxTop * offsetYPct;

  const handleApplyPreset = (w: number, h: number, x = 0.5, y = 0.5) => {
    setCropWidthPct(w);
    setCropHeightPct(h);
    setOffsetXPct(x);
    setOffsetYPct(y);
  };

  const handleConfirmCrop = async () => {
    if (!imageDims) return;
    setIsProcessing(true);

    try {
      // Calculate crop parameters in original image coordinates
      const origW = imageDims.width;
      const origH = imageDims.height;

      const realCropW = Math.round(origW * cropWidthPct);
      const realCropH = Math.round(origH * cropHeightPct);
      const realOriginX = Math.max(0, Math.round((origW - realCropW) * offsetXPct));
      const realOriginY = Math.max(0, Math.round((origH - realCropH) * offsetYPct));

      const manipResult = await manipulateAsync(
        imageUri,
        [
          {
            crop: {
              originX: realOriginX,
              originY: realOriginY,
              width: Math.min(realCropW, origW - realOriginX),
              height: Math.min(realCropH, origH - realOriginY),
            },
          },
          { resize: { width: 1200 } },
        ],
        { compress: 0.8, format: SaveFormat.JPEG, base64: true }
      );

      setIsProcessing(false);
      onCropComplete(manipResult.uri, manipResult.base64 || '');
    } catch (error) {
      console.error('Crop error:', error);
      setIsProcessing(false);
      // Fallback: continue with original
      onCropComplete(imageUri, '');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={[styles.container, { backgroundColor: '#000000' }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onCancel} style={styles.headerBtn} hitSlop={10}>
            <Text style={styles.cancelText}>Отказ</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Изрязване на бележката</Text>
          <View style={{ width: 60 }} />
        </View>

        <Text style={styles.instructionText}>
          Изолирайте бележката, за да изрежете масата и фона.
        </Text>

        {/* Image Preview Area with Crop Overlay */}
        <View style={styles.previewContainer}>
          <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />

          {/* Mask Darkening Outside */}
          <View
            style={[
              styles.cropBox,
              {
                width: boxWidth,
                height: boxHeight,
                left: boxLeft,
                top: boxTop,
                borderColor: '#30D158',
              },
            ]}>
            {/* Corner Bracket Graphics (iOS Scanner Style) */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            <View style={styles.boxTag}>
              <Ionicons name="scan" size={14} color="#30D158" />
              <Text style={styles.boxTagText}>Касова бележка</Text>
            </View>
          </View>
        </View>

        {/* Quick Presets */}
        <View style={styles.controlsSection}>
          <Text style={styles.presetsLabel}>БЪРЗИ ШАБЛОНИ ЗА ИЗРЯЗВАНЕ:</Text>
          <View style={styles.presetsRow}>
            <Pressable
              style={[
                styles.presetBtn,
                cropWidthPct === 0.55 && { borderColor: '#30D158', backgroundColor: '#30D15825' },
              ]}
              onPress={() => handleApplyPreset(0.55, 0.9)}>
              <Ionicons name="receipt-outline" size={16} color="#FFFFFF" />
              <Text style={styles.presetBtnText}>Тясна бележка</Text>
            </Pressable>

            <Pressable
              style={[
                styles.presetBtn,
                cropWidthPct === 0.75 && { borderColor: '#30D158', backgroundColor: '#30D15825' },
              ]}
              onPress={() => handleApplyPreset(0.75, 0.88)}>
              <Ionicons name="document-text-outline" size={16} color="#FFFFFF" />
              <Text style={styles.presetBtnText}>Стандартна</Text>
            </Pressable>

            <Pressable
              style={[
                styles.presetBtn,
                cropWidthPct === 0.95 && { borderColor: '#30D158', backgroundColor: '#30D15825' },
              ]}
              onPress={() => handleApplyPreset(0.95, 0.95)}>
              <Ionicons name="expand-outline" size={16} color="#FFFFFF" />
              <Text style={styles.presetBtnText}>Цял кадър</Text>
            </Pressable>
          </View>

          {/* Micro Adjustment Controls */}
          <View style={styles.adjustRow}>
            <View style={styles.adjustGroup}>
              <Text style={styles.adjustLabel}>Ширина</Text>
              <View style={styles.adjustButtons}>
                <Pressable
                  style={styles.stepBtn}
                  onPress={() => setCropWidthPct((prev) => Math.max(0.3, prev - 0.08))}>
                  <Ionicons name="remove" size={18} color="#FFFFFF" />
                </Pressable>
                <Pressable
                  style={styles.stepBtn}
                  onPress={() => setCropWidthPct((prev) => Math.min(1.0, prev + 0.08))}>
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>

            <View style={styles.adjustGroup}>
              <Text style={styles.adjustLabel}>Височина</Text>
              <View style={styles.adjustButtons}>
                <Pressable
                  style={styles.stepBtn}
                  onPress={() => setCropHeightPct((prev) => Math.max(0.4, prev - 0.08))}>
                  <Ionicons name="remove" size={18} color="#FFFFFF" />
                </Pressable>
                <Pressable
                  style={styles.stepBtn}
                  onPress={() => setCropHeightPct((prev) => Math.min(1.0, prev + 0.08))}>
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>

            <View style={styles.adjustGroup}>
              <Text style={styles.adjustLabel}>Позиция</Text>
              <View style={styles.adjustButtons}>
                <Pressable
                  style={styles.stepBtn}
                  onPress={() => setOffsetYPct((prev) => Math.max(0, prev - 0.2))}>
                  <Ionicons name="arrow-up" size={16} color="#FFFFFF" />
                </Pressable>
                <Pressable
                  style={styles.stepBtn}
                  onPress={() => setOffsetYPct((prev) => Math.min(1, prev + 0.2))}>
                  <Ionicons name="arrow-down" size={16} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        {/* Primary Action */}
        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [
              styles.confirmBtn,
              { opacity: pressed ? 0.85 : 1 },
            ]}
            disabled={isProcessing}
            onPress={handleConfirmCrop}>
            {isProcessing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                <Text style={styles.confirmBtnText}>Изрежи & Разчети бележката</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerBtn: {
    padding: 6,
  },
  cancelText: {
    color: '#0A84FF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  instructionText: {
    color: '#8E8E93',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
  },
  previewContainer: {
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
    alignSelf: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  cropBox: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 8,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    shadowColor: '#30D158',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#30D158',
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 6,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 6,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 6,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 6,
  },
  boxTag: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  boxTagText: {
    color: '#30D158',
    fontSize: 11,
    fontWeight: '700',
  },
  controlsSection: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  presetsLabel: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  presetBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#3A3A3C',
    gap: 6,
  },
  presetBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  adjustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    padding: 10,
  },
  adjustGroup: {
    alignItems: 'center',
    gap: 6,
  },
  adjustLabel: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
  },
  adjustButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  stepBtn: {
    width: 36,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
  },
  confirmBtn: {
    backgroundColor: '#30D158',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
