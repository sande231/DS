import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import SalesSummaryCard from '../components/SalesSummaryCard';
import { getAllSalesData } from '../services/storageService';
import { SalesData, RootStackParamList } from '../types';
import { getTodayString, getRelativeLabel } from '../utils/dateUtils';
import { getTodayTotals, groupByDate, getSortedDates } from '../utils/dataAggregation';

type HomeNavProp = StackNavigationProp<RootStackParamList>;

function ConfidenceDot({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  const colors = { high: '#10b981', medium: '#f59e0b', low: '#ef4444' };
  return (
    <View
      style={[
        styles.confidenceDot,
        { backgroundColor: colors[confidence] },
      ]}
    />
  );
}

function HistoryItem({
  record,
  onPress,
}: {
  record: SalesData;
  onPress: () => void;
}) {
  const grandTotal = record.cashTotal + record.cardTotal;
  return (
    <TouchableOpacity style={styles.historyItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.historyLeft}>
        <View style={styles.historyTitleRow}>
          <ConfidenceDot confidence={record.confidence} />
          <Text style={styles.historyTime}>
            {new Date(parseInt(record.id.split('_')[1])).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </Text>
          {record.emailSent && <Text style={styles.emailSentBadge}>✉ Sent</Text>}
        </View>
        <Text style={styles.historySubtext}>
          Cash: ${record.cashTotal.toFixed(2)} · Card: ${record.cardTotal.toFixed(2)}
        </Text>
      </View>
      <Text style={styles.historyTotal}>${grandTotal.toFixed(2)}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const [records, setRecords] = useState<SalesData[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const todayString = getTodayString();

  const loadData = useCallback(async () => {
    const data = await getAllSalesData();
    setRecords(data);
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

  const todayTotals = getTodayTotals(records, todayString);
  const grouped = groupByDate(records);
  const sortedDates = getSortedDates(grouped);
  const recentDates = sortedDates.slice(0, 7);

  const handleRecordPress = (record: SalesData) => {
    navigation.navigate('Review', { salesData: record });
  };

  const handleCapturePress = () => {
    // Navigate to Camera tab
    navigation.navigate('Main' as never);
    // Small workaround: navigate to Camera tab using tab navigator
    // This is done by accessing the parent navigator
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1d4ed8" />
      }
    >
      {/* Today's Summary Card */}
      <View style={styles.section}>
        <SalesSummaryCard
          cashTotal={todayTotals.cashTotal}
          cardTotal={todayTotals.cardTotal}
          recordCount={todayTotals.recordCount}
          label="Today's Sales"
        />
      </View>

      {/* Quick Capture Button */}
      <TouchableOpacity
        style={styles.captureButton}
        activeOpacity={0.85}
        onPress={() => {
          Alert.alert(
            'Capture Sales',
            'Tap the "Capture" tab at the bottom to photograph your sales record.',
            [{ text: 'OK' }]
          );
        }}
      >
        <Text style={styles.captureButtonIcon}>📷</Text>
        <Text style={styles.captureButtonText}>Capture Sales Record</Text>
      </TouchableOpacity>

      {/* Recent History */}
      {recentDates.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentDates.map((date) => {
            const dayRecords = grouped[date];
            const label = getRelativeLabel(date);
            return (
              <View key={date} style={styles.dateGroup}>
                <Text style={styles.dateGroupLabel}>{label}</Text>
                <View style={styles.dateGroupCard}>
                  {dayRecords.map((record, index) => (
                    <HistoryItem
                      key={record.id}
                      record={record}
                      onPress={() => handleRecordPress(record)}
                    />
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>No records yet</Text>
          <Text style={styles.emptySubtext}>
            Tap "Capture" to photograph your first sales record
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  captureButton: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#1d4ed8',
    borderStyle: 'dashed',
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  captureButtonIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  captureButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  dateGroup: {
    marginBottom: 16,
  },
  dateGroupLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  dateGroupCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  historyLeft: {
    flex: 1,
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  historyTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginRight: 8,
  },
  emailSentBadge: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  historySubtext: {
    fontSize: 12,
    color: '#6b7280',
  },
  historyTotal: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
