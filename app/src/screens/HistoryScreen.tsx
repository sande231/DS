import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getAllSalesData, deleteSalesData } from '../services/storageService';
import { SalesData, RootStackParamList } from '../types';
import { getRelativeLabel } from '../utils/dateUtils';
import { groupByDate, getSortedDates, getDayTotals } from '../utils/dataAggregation';

type HistoryNavProp = NativeStackNavigationProp<RootStackParamList>;

interface HistoryGroup {
  date: string;
  records: SalesData[];
  cashTotal: number;
  cardTotal: number;
  grandTotal: number;
}

function ConfidenceBadge({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  const config = {
    high: { bg: '#d1fae5', text: '#065f46', label: '●' },
    medium: { bg: '#fef3c7', text: '#92400e', label: '●' },
    low: { bg: '#fee2e2', text: '#991b1b', label: '●' },
  };
  const c = config[confidence];
  return (
    <View style={[styles.confBadge, { backgroundColor: c.bg }]}>
      <Text style={[styles.confBadgeText, { color: c.text }]}>{c.label}</Text>
    </View>
  );
}

function RecordItem({
  record,
  onPress,
  onDelete,
}: {
  record: SalesData;
  onPress: () => void;
  onDelete: () => void;
}) {
  const grandTotal = record.cashTotal + record.cardTotal;
  const time = (() => {
    try {
      const ts = parseInt(record.id.split('_')[1]);
      return new Date(ts).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  })();

  const handleLongPress = () => {
    Alert.alert(
      'Delete Record',
      'Are you sure you want to delete this sales record? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={styles.recordItem}
      onPress={onPress}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
    >
      {/* Receipt thumbnail */}
      {record.imageUri ? (
        <Image source={{ uri: record.imageUri }} style={styles.thumbnail} resizeMode="cover" />
      ) : (
        <View style={styles.thumbnailPlaceholder}>
          <Text style={styles.thumbnailPlaceholderText}>🧾</Text>
        </View>
      )}

      <View style={styles.recordLeft}>
        <View style={styles.recordTitleRow}>
          <ConfidenceBadge confidence={record.confidence} />
          {time ? <Text style={styles.recordTime}>{time}</Text> : null}
          {record.emailSent && (
            <View style={styles.emailSentBadge}>
              <Text style={styles.emailSentBadgeText}>✉ Sent</Text>
            </View>
          )}
        </View>
        <Text style={styles.recordSubtext}>
          Cash ${record.cashTotal.toFixed(2)} · Card ${record.cardTotal.toFixed(2)}
        </Text>
        <Text style={styles.recordTotal}>${grandTotal.toFixed(2)}</Text>
      </View>

      {/* Delete button */}
      <TouchableOpacity style={styles.deleteButton} onPress={handleLongPress} activeOpacity={0.7}>
        <Text style={styles.deleteButtonText}>🗑️</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function DateGroupHeader({ group }: { group: HistoryGroup }) {
  const label = getRelativeLabel(group.date);
  return (
    <View style={styles.groupHeader}>
      <View style={styles.groupHeaderLeft}>
        <Text style={styles.groupLabel}>{label}</Text>
        <Text style={styles.groupDate}>{group.date}</Text>
      </View>
      <View style={styles.groupHeaderRight}>
        <Text style={styles.groupTotal}>${group.grandTotal.toFixed(2)}</Text>
        <Text style={styles.groupSubtotals}>
          💵 ${group.cashTotal.toFixed(2)} · 💳 ${group.cardTotal.toFixed(2)}
        </Text>
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const navigation = useNavigation<HistoryNavProp>();
  const [groups, setGroups] = useState<HistoryGroup[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  const loadData = useCallback(async () => {
    const records = await getAllSalesData();
    setTotalRecords(records.length);
    const grouped = groupByDate(records);
    const sortedDates = getSortedDates(grouped);
    const builtGroups: HistoryGroup[] = sortedDates.map((date) => {
      const dayRecords = grouped[date];
      const totals = getDayTotals(dayRecords);
      return {
        date,
        records: dayRecords,
        cashTotal: totals.cashTotal,
        cardTotal: totals.cardTotal,
        grandTotal: totals.grandTotal,
      };
    });
    setGroups(builtGroups);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleRecordPress = (record: SalesData) => {
    navigation.navigate('Review', { salesData: record });
  };

  const handleDeleteRecord = async (recordId: string) => {
    try {
      await deleteSalesData(recordId);
      await loadData();
    } catch {
      Alert.alert('Error', 'Failed to delete record. Please try again.');
    }
  };

  type FlatItem =
    | { type: 'header'; group: HistoryGroup }
    | { type: 'record'; record: SalesData; groupDate: string };

  const flatItems: FlatItem[] = [];
  for (const group of groups) {
    flatItems.push({ type: 'header', group });
    for (const record of group.records) {
      flatItems.push({ type: 'record', record, groupDate: group.date });
    }
  }

  const renderItem = ({ item }: { item: FlatItem }) => {
    if (item.type === 'header') {
      return <DateGroupHeader group={item.group} />;
    }
    return (
      <RecordItem
        record={item.record}
        onPress={() => handleRecordPress(item.record)}
        onDelete={() => handleDeleteRecord(item.record.id)}
      />
    );
  };

  return (
    <View style={styles.container}>
      {totalRecords > 0 && (
        <View style={styles.summaryBar}>
          <Text style={styles.summaryText}>
            {totalRecords} {totalRecords === 1 ? 'record' : 'records'} · Tap 🗑️ to delete
          </Text>
        </View>
      )}

      <FlatList
        data={flatItems}
        keyExtractor={(item) =>
          item.type === 'header' ? `hdr-${item.group.date}` : `rec-${item.record.id}`
        }
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1d4ed8" />
        }
        contentContainerStyle={
          flatItems.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No history yet</Text>
            <Text style={styles.emptySubtext}>
              Captured sales records will appear here
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  summaryBar: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#dbeafe',
  },
  summaryText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  groupHeaderLeft: {},
  groupHeaderRight: {
    alignItems: 'flex-end',
  },
  groupLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
  },
  groupDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  groupTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  groupSubtotals: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  recordItem: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    marginHorizontal: 16,
    marginBottom: 1,
    borderRadius: 2,
  },
  recordLeft: {
    flex: 1,
  },
  recordTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  confBadge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  confBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  recordTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  emailSentBadge: {
    backgroundColor: '#d1fae5',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  emailSentBadgeText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  recordSubtext: {
    fontSize: 12,
    color: '#6b7280',
  },
  recordNotes: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
    fontStyle: 'italic',
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#f3f4f6',
  },
  thumbnailPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailPlaceholderText: {
    fontSize: 22,
  },
  recordTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1d4ed8',
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 4,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 52,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
