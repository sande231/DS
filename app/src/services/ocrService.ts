import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import { SalesData, PaymentEntry } from '../types';
import { getSettings } from './storageService';
import { getTodayString } from '../utils/dateUtils';

interface OcrResponse {
  success: boolean;
  data?: {
    cashPayments: PaymentEntry[];
    cardPayments: PaymentEntry[];
    cashTotal: number;
    cardTotal: number;
    confidence: 'high' | 'medium' | 'low';
    notes?: string;
  };
  error?: string;
  details?: string;
}

/**
 * Generates a unique ID for a SalesData record.
 */
function generateId(): string {
  return `sale_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Uploads a base64-encoded image to the backend OCR endpoint and returns
 * a fully-formed SalesData object with extracted payment information.
 *
 * @param base64Image - Base64-encoded image string (with or without data URI prefix)
 * @param imageUri - Local URI of the captured image (for display)
 * @param mimeType - MIME type of the image
 */
export async function extractSalesData(
  base64Image: string,
  imageUri: string,
  mimeType: 'image/jpeg' | 'image/png' = 'image/jpeg'
): Promise<SalesData> {
  const settings = await getSettings();
  const serverUrl = settings.serverUrl.replace(/\/$/, '');

  let response: OcrResponse;
  try {
    const result = await axios.post<OcrResponse>(
      `${serverUrl}/api/ocr/extract`,
      {
        image: base64Image,
        mimeType,
      },
      {
        timeout: 60000, // 60s timeout for large images / slow connections
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    response = result.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        throw new Error(
          `Cannot connect to server at ${serverUrl}. Please check your server URL in Settings.`
        );
      }
      if (err.code === 'ECONNABORTED') {
        throw new Error('Request timed out. The image may be too large or the server is slow.');
      }
      const responseData = err.response?.data as OcrResponse | undefined;
      if (responseData?.error) {
        throw new Error(responseData.error);
      }
      throw new Error(`Server error (${err.response?.status ?? 'unknown'}): ${err.message}`);
    }
    throw err;
  }

  if (!response.success || !response.data) {
    throw new Error(response.error ?? 'OCR extraction failed with no details.');
  }

  const { cashPayments, cardPayments, cashTotal, cardTotal, confidence, notes } = response.data;

  const id = generateId();

  // Copy image to permanent app storage so it persists across sessions
  let permanentUri = imageUri;
  try {
    const receiptDir = `${FileSystem.documentDirectory}receipts/`;
    await FileSystem.makeDirectoryAsync(receiptDir, { intermediates: true });
    permanentUri = `${receiptDir}${id}.jpg`;
    await FileSystem.copyAsync({ from: imageUri, to: permanentUri });
  } catch {
    permanentUri = imageUri;
  }

  return {
    id,
    date: getTodayString(),
    imageUri: permanentUri,
    cashPayments,
    cardPayments,
    cashTotal,
    cardTotal,
    confidence,
    notes,
    emailSent: false,
  };
}
