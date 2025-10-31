import React, {useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import {QRScanner} from './QRScanner';
import {resolveHandle, decodeQRInvite, parseDeepLink, normalizeHandle} from '../lib/handles';
import {getConfig} from '../lib/config';
import {colors, spacing, typography, borderRadius, shadows} from '../lib/design';

interface ParticipantInputProps {
  onParticipantSelected: (wallet: string, handle?: string) => void;
  onCancel?: () => void;
}

export const ParticipantInput: React.FC<ParticipantInputProps> = ({
  onParticipantSelected,
  onCancel,
}) => {
  const [inputMode, setInputMode] = useState<'choice' | 'qr' | 'handle' | 'wallet'>('choice');
  const [handleInput, setHandleInput] = useState('');
  const [walletInput, setWalletInput] = useState('');
  const [loading, setLoading] = useState(false);
  const config = getConfig();

  const handleQRScan = async (data: string) => {
    try {
      // Try to parse as deep link
      const deepLink = parseDeepLink(data);
      if (deepLink) {
        if (deepLink.type === 'user') {
          // Resolve handle from deep link
          const normalized = normalizeHandle(deepLink.identifier);
          await handleResolveHandle(normalized);
          return;
        } else if (deepLink.type === 'invite') {
          // Handle invite link
          Alert.alert('Invite', 'Invite link detected - opening...');
          // TODO: Handle invite flow
          return;
        }
      }

      // Try to decode as QR invite payload
      const payload = decodeQRInvite(data);
      onParticipantSelected(payload.wallet, payload.handle);
      setInputMode('choice');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Invalid QR code format');
    }
  };

  const handleResolveHandle = async (normalizedHandle: string) => {
    setLoading(true);
    try {
      const resolution = await resolveHandle(normalizedHandle, config.apiBaseUrl);
      onParticipantSelected(resolution.wallet, normalizedHandle);
      setInputMode('choice');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resolve handle');
    } finally {
      setLoading(false);
    }
  };

  const handleHandleSubmit = () => {
    if (!handleInput.trim()) {
      Alert.alert('Error', 'Please enter a handle');
      return;
    }

    try {
      const normalized = normalizeHandle(handleInput);
      handleResolveHandle(normalized);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleWalletSubmit = () => {
    if (!walletInput.trim()) {
      Alert.alert('Error', 'Please enter a wallet address');
      return;
    }

    // Basic validation
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletInput.trim())) {
      Alert.alert('Error', 'Invalid wallet address format');
      return;
    }

    onParticipantSelected(walletInput.trim());
    setInputMode('choice');
  };

  if (inputMode === 'qr') {
    return (
      <QRScanner
        onScan={handleQRScan}
        onCancel={() => setInputMode('choice')}
        title="Scan Participant QR"
      />
    );
  }

  if (inputMode === 'handle') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Add by Handle</Text>
        <TextInput
          style={styles.input}
          placeholder="@alex.wave"
          value={handleInput}
          onChangeText={setHandleInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => setInputMode('choice')}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.submitButton, loading && styles.buttonDisabled]}
            onPress={handleHandleSubmit}
            disabled={loading}>
            <Text style={styles.submitButtonText}>
              {loading ? 'Resolving...' : 'Add'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (inputMode === 'wallet') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Add by Wallet Address</Text>
        <TextInput
          style={styles.input}
          placeholder="0x..."
          value={walletInput}
          onChangeText={setWalletInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => setInputMode('choice')}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.submitButton]}
            onPress={handleWalletSubmit}>
            <Text style={styles.submitButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Participant</Text>
      <Text style={styles.description}>
        Choose how you'd like to add the other participant
      </Text>

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => setInputMode('qr')}
          activeOpacity={0.7}>
          <View style={styles.optionIcon}>
            <Text style={styles.optionIconText}>📷</Text>
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Scan QR Code</Text>
            <Text style={styles.optionSubtitle}>Scan their EchoID QR</Text>
          </View>
          <Text style={styles.optionArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => setInputMode('handle')}
          activeOpacity={0.7}>
          <View style={styles.optionIcon}>
            <Text style={styles.optionIconText}>@</Text>
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Enter Handle</Text>
            <Text style={styles.optionSubtitle}>e.g., @alex.wave</Text>
          </View>
          <Text style={styles.optionArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => setInputMode('wallet')}
          activeOpacity={0.7}>
          <View style={styles.optionIcon}>
            <Text style={styles.optionIconText}>0x</Text>
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Wallet Address</Text>
            <Text style={styles.optionSubtitle}>Paste wallet address</Text>
          </View>
          <Text style={styles.optionArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {onCancel && (
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel} activeOpacity={0.7}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  optionsContainer: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  optionIconText: {
    fontSize: 20,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: 2,
  },
  optionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  optionArrow: {
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  input: {
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
    color: colors.text,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  cancelButtonText: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
  submitButton: {
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  submitButtonText: {
    ...typography.bodyBold,
    color: colors.surface,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
