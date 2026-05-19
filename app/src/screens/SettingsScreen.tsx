import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import LoadingOverlay from '../components/LoadingOverlay';
import { getSettings, saveSettings } from '../services/storageService';
import { sendTestEmail } from '../services/emailService';
import { AppSettings } from '../types';

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'none',
  hint,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'url' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words';
  hint?: string;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
      />
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionHeaderContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings>({
    recipientEmail: '',
    senderName: '',
    autoSendEmail: false,
    serverUrl: 'http://localhost:3001',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const loadSettings = useCallback(async () => {
    const stored = await getSettings();
    setSettings(stored);
    setIsDirty(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings])
  );

  const updateField = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    // Validate recipient email
    if (settings.recipientEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(settings.recipientEmail)) {
        Alert.alert('Invalid Email', 'Please enter a valid recipient email address.');
        return;
      }
    }

    // Validate server URL
    if (settings.serverUrl) {
      try {
        new URL(settings.serverUrl);
      } catch {
        Alert.alert(
          'Invalid URL',
          'Please enter a valid server URL (e.g., http://192.168.1.100:3001)'
        );
        return;
      }
    }

    setIsSaving(true);
    try {
      await saveSettings(settings);
      setIsDirty(false);
      Alert.alert('Saved', 'Settings have been saved successfully.');
    } catch (err) {
      Alert.alert('Save Failed', 'Could not save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!settings.recipientEmail) {
      Alert.alert('No Email Set', 'Please enter a recipient email address first, then save.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(settings.recipientEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid recipient email address.');
      return;
    }

    if (isDirty) {
      Alert.alert(
        'Unsaved Changes',
        'Please save your settings first before sending a test email.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsTesting(true);
    try {
      await sendTestEmail(settings.recipientEmail, settings.senderName);
      Alert.alert(
        'Test Email Sent',
        `A test email has been sent to ${settings.recipientEmail}. Check your inbox.`
      );
    } catch (err) {
      const error = err as Error;
      Alert.alert(
        'Test Failed',
        error.message || 'Could not send test email. Check your server and SMTP configuration.'
      );
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Email Configuration */}
        <View style={styles.card}>
          <SectionHeader
            title="📧 Email Configuration"
            subtitle="Where to send the daily sales summary"
          />

          <FormField
            label="Recipient Email"
            value={settings.recipientEmail}
            onChangeText={(v) => updateField('recipientEmail', v)}
            placeholder="manager@example.com"
            keyboardType="email-address"
            hint="The email address that will receive daily summaries"
          />

          <FormField
            label="Sender Name"
            value={settings.senderName}
            onChangeText={(v) => updateField('senderName', v)}
            placeholder="My Business"
            autoCapitalize="words"
            hint="Displayed in the email 'From' field"
          />

          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <Text style={styles.toggleLabel}>Auto-send Email</Text>
              <Text style={styles.toggleHint}>Automatically email after each capture</Text>
            </View>
            <Switch
              value={settings.autoSendEmail}
              onValueChange={(v) => updateField('autoSendEmail', v)}
              trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
              thumbColor={settings.autoSendEmail ? '#1d4ed8' : '#9ca3af'}
            />
          </View>
        </View>

        {/* Server Configuration */}
        <View style={styles.card}>
          <SectionHeader
            title="🖥️ Server Configuration"
            subtitle="Backend server connection settings"
          />

          <FormField
            label="Server URL"
            value={settings.serverUrl}
            onChangeText={(v) => updateField('serverUrl', v)}
            placeholder="http://192.168.1.100:3001"
            keyboardType="url"
            hint="URL of your self-hosted backend server. Use your local IP when testing on a device."
          />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.saveButton, !isDirty && styles.saveButtonDimmed]}
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonIcon}>💾</Text>
            <Text style={styles.saveButtonText}>Save Settings</Text>
            {isDirty && <View style={styles.unsavedDot} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testEmailButton}
            onPress={handleTestEmail}
            activeOpacity={0.8}
            disabled={isTesting}
          >
            <Text style={styles.testEmailButtonIcon}>🧪</Text>
            <Text style={styles.testEmailButtonText}>Send Test Email</Text>
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ℹ️ Setup Guide</Text>
          <Text style={styles.infoText}>
            1. Start the backend server with <Text style={styles.infoCode}>npm run dev</Text>{'\n'}
            2. Set the Server URL to your machine's local IP address{'\n'}
            3. Configure ANTHROPIC_API_KEY in the server's .env file{'\n'}
            4. Set up SMTP credentials in the server's .env file{'\n'}
            5. Enter a recipient email and tap Save{'\n'}
            6. Send a Test Email to verify everything works
          </Text>
        </View>
      </ScrollView>

      <LoadingOverlay visible={isSaving || isTesting} message={isSaving ? 'Saving...' : 'Sending test email...'} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeaderContainer: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1f2937',
    backgroundColor: '#fafafa',
  },
  fieldHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    lineHeight: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  toggleLeft: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  toggleHint: {
    fontSize: 12,
    color: '#9ca3af',
  },
  actions: {
    gap: 12,
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#1d4ed8',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    position: 'relative',
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  saveButtonDimmed: {
    opacity: 0.65,
    shadowOpacity: 0.1,
  },
  saveButtonIcon: {
    fontSize: 18,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  unsavedDot: {
    position: 'absolute',
    top: 10,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fbbf24',
  },
  testEmailButton: {
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
  testEmailButtonIcon: {
    fontSize: 18,
  },
  testEmailButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 22,
  },
  infoCode: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
});
