/**
 * Settings Screen - Toggle test mode and configure live mode settings
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  ScrollView,
  Platform,
  Switch,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {setTestMode, isTestMode} from '../lib/testMode';
import {getConfig} from '../lib/config';
import {colors, spacing, typography, borderRadius, shadows} from '../lib/design';

interface SettingsProps {
  onBack: () => void;
}

export const Settings: React.FC<SettingsProps> = ({onBack}) => {
  const [testModeEnabled, setTestModeEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [factoryAddress, setFactoryAddress] = useState('0x...');
  const [walletConnectProjectId, setWalletConnectProjectId] = useState('YOUR_WALLETCONNECT_PROJECT_ID');
  const insets = useSafeAreaInsets();
  const config = getConfig();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const testMode = await isTestMode();
      setTestModeEnabled(testMode);
      // You could load factory address and project ID from a config file or AsyncStorage
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleToggleTestMode = async (value: boolean) => {
    setLoading(true);
    try {
      await setTestMode(value);
      setTestModeEnabled(value);
      
      if (value) {
        Alert.alert('Test Mode Enabled', 'The app will use simulated transactions.');
      } else {
        Alert.alert(
          'Live Mode Enabled',
          '⚠️ Make sure you have:\n\n' +
          '1. Deployed contracts with correct Factory address\n' +
          '2. WalletConnect Project ID configured\n' +
          '3. Sufficient funds for gas fees\n' +
          '4. Network configured correctly',
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update test mode setting');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, {paddingTop: Math.max(insets.top, spacing.md)}]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, {paddingTop: Math.max(insets.top, spacing.md)}]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, {paddingBottom: insets.bottom + spacing.xl}]}
        showsVerticalScrollIndicator={false}>
        
        {/* Test Mode Toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mode Configuration</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Test Mode</Text>
              <Text style={styles.settingDescription}>
                {testModeEnabled 
                  ? 'Using simulated transactions (no blockchain calls)'
                  : 'Using live blockchain transactions'}
              </Text>
            </View>
            <Switch
              value={testModeEnabled}
              onValueChange={handleToggleTestMode}
              disabled={loading}
              trackColor={{false: colors.border, true: colors.primary}}
              thumbColor={Platform.OS === 'ios' ? '#fff' : colors.surface}
            />
          </View>

          {!testModeEnabled && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ Live Mode Active{'\n\n'}
                • Real transactions will be sent{'\n'}
                • Real fees will be charged{'\n'}
                • Ensure contracts are deployed{'\n'}
                • Verify Factory address is correct
              </Text>
            </View>
          )}
        </View>

        {/* Live Mode Configuration */}
        {!testModeEnabled && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Live Mode Configuration</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Factory Contract Address</Text>
              <TextInput
                style={styles.input}
                value={factoryAddress}
                onChangeText={setFactoryAddress}
                placeholder="0x..."
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.inputHint}>
                Address of deployed EchoID Factory contract
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>WalletConnect Project ID</Text>
              <TextInput
                style={styles.input}
                value={walletConnectProjectId}
                onChangeText={setWalletConnectProjectId}
                placeholder="Your WalletConnect Project ID"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.inputHint}>
                Get from walletconnect.com
              </Text>
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => {
                Alert.alert(
                  'Configuration',
                  'These settings are for reference. Update the values in:\n\n' +
                  '• Factory Address: src/sdk/index.ts\n' +
                  '• WalletConnect ID: src/lib/walletconnect.ts',
                );
              }}>
              <Text style={styles.saveButtonText}>View Configuration Files</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Current Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Configuration</Text>
          
          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Network:</Text>
            <Text style={styles.configValue}>
              {config.defaultChainId === 42170 ? 'Arbitrum Nova' :
               config.defaultChainId === 84532 ? 'Base Sepolia' :
               config.defaultChainId === 1442 ? 'Polygon zkEVM' :
               `Chain ID: ${config.defaultChainId}`}
            </Text>
          </View>

          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Protocol Fee:</Text>
            <Text style={styles.configValue}>
              {(parseFloat(config.protocolFeeWei) / 1e18).toFixed(4)} ETH
            </Text>
          </View>

          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Treasury Address:</Text>
            <Text style={[styles.configValue, styles.addressText]} numberOfLines={1} ellipsizeMode="middle">
              {config.treasuryAddress}
            </Text>
          </View>
        </View>

        {/* Test Checklist */}
        {!testModeEnabled && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pre-Flight Checklist</Text>
            
            <View style={styles.checklist}>
              <Text style={styles.checklistItem}>
                ☐ Factory contract deployed to network
              </Text>
              <Text style={styles.checklistItem}>
                ☐ Factory address updated in src/sdk/index.ts
              </Text>
              <Text style={styles.checklistItem}>
                ☐ WalletConnect Project ID configured
              </Text>
              <Text style={styles.checklistItem}>
                ☐ Wallet has sufficient funds for gas
              </Text>
              <Text style={styles.checklistItem}>
                ☐ Network RPC URL is accessible
              </Text>
              <Text style={styles.checklistItem}>
                ☐ All handshake data can be collected
              </Text>
            </View>
          </View>
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
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
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
  sectionTitle: {
    ...typography.h3,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.lg,
    color: colors.text,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    ...typography.bodyBold,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  settingDescription: {
    ...typography.caption,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  warningBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: `${colors.warning}15`,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  warningText: {
    ...typography.body,
    fontSize: 14,
    color: colors.warning,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.captionBold,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    ...typography.body,
    fontSize: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md + 4,
    backgroundColor: colors.background,
    color: colors.text,
  },
  inputHint: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md + 4,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveButtonText: {
    ...typography.bodyBold,
    fontSize: 16,
    fontWeight: '600',
    color: colors.surface,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  configLabel: {
    ...typography.body,
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  configValue: {
    ...typography.body,
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: spacing.md,
  },
  addressText: {
    fontFamily: Platform.select({ios: 'Menlo', android: 'monospace'}),
    fontSize: 13,
  },
  checklist: {
    gap: spacing.sm,
  },
  checklistItem: {
    ...typography.body,
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    paddingVertical: spacing.xs,
  },
});

