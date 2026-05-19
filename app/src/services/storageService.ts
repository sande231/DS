import AsyncStorage from '@react-native-async-storage/async-storage';
import { SalesData, AppSettings } from '../types';

const SALES_DATA_KEY = '@sales_capture:sales_data';
const SETTINGS_KEY = '@sales_capture:settings';

const DEFAULT_SETTINGS: AppSettings = {
  recipientEmail: '',
  senderName: '',
  autoSendEmail: false,
  serverUrl: 'http://localhost:3001',
};

// ─── Sales Data ─────────────────────────────────────────────────────────────

/**
 * Retrieves all stored SalesData records, sorted most-recent first.
 */
export async function getAllSalesData(): Promise<SalesData[]> {
  try {
    const raw = await AsyncStorage.getItem(SALES_DATA_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SalesData[];
    // Sort descending by date then by id (which contains timestamp)
    return parsed.sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date);
      if (dateCmp !== 0) return dateCmp;
      return b.id.localeCompare(a.id);
    });
  } catch (err) {
    console.error('[Storage] Failed to load sales data:', err);
    return [];
  }
}

/**
 * Saves a new SalesData record, prepending it to the existing list.
 */
export async function saveSalesData(data: SalesData): Promise<void> {
  try {
    const existing = await getAllSalesData();
    const updated = [data, ...existing.filter((r) => r.id !== data.id)];
    await AsyncStorage.setItem(SALES_DATA_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('[Storage] Failed to save sales data:', err);
    throw new Error('Failed to save sales record. Storage may be unavailable.');
  }
}

/**
 * Updates an existing SalesData record by id.
 */
export async function updateSalesData(
  id: string,
  updates: Partial<SalesData>
): Promise<SalesData | null> {
  try {
    const existing = await getAllSalesData();
    const index = existing.findIndex((r) => r.id === id);
    if (index === -1) return null;

    const updated = { ...existing[index], ...updates };
    existing[index] = updated;
    await AsyncStorage.setItem(SALES_DATA_KEY, JSON.stringify(existing));
    return updated;
  } catch (err) {
    console.error('[Storage] Failed to update sales data:', err);
    throw new Error('Failed to update sales record.');
  }
}

/**
 * Deletes a SalesData record by id.
 */
export async function deleteSalesData(id: string): Promise<void> {
  try {
    const existing = await getAllSalesData();
    const filtered = existing.filter((r) => r.id !== id);
    await AsyncStorage.setItem(SALES_DATA_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('[Storage] Failed to delete sales data:', err);
    throw new Error('Failed to delete sales record.');
  }
}

/**
 * Clears all stored sales data. Use with caution.
 */
export async function clearAllSalesData(): Promise<void> {
  await AsyncStorage.removeItem(SALES_DATA_KEY);
}

// ─── Settings ────────────────────────────────────────────────────────────────

/**
 * Retrieves app settings, merging with defaults for any missing keys.
 */
export async function getSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (err) {
    console.error('[Storage] Failed to load settings:', err);
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Saves app settings, merging with existing settings.
 */
export async function saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  try {
    const current = await getSettings();
    const updated = { ...current, ...settings };
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('[Storage] Failed to save settings:', err);
    throw new Error('Failed to save settings. Storage may be unavailable.');
  }
}

/**
 * Resets settings to defaults.
 */
export async function resetSettings(): Promise<AppSettings> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
  return { ...DEFAULT_SETTINGS };
}
