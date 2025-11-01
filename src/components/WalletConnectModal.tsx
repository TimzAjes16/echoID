import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import {colors, spacing, typography, borderRadius, shadows} from '../lib/design';

interface WalletConnectModalProps {
  visible: boolean;
  uri: string | null;
  onClose: () => void;
}

/**
 * WalletConnect QR Code Modal for Expo Go
 * Displays QR code and deep link option for wallet connection
 */
export const WalletConnectModal: React.FC<WalletConnectModalProps> = ({
  visible,
  uri,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (uri && visible) {
      console.log('WalletConnect URI:', uri);
      // Auto-open deep link on mobile if available
      if (uri.startsWith('wc:')) {
        // Deep link format: wc:...
        // Can be opened directly with Linking.openURL
      }
    }
  }, [uri, visible]);

  const handleDeepLink = async () => {
    if (!uri) return;

    try {
      // Open WalletConnect deep link
      // Format: wc:uri_string
      const deepLink = uri.startsWith('wc:') ? uri : `wc:${uri}`;
      const canOpen = await Linking.canOpenURL(deepLink);
      
      if (canOpen) {
        await Linking.openURL(deepLink);
        console.log('Opened WalletConnect deep link');
      } else {
        // Fallback: copy URI and show instructions
        Alert.alert(
          'Deep Link Not Available',
          'Please scan the QR code with your wallet app or copy the connection string.',
          [{text: 'OK'}],
        );
      }
    } catch (error: any) {
      console.error('Failed to open deep link:', error);
      Alert.alert('Error', 'Failed to open wallet app. Please scan the QR code instead.');
    }
  };

  const handleCopyURI = async () => {
    if (!uri) return;

    try {
      const {default: Clipboard} = await import('@react-native-clipboard/clipboard');
      await Clipboard.setString(uri);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      Alert.alert('Copied', 'Connection string copied to clipboard');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (!visible || !uri) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Connect Wallet</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.instruction}>
              Scan this QR code with your wallet app (Rainbow, MetaMask, etc.)
            </Text>

            <View style={styles.qrContainer}>
              {uri ? (
                <QRCode
                  value={uri}
                  size={250}
                  color={colors.text}
                  backgroundColor={colors.surface}
                />
              ) : (
                <ActivityIndicator size="large" color={colors.primary} />
              )}
            </View>

            <TouchableOpacity style={styles.deepLinkButton} onPress={handleDeepLink}>
              <Text style={styles.deepLinkText}>📱 Open in Wallet App</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.copyButton} onPress={handleCopyURI}>
              <Text style={styles.copyText}>
                {copied ? '✓ Copied' : '📋 Copy Connection String'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.note}>
              Make sure you're using a compatible wallet app with WalletConnect support.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    width: '90%',
    maxWidth: 400,
    ...Platform.select({
      ios: shadows.lg,
      android: {
        elevation: 10,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h2,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    padding: spacing.xs,
  },
  closeText: {
    fontSize: 24,
    color: colors.textSecondary,
    fontWeight: '300',
  },
  content: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  instruction: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  qrContainer: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    ...Platform.select({
      ios: shadows.sm,
      android: {
        elevation: 2,
      },
    }),
  },
  deepLinkButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...Platform.select({
      ios: shadows.sm,
      android: {
        elevation: 2,
      },
    }),
  },
  deepLinkText: {
    ...typography.bodyBold,
    fontSize: 16,
    color: colors.surface,
  },
  copyButton: {
    backgroundColor: colors.background,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    width: '100%',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  copyText: {
    ...typography.body,
    fontSize: 14,
    color: colors.text,
  },
  note: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});

