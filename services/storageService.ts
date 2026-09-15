import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

const RECEIPTS_DIR = `${FileSystem.documentDirectory ?? ''}receipts/`;

/**
 * Ensures the local receipts directory exists in app storage
 */
export async function ensureReceiptsDirectory(): Promise<void> {
  if (Platform.OS === 'web' || !FileSystem.documentDirectory) {
    return;
  }
  try {
    const dirInfo = await FileSystem.getInfoAsync(RECEIPTS_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(RECEIPTS_DIR, { intermediates: true });
    }
  } catch (error) {
    console.error('Error creating receipts directory:', error);
  }
}

/**
 * Compresses an image into a lightweight data URL for web storage (avoids blob expiration and quota errors)
 */
export async function compressImageForWeb(uri: string, maxWidth = 800, quality = 0.6): Promise<string> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return uri;
  return new Promise((resolve) => {
    const img = document.createElement('img');
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let width = img.naturalWidth || img.width || 800;
      let height = img.naturalHeight || img.height || 1000;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(uri);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      try {
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      } catch (err) {
        console.warn('Canvas toDataURL failed:', err);
        resolve(uri);
      }
    };
    img.onerror = (e) => {
      console.warn('Image load error during compression:', e);
      resolve(uri);
    };
    img.src = uri;
  });
}

/**
 * Copies a newly taken or selected photo into the app's permanent local receipts folder
 */
export async function saveReceiptImage(sourceUri: string): Promise<{ localUri: string; filename: string }> {
  if (Platform.OS === 'web' || !FileSystem.documentDirectory) {
    let persistentUri = sourceUri;
    try {
      if (typeof window !== 'undefined') {
        persistentUri = await compressImageForWeb(sourceUri, 800, 0.6);
      }
    } catch (e) {
      console.warn('Could not compress image for web storage:', e);
    }
    return {
      localUri: persistentUri,
      filename: `receipt_${Date.now()}.jpg`,
    };
  }

  await ensureReceiptsDirectory();
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const filename = `receipt_${timestamp}_${randomSuffix}.jpg`;
  const destinationUri = `${RECEIPTS_DIR}${filename}`;

  await FileSystem.copyAsync({
    from: sourceUri,
    to: destinationUri,
  });

  return {
    localUri: destinationUri,
    filename,
  };
}

/**
 * Deletes a receipt image from local storage
 */
export async function deleteReceiptImage(uriOrFilename: string): Promise<boolean> {
  if (Platform.OS === 'web' || !FileSystem.documentDirectory) {
    return true;
  }

  try {
    const fullUri = uriOrFilename.startsWith('file://')
      ? uriOrFilename
      : `${RECEIPTS_DIR}${uriOrFilename}`;

    const info = await FileSystem.getInfoAsync(fullUri);
    if (info.exists) {
      await FileSystem.deleteAsync(fullUri, { idempotent: true });
    }
    return true;
  } catch (error) {
    console.error('Failed to delete receipt image:', error);
    return false;
  }
}

/**
 * Resolves the full URI for a receipt filename or URI
 */
export function getReceiptFullUri(uriOrFilename: string): string {
  if (uriOrFilename.startsWith('file://') || uriOrFilename.startsWith('http') || uriOrFilename.startsWith('data:') || Platform.OS === 'web') {
    return uriOrFilename;
  }
  return `${RECEIPTS_DIR}${uriOrFilename}`;
}

/**
 * Shares a receipt image using native iOS share sheet (AirDrop, Messages, Files, etc.)
 */
export async function shareReceiptImage(uri: string): Promise<void> {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Споделянето не е налично на това устройство');
  }

  const fullUri = getReceiptFullUri(uri);
  await Sharing.shareAsync(fullUri, {
    mimeType: 'image/jpeg',
    dialogTitle: 'Сподели касова бележка',
    UTI: 'public.jpeg',
  });
}
