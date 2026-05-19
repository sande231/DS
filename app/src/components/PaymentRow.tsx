import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PaymentEntry } from '../types';

interface PaymentRowProps {
  entry: PaymentEntry;
  type: 'cash' | 'card';
  isLast?: boolean;
}

export default function PaymentRow({ entry, type, isLast = false }: PaymentRowProps) {
  const amountColor = type === 'cash' ? '#059669' : '#2563eb';

  return (
    <View style={[styles.row, isLast && styles.rowLast]}>
      <View style={styles.iconWrapper}>
        <Text style={styles.icon}>{type === 'cash' ? '💵' : '💳'}</Text>
      </View>
      <Text style={styles.description} numberOfLines={2}>
        {entry.description}
      </Text>
      <Text style={[styles.amount, { color: amountColor }]}>
        ${entry.amount.toFixed(2)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  iconWrapper: {
    width: 28,
    alignItems: 'center',
    marginRight: 8,
  },
  icon: {
    fontSize: 16,
  },
  description: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    marginRight: 12,
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 70,
    textAlign: 'right',
  },
});
