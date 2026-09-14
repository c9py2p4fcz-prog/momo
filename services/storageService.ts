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
 * Copies a newly taken or selected photo into the app's permanent local receipts folder
 */
export async function saveReceiptImage(sourceUri: string): Promise<{ localUri: string; filename: string }> {
  if (Platform.OS === 'web' || !FileSystem.documentDirectory) {
    return {
      localUri: sourceUri,
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
