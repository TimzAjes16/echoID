import React, {useState, useEffect} from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView} from 'react-native';
import {useConsentStore} from '../state/useConsentStore';
import {QRCodeView} from '../components/QRCodeView';
import {normalizeHandle, formatHandle, validateHandle, registerHandle, encodeQRInvite, generateDeepLink} from '../lib/handles';
import {getConfig} from '../lib/config';
import {signWithDeviceKey} from '../crypto';
import {sha3_256} from 'js-sha3';

export const Profile: React.FC<{onBack: () => void}> = ({onBack}) => {
  const {wallet, deviceKey, profile, setProfile} = useConsentStore();
  const [handle, setHandle] = useState(profile?.handle || '');
  const [inputHandle, setInputHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const config = getConfig();

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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {handle ? (
          <>
            <View style={styles.handleSection}>
              <Text style={styles.handleLabel}>Your Handle</Text>
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
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    paddingRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    padding: 20,
  },
  handleSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  handleLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  handleValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  ensName: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
  },
  qrSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  toggleButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  toggleButtonText: {
    color: '#007AFF',
    fontSize: 14,
  },
  walletSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  walletAddress: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'monospace',
  },
  claimSection: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
  },
  claimTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
  },
  claimDescription: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 24,
    lineHeight: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  claimButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  claimButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});
