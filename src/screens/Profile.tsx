import React, {useState, useEffect} from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Platform} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useConsentStore} from '../state/useConsentStore';
import {QRCodeView} from '../components/QRCodeView';
import {normalizeHandle, formatHandle, validateHandle, registerHandle, encodeQRInvite, generateDeepLink} from '../lib/handles';
import {getConfig} from '../lib/config';
import {signWithDeviceKey} from '../crypto';
import {sha3_256} from 'js-sha3';
import {colors, spacing, typography, borderRadius, shadows} from '../lib/design';

export const Profile: React.FC<{onBack: () => void}> = ({onBack}) => {
  const {wallet, deviceKey, profile, setProfile} = useConsentStore();
  const [handle, setHandle] = useState(profile?.handle || '');
  const [inputHandle, setInputHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const config = getConfig();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (profile?.handle) {
      setHandle(profile.handle);
    }
  }, [profile]);

  const handleClaim = async () => {
    if (!inputHandle.trim()) {
      Alert.alert('Error', 'Please enter a handle');
      return;
    }

    if (!validateHandle(inputHandle)) {
      Alert.alert('Error', 'Invalid handle format. Use letters, numbers, and dots (e.g., alex.wave)');
      return;
    }

    if (!wallet.address || !deviceKey) {
      Alert.alert('Error', 'Wallet and device key required');
      return;
    }

    setLoading(true);
    try {
      const normalized = normalizeHandle(inputHandle);

      // Create signature challenge
      const challenge = `echoid:register:${normalized}:${wallet.address}:${Date.now()}`;
      const challengeBytes = new Uint8Array(Buffer.from(challenge));
      const signature = await signWithDeviceKey(challengeBytes);

      await registerHandle(
        normalized,
        wallet.address,
        deviceKey.publicKey,
        signature,
        config.apiBaseUrl,
      );

      const profileData = {
        handle: normalized,
        qrPayload: generateQRPayload(normalized),
        ensName: undefined,
      };

      setProfile(profileData);
      setHandle(normalized);
      setInputHandle('');
      Alert.alert('Success', `Handle @${normalized} registered!`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to register handle');
    } finally {
      setLoading(false);
    }
  };

  const generateQRPayload = (handleValue: string) => {
    if (!wallet.address || !deviceKey) return '';

    const payload = {
      handle: handleValue,
      wallet: wallet.address,
      devicePubKey: deviceKey.publicKey,
      timestamp: Date.now(),
    };

    return encodeQRInvite(payload);
  };

  const getQRValue = () => {
    if (handle && profile?.qrPayload) {
      return profile.qrPayload;
    }
    if (handle && wallet.address && deviceKey) {
      return generateQRPayload(handle);
    }
    return '';
  };

  const handleShare = async () => {
    if (!handle) return;
    const deepLink = generateDeepLink('user', handle);
    // In production, use Share API
    Alert.alert('Share', `Deep link: ${deepLink}`);
  };

  return (
    <SafeAreaView style={[styles.container, {paddingTop: Math.max(insets.top, spacing.md)}]} edges={['top']}>
      <View style={[styles.header, {paddingTop: Math.max(insets.top, spacing.md)}]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, {paddingBottom: insets.bottom + spacing.xl}]}
        showsVerticalScrollIndicator={false}>
        
        {/* Username Section */}
        <View style={styles.usernameSection}>
          <Text style={styles.usernameLabel}>Username</Text>
          <Text style={styles.usernameValue}>@{profile?.username || 'Not set'}</Text>
        </View>

        {handle ? (
          <>
            <View style={styles.handleSection}>
              <Text style={styles.handleLabel}>EchoID Handle</Text>
              <Text style={styles.handleValue}>{formatHandle(handle)}</Text>
              {profile?.ensName && (
                <Text style={styles.ensName}>ENS: {profile.ensName}</Text>
              )}
            </View>

            <View style={styles.qrSection}>
              <Text style={styles.sectionTitle}>Share Your EchoID</Text>
              <QRCodeView
                value={getQRValue()}
                size={200}
                showFullValue={true}
                onShare={handleShare}
              />
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => setShowQR(!showQR)}>
                <Text style={styles.toggleButtonText}>
                  {showQR ? 'Hide QR' : 'Show Full QR'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.walletSection}>
              <Text style={styles.sectionTitle}>Wallet</Text>
              <Text style={styles.walletAddress} numberOfLines={1} ellipsizeMode="middle">
                {wallet.address}
              </Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.claimSection}>
              <Text style={styles.claimTitle}>Claim Your EchoID Handle</Text>
              <Text style={styles.claimDescription}>
                Choose a unique handle (e.g., @alex.wave) to make it easier for others to find and
                connect with you.
              </Text>

              <TextInput
                style={styles.input}
                placeholder="e.g., alex.wave"
                value={inputHandle}
                onChangeText={setInputHandle}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TouchableOpacity
                style={[styles.claimButton, loading && styles.buttonDisabled]}
                onPress={handleClaim}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.claimButtonText}>Claim Handle</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  backButton: {
    paddingRight: spacing.md,
    paddingVertical: spacing.xs,
    minWidth: 44,
  },
  backButtonText: {
    fontSize: 28,
    color: colors.primary,
    fontWeight: '400',
  },
  headerTitle: {
    ...typography.h2,
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
    flex: 1,
    color: colors.text,
  },
  headerSpacer: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  usernameSection: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        ...shadows.md,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  usernameLabel: {
    ...typography.caption,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  usernameValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  handleSection: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        ...shadows.md,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  handleLabel: {
    ...typography.caption,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  handleValue: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  ensName: {
    ...typography.caption,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  qrSection: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        ...shadows.md,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sectionTitle: {
    ...typography.h3,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.lg,
    color: colors.text,
  },
  toggleButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
  },
  toggleButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  walletSection: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
    ...Platform.select({
      ios: {
        ...shadows.md,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  walletAddress: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: Platform.select({ios: 'Menlo', android: 'monospace'}),
    letterSpacing: 0.5,
  },
  claimSection: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    ...Platform.select({
      ios: {
        ...shadows.md,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  claimTitle: {
    ...typography.h2,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: spacing.sm,
    color: colors.text,
    letterSpacing: -0.5,
  },
  claimDescription: {
    ...typography.body,
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  input: {
    ...typography.body,
    fontSize: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md + 4,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  claimButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md + 4,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    minHeight: 50,
    ...Platform.select({
      ios: {
        ...shadows.sm,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  claimButtonText: {
    ...typography.bodyBold,
    fontSize: 17,
    fontWeight: '600',
    color: colors.surface,
  },
});
