import { PaymentEntry, SalesData } from '../types';

/**
 * Sums all payment amounts in an array, rounded to 2 decimal places.
 */
export function sumPayments(payments: PaymentEntry[]): number {
  const total = payments.reduce((acc, entry) => acc + entry.amount, 0);
  return Math.round(total * 100) / 100;
}

/**
 * Groups an array of SalesData records by their date string (YYYY-MM-DD).
 * Returns an object keyed by date, with arrays of records as values.
 * Dates are sorted in descending order (most recent first).
 */
export function groupByDate(records: SalesData[]): Record<string, SalesData[]> {
  const grouped: Record<string, SalesData[]> = {};

  for (const record of records) {
    const date = record.date;
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(record);
  }

  // Sort each group by insertion order (already maintained by push)
  return grouped;
}

/**
 * Returns the sorted date keys from a grouped record (descending).
 */
export function getSortedDates(grouped: Record<string, SalesData[]>): string[] {
  return Object.keys(grouped).sort((a, b) => b.localeCompare(a));
}

/**
 * Aggregates totals for a given day's records.
 */
export function getDayTotals(records: SalesData[]): {
  cashTotal: number;
  cardTotal: number;
  grandTotal: number;
  recordCount: number;
} {
  let cashTotal = 0;
  let cardTotal = 0;

  for (const record of records) {
    cashTotal += record.cashTotal;
    cardTotal += record.cardTotal;
  }

  cashTotal = Math.round(cashTotal * 100) / 100;
  cardTotal = Math.round(cardTotal * 100) / 100;

  return {
    cashTotal,
    cardTotal,
    grandTotal: Math.round((cashTotal + cardTotal) * 100) / 100,
    recordCount: records.length,
  };
}

/**
 * Filters SalesData records to only those matching the given date string.
 */
export function filterByDate(records: SalesData[], dateString: string): SalesData[] {
  return records.filter((r) => r.date === dateString);
}

/**
 * Returns totals for today from an array of all records.
 */
export function getTodayTotals(
  records: SalesData[],
  todayString: string
): { cashTotal: number; cardTotal: number; grandTotal: number; recordCount: number } {
  const todayRecords = filterByDate(records, todayString);
  return getDayTotals(todayRecords);
}
