import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import PaymentRow from '../components/PaymentRow';
import LoadingOverlay from '../components/LoadingOverlay';
import { sendSalesSummaryEmail } from '../services/emailService';
import { updateSalesData } from '../services/storageService';
import { RootStackParamList } from '../types';

type ReviewRouteProp = RouteProp<RootStackParamList, 'Review'>;
type ReviewNavProp = NativeStackNavigationProp<RootStackParamList>;

const CONFIDENCE_CONFIG = {
  high: { label: 'High Confidence', bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
  medium: { label: 'Medium Confidence', bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  low: { label: 'Low Confidence', bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
};

function SectionHeader({ title, total, color }: { title: string; total: number; color: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={[styles.sectionTotal, { color }]}>${total.toFixed(2)}</Text>
    </View>
  );
}

export default function ReviewScreen() {
  const route = useRoute<ReviewRouteProp>();
  const navigation = useNavigation<ReviewNavProp>();
  const [salesData, setSalesData] = useState(route.params.salesData);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const { cashPayments, cardPayments, cashTotal, cardTotal, confidence, notes, imageUri, emailSent } =
    salesData;

  const grandTotal = cashTotal + cardTotal;
  const confidenceConfig = CONFIDENCE_CONFIG[confidence];

  const handleSendEmail = async () => {
    if (salesData.emailSent) {
      Alert.alert(
        'Already Sent',
        'A summary email has already been sent for this record. Send again?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Send Again', onPress: () => doSendEmail() },
        ]
      );
      return;
    }
    doSendEmail();
  };

  const doSendEmail = async () => {
    setIsSendingEmail(true);
    try {
      await sendSalesSummaryEmail(salesData);
      const updated = await updateSalesData(salesData.id, { emailSent: true });
      if (updated) setSalesData(updated);

      Alert.alert(
        'Email Sent',
        'The daily sales summary has been sent successfully.',
        [{ text: 'OK' }]
      );
    } catch (err) {
      const error = err as Error;
      Alert.alert('Send Failed', error.message || 'Could not send email. Check your settings.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleRetake = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Captured Image Thumbnail */}
        {imageUri ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.thumbnail} resizeMode="cover" />
            <View style={styles.imageOverlay}>
              <Text style={styles.imageLabel}>Captured Document</Text>
            </View>
          </View>
        ) : null}

        {/* Low Confidence Warning */}
        {confidence === 'low' && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>
              Low confidence extraction — please verify all amounts before sending.
            </Text>
          </View>
        )}

        {/* Confidence Badge */}
        <View style={styles.confidenceRow}>
          <Text style={styles.confidenceLabel}>Extraction confidence:</Text>
          <View
            style={[
              styles.confidenceBadge,
              {
                backgroundColor: confidenceConfig.bg,
                borderColor: confidenceConfig.border,
              },
            ]}
          >
            <Text style={[styles.confidenceBadgeText, { color: confidenceConfig.text }]}>
              {confidenceConfig.label}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {notes ? (
          <View style={styles.notesCard}>
            <Text style={styles.notesTitle}>📝 Notes from extraction</Text>
            <Text style={styles.notesText}>{notes}</Text>
          </View>
        ) : null}

        {/* Cash Payments Section */}
        <View style={styles.paymentSection}>
          <SectionHeader title="💵 Cash Payments" total={cashTotal} color="#059669" />
          <View style={styles.paymentList}>
            {cashPayments.length === 0 ? (
              <Text style={styles.emptyPayments}>No cash payments recorded</Text>
            ) : (
              cashPayments.map((entry, index) => (
                <PaymentRow
                  key={`cash-${index}`}
                  entry={entry}
                  type="cash"
                  isLast={index === cashPayments.length - 1}
                />
              ))
            )}
          </View>
          <View style={styles.subtotalRow}>
            <Text style={styles.subtotalLabel}>Cash Subtotal</Text>
            <Text style={[styles.subtotalAmount, styles.cashSubtotal]}>
              ${cashTotal.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Card Payments Section */}
        <View style={styles.paymentSection}>
          <SectionHeader title="💳 Card Payments" total={cardTotal} color="#2563eb" />
          <View style={styles.paymentList}>
            {cardPayments.length === 0 ? (
              <Text style={styles.emptyPayments}>No card payments recorded</Text>
            ) : (
              cardPayments.map((entry, index) => (
                <PaymentRow
                  key={`card-${index}`}
                  entry={entry}
                  type="card"
                  isLast={index === cardPayments.length - 1}
                />
              ))
            )}
          </View>
          <View style={styles.subtotalRow}>
            <Text style={styles.subtotalLabel}>Card Subtotal</Text>
            <Text style={[styles.subtotalAmount, styles.cardSubtotal]}>
              ${cardTotal.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Grand Total */}
        <View style={styles.grandTotalCard}>
          <Text style={styles.grandTotalLabel}>Grand Total</Text>
          <Text style={styles.grandTotalAmount}>${grandTotal.toFixed(2)}</Text>
        </View>

        {/* Email sent indicator */}
        {emailSent && (
          <View style={styles.emailSentIndicator}>
            <Text style={styles.emailSentText}>✉ Summary email already sent</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.sendEmailButton}
            onPress={handleSendEmail}
            activeOpacity={0.85}
          >
            <Text style={styles.sendEmailButtonIcon}>📧</Text>
            <Text style={styles.sendEmailButtonText}>
              {emailSent ? 'Resend Email Summary' : 'Send Email Summary'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.retakeButton}
            onPress={handleRetake}
            activeOpacity={0.8}
          >
            <Text style={styles.retakeButtonIcon}>📷</Text>
            <Text style={styles.retakeButtonText}>Retake Photo</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <LoadingOverlay visible={isSendingEmail} message="Sending email summary..." />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    height: 180,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  imageLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  warningBanner: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  warningIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
    fontWeight: '500',
    lineHeight: 18,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  confidenceLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  confidenceBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  confidenceBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  notesCard: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  notesTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: '#78350f',
    lineHeight: 18,
  },
  paymentSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
  },
  sectionTotal: {
    fontSize: 15,
    fontWeight: '700',
  },
  paymentList: {
    minHeight: 40,
  },
  emptyPayments: {
    fontSize: 13,
    color: '#9ca3af',
    fontStyle: 'italic',
    padding: 16,
    textAlign: 'center',
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  subtotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  subtotalAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  cashSubtotal: {
    color: '#059669',
  },
  cardSubtotal: {
    color: '#2563eb',
  },
  grandTotalCard: {
    backgroundColor: '#1d4ed8',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#bfdbfe',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grandTotalAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
  },
  emailSentIndicator: {
    backgroundColor: '#d1fae5',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  emailSentText: {
    fontSize: 13,
    color: '#065f46',
    fontWeight: '600',
  },
  actions: {
    gap: 12,
  },
  sendEmailButton: {
    backgroundColor: '#1d4ed8',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  sendEmailButtonIcon: {
    fontSize: 18,
  },
  sendEmailButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  retakeButton: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  retakeButtonIcon: {
    fontSize: 18,
  },
  retakeButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});
