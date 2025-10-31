import React, {useEffect, useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator} from 'react-native';
import * as Keychain from 'react-native-keychain';
import {useConsentStore} from '../state/useConsentStore';
import {generateDeviceKey} from '../crypto';
import {connectWallet} from '../lib/walletconnect';
import {colors, spacing, typography, borderRadius, shadows} from '../lib/design';

export const Onboarding: React.FC<{onComplete: () => void}> = ({onComplete}) => {
  const [step, setStep] = useState<'device' | 'wallet' | 'biometric' | 'handle'>('device');
  const [loading, setLoading] = useState(false);
  const [handleInput, setHandleInput] = useState('');
  const {setDeviceKey, setWallet, setProfile, profile} = useConsentStore();

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    // Check if device key exists
    try {
      const credentials = await Keychain.getGenericPassword({service: 'echoid-device'});
      if (credentials) {
        // Device key exists, check wallet
        // For MVP, proceed to wallet connection
        setStep('wallet');
      }
    } catch (error) {
      // No device key, start onboarding
    }
  };

  const handleGenerateDeviceKey = async () => {
    setLoading(true);
    try {
      const keyPair = await generateDeviceKey('echoid-device');
      setDeviceKey(keyPair);
      await Keychain.setGenericPassword('device-key', keyPair.publicKey, {
        service: 'echoid-device',
      });
      setStep('wallet');
    } catch (error) {
      Alert.alert('Error', 'Failed to generate device key');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    setLoading(true);
    try {
      const {accounts, chainId} = await connectWallet();
      setWallet({
        address: accounts[0],
        chainId,
        connected: true,
      });
      setStep('biometric');
    } catch (error) {
      Alert.alert('Error', 'Failed to connect wallet');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetupBiometric = async () => {
    // For MVP, just enable FaceID via Keychain
    // The Secure Enclave keys already require biometric
    try {
      await Keychain.setGenericPassword('biometric-enabled', 'true', {
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
      });
      // Skip handle step if already set, otherwise go to handle creation
      if (profile?.handle) {
        onComplete();
      } else {
        setStep('handle');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to setup biometric');
      console.error(error);
    }
  };

  const handleSkipHandle = () => {
    // User can skip handle creation and do it later from Profile
    onComplete();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to EchoID</Text>
      <Text style={styles.subtitle}>Secure consent management with cryptographic verification</Text>

      {step === 'device' && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Step 1: Generate Device Key</Text>
          <Text style={styles.stepDescription}>
            We'll create a secure key stored in your device's Secure Enclave. This key will be used
            to verify your identity and encrypt your data.
          </Text>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleGenerateDeviceKey}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Generate Device Key</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {step === 'wallet' && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Step 2: Connect Wallet</Text>
          <Text style={styles.stepDescription}>
            Connect your wallet (Rainbow, MetaMask, etc.) to mint consent NFTs and sign
            transactions.
          </Text>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleConnectWallet}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Connect Wallet</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {step === 'biometric' && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Step 3: Enable FaceID</Text>
          <Text style={styles.stepDescription}>
            Enable FaceID to securely unlock your vault and access your consents.
          </Text>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSetupBiometric}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Enable FaceID</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {step === 'handle' && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Step 4: Create Handle (Optional)</Text>
          <Text style={styles.stepDescription}>
            Choose a unique handle (e.g., @alex.wave) to make it easier for others to find you. You
            can skip this and do it later.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., alex.wave"
            value={handleInput}
            onChangeText={setHandleInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleSkipHandle}>
            <Text style={styles.secondaryButtonText}>Skip for Now</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: spacing.sm,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  stepContainer: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  stepTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.md,
  },
  stepDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    ...typography.bodyBold,
    color: colors.surface,
  },
  input: {
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
  },
  secondaryButtonText: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
});
