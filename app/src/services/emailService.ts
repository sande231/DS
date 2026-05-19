import axios from 'axios';
import { SalesData } from '../types';
import { getSettings } from './storageService';
import { formatDisplayDate } from '../utils/dateUtils';

interface EmailResponse {
  success: boolean;
  message?: string;
  error?: string;
  details?: string;
}

/**
 * Sends a daily sales summary email by calling the backend email endpoint.
 *
 * @param salesData - The SalesData record to summarize
 */
export async function sendSalesSummaryEmail(salesData: SalesData): Promise<void> {
  const settings = await getSettings();

  if (!settings.recipientEmail) {
    throw new Error(
      'No recipient email configured. Please set a recipient email in Settings.'
    );
  }

  const serverUrl = settings.serverUrl.replace(/\/$/, '');
  const displayDate = formatDisplayDate(salesData.date);

  let response: EmailResponse;
  try {
    const result = await axios.post<EmailResponse>(
      `${serverUrl}/api/email/send-summary`,
      {
        date: displayDate,
        recipientEmail: settings.recipientEmail,
        senderName: settings.senderName || 'Sales Capture',
        cashPayments: salesData.cashPayments,
        cardPayments: salesData.cardPayments,
        cashTotal: salesData.cashTotal,
        cardTotal: salesData.cardTotal,
        confidence: salesData.confidence,
        notes: salesData.notes,
      },
      {
        timeout: 30000,
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
        throw new Error('Email request timed out. Please try again.');
      }
      const responseData = err.response?.data as EmailResponse | undefined;
      if (responseData?.error) {
        throw new Error(responseData.error);
      }
      throw new Error(`Server error (${err.response?.status ?? 'unknown'}): ${err.message}`);
    }
    throw err;
  }

  if (!response.success) {
    throw new Error(response.error ?? 'Email sending failed with no details.');
  }
}

/**
 * Sends a test email to verify SMTP configuration.
 */
export async function sendTestEmail(recipientEmail: string, senderName: string): Promise<void> {
  const settings = await getSettings();
  const serverUrl = settings.serverUrl.replace(/\/$/, '');

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let response: EmailResponse;
  try {
    const result = await axios.post<EmailResponse>(
      `${serverUrl}/api/email/send-summary`,
      {
        date: today,
        recipientEmail,
        senderName: senderName || 'Sales Capture',
        cashPayments: [{ description: 'Test Cash Entry', amount: 100.0 }],
        cardPayments: [{ description: 'Test Card Entry', amount: 250.0 }],
        cashTotal: 100.0,
        cardTotal: 250.0,
        confidence: 'high',
        notes: 'This is a test email to verify your SMTP configuration is working correctly.',
      },
      {
        timeout: 30000,
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
      const responseData = err.response?.data as EmailResponse | undefined;
      if (responseData?.error) {
        throw new Error(responseData.error);
      }
      throw new Error(`Server error (${err.response?.status ?? 'unknown'}): ${err.message}`);
    }
    throw err;
  }

  if (!response.success) {
    throw new Error(response.error ?? 'Test email failed with no details.');
  }
}
