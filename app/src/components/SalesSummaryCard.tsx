import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SalesSummaryCardProps {
  cashTotal: number;
  cardTotal: number;
  recordCount?: number;
  label?: string;
}

export default function SalesSummaryCard({
  cashTotal,
  cardTotal,
  recordCount,
  label = "Today's Sales",
}: SalesSummaryCardProps) {
  const grandTotal = cashTotal + cardTotal;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        {recordCount !== undefined && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {recordCount} {recordCount === 1 ? 'capture' : 'captures'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.grandTotalRow}>
        <Text style={styles.grandTotalLabel}>Grand Total</Text>
        <Text style={styles.grandTotalAmount}>${grandTotal.toFixed(2)}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.subTotalsRow}>
        <View style={styles.subTotal}>
          <View style={styles.subTotalIconRow}>
            <Text style={styles.subTotalIcon}>💵</Text>
            <Text style={styles.subTotalLabel}>Cash</Text>
          </View>
          <Text style={[styles.subTotalAmount, styles.cashColor]}>
            ${cashTotal.toFixed(2)}
          </Text>
        </View>

        <View style={styles.subTotalSeparator} />

        <View style={styles.subTotal}>
          <View style={styles.subTotalIconRow}>
            <Text style={styles.subTotalIcon}>💳</Text>
            <Text style={styles.subTotalLabel}>Card</Text>
          </View>
          <Text style={[styles.subTotalAmount, styles.cardColor]}>
            ${cardTotal.toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1d4ed8',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    color: '#93c5fd',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    color: '#bfdbfe',
    fontSize: 12,
    fontWeight: '500',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  grandTotalLabel: {
    color: '#dbeafe',
    fontSize: 15,
    fontWeight: '600',
  },
  grandTotalAmount: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 16,
  },
  subTotalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subTotal: {
    flex: 1,
    alignItems: 'center',
  },
  subTotalSeparator: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 8,
  },
  subTotalIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  subTotalIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  subTotalLabel: {
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  subTotalAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  cashColor: {
    color: '#6ee7b7',
  },
  cardColor: {
    color: '#93c5fd',
  },
});
