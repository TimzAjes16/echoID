import React, {useEffect, useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView} from 'react-native';
import * as Keychain from 'react-native-keychain';
import {useConsentStore} from '../state/useConsentStore';
import {generateDeviceKey} from '../crypto';
import {connectWallet} from '../lib/walletconnect';
import {createWallet} from '../lib/wallet';
import {colors, spacing, typography, borderRadius, shadows} from '../lib/design';

export const Onboarding: React.FC<{onComplete: () => void}> = ({onComplete}) => {
  const [step, setStep] = useState<'device' | 'wallet' | 'biometric' | 'handle' | 'showMnemonic'>('device');
  const [loading, setLoading] = useState(false);
  const [handleInput, setHandleInput] = useState('');
  const [mnemonic, setMnemonic] = useState<string>('');
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

  const handleCreateWallet = async () => {
    setLoading(true);
    try {
      const {address, mnemonic: newMnemonic} = await createWallet();
      setMnemonic(newMnemonic);
      setWallet({
        address,
        chainId: '84532', // Base Sepolia
        connected: true,
      });
      setStep('showMnemonic');
    } catch (error: any) {
      Alert.alert('Error', `Failed to create wallet: ${error?.message || error}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleMnemonicConfirmed = () => {
    // Clear mnemonic from memory and proceed
    setMnemonic('');
    setStep('biometric');
  };

  const handleSetupBiometric = async () => {
    // Set up FaceID for vault access
    try {
      // Initialize vault with biometric protection
      await Keychain.setGenericPassword('vault-key', 'vault-unlocked', {
        service: 'echoid-vault',
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
      
      // Also store biometric enabled flag
      await Keychain.setGenericPassword('biometric-enabled', 'true', {
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
      });
      
      // Skip handle step if already set, otherwise go to handle creation
      if (profile?.handle) {
        onComplete();
      } else {
        setStep('handle');
      }
    } catch (error: any) {
      // If biometric is not available or user cancels, store without access control
      if (error.message?.includes('BiometryNotAvailable')) {
        Alert.alert('FaceID Not Available', 'FaceID is not available on this device. Vault will be accessible without biometric protection.');
        await Keychain.setGenericPassword('vault-key', 'vault-unlocked', {
          service: 'echoid-vault',
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });
        if (profile?.handle) {
          onComplete();
        } else {
          setStep('handle');
        }
      } else {
        Alert.alert('Error', `Failed to setup biometric: ${error.message || 'Unknown error'}`);
        console.error(error);
      }
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
          <Text style={styles.stepTitle}>Step 2: Setup Wallet</Text>
          <Text style={styles.stepDescription}>
            Connect an existing wallet or create a new one to mint consent NFTs and sign
            transactions.
          </Text>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled, {marginBottom: spacing.md}]}
            onPress={handleConnectWallet}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Connect Existing Wallet</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton, loading && styles.buttonDisabled]}
            onPress={handleCreateWallet}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color={colors.textSecondary} />
            ) : (
              <Text style={styles.secondaryButtonText}>Create New Wallet</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {step === 'showMnemonic' && (
        <ScrollView style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Step 2: Save Your Recovery Phrase</Text>
          <Text style={styles.stepDescription}>
            Write down these 12 words in order. Keep them safe and never share them. You'll need
            this to recover your wallet.
          </Text>
          <View style={styles.mnemonicContainer}>
            {mnemonic.split(' ').map((word, index) => (
              <View key={index} style={styles.mnemonicWord}>
                <Text style={styles.mnemonicIndex}>{index + 1}</Text>
                <Text style={styles.mnemonicText}>{word}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.warningText}>
            ⚠️ Store this phrase securely. Anyone with access can control your wallet.
          </Text>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleMnemonicConfirmed}
            disabled={loading}>
            <Text style={styles.buttonText}>I've Saved It</Text>
          </TouchableOpacity>
        </ScrollView>
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
  mnemonicContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
  },
  mnemonicWord: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
  },
  mnemonicIndex: {
    ...typography.small,
    color: colors.textSecondary,
    marginRight: spacing.xs,
    minWidth: 20,
  },
  mnemonicText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  warningText: {
    ...typography.caption,
    color: colors.warning,
    textAlign: 'center',
    marginBottom: spacing.md,
    padding: spacing.sm,
    backgroundColor: `${colors.warning}15`,
    borderRadius: borderRadius.sm,
  },
});
