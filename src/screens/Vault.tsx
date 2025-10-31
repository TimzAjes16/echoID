import React, {useEffect, useState} from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator} from 'react-native';
import * as Keychain from 'react-native-keychain';
import {useConsentStore} from '../state/useConsentStore';
import {BadgeCard} from '../components/BadgeCard';
import {FlashList} from '@shopify/flash-list';
import {colors, spacing, typography, borderRadius, shadows} from '../lib/design';

// Note: FlashList requires @shopify/flash-list, but for MVP we can use FlatList
// Keeping FlashList import for future optimization

export const Vault: React.FC<{
  onConsentPress: (consentId: string) => void;
  onCreateNew: () => void;
  onProfilePress: () => void;
}> = ({onConsentPress, onCreateNew, onProfilePress}) => {
  const {consents, getUnlockEligibleConsents} = useConsentStore();
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkVaultAccess();
  }, []);

  const checkVaultAccess = async () => {
    try {
      // Try to unlock with biometric
      await unlockVault();
    } catch (error: any) {
      console.error('Vault access error:', error);
      // If vault doesn't exist yet, initialize it
      if (error.message?.includes('not found') || error.code === 'NotFound') {
        await initializeVault();
        setUnlocked(true);
      } else if (error.message?.includes('UserCancel') || error.message?.includes('UserFallback')) {
        // User cancelled or failed authentication - keep locked
        Alert.alert('Authentication Required', 'FaceID is required to unlock the vault. Please try again.');
      } else {
        // Other errors - for MVP, allow access
        console.warn('Vault unlock error, allowing access:', error);
        setUnlocked(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const initializeVault = async () => {
    try {
      // Store vault unlock key with biometric protection
      await Keychain.setGenericPassword('vault-key', 'vault-unlocked', {
        service: 'echoid-vault',
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } catch (error: any) {
      console.error('Failed to initialize vault with biometric:', error);
      // If biometric is not available, store without access control
      try {
        await Keychain.setGenericPassword('vault-key', 'vault-unlocked', {
          service: 'echoid-vault',
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });
      } catch (fallbackError) {
        console.error('Failed to initialize vault:', fallbackError);
      }
    }
  };

  const unlockVault = async () => {
    try {
      // Attempt to retrieve with biometric prompt
      const credentials = await Keychain.getGenericPassword({
        service: 'echoid-vault',
        authenticationPrompt: {
          title: 'Unlock Vault',
          subtitle: 'Use FaceID to access your consent vault',
          description: 'Authenticate to view your consents',
        },
      });

      if (credentials) {
        setUnlocked(true);
      } else {
        // No credentials found, initialize vault
        await initializeVault();
        setUnlocked(true);
      }
    } catch (error: any) {
      // Re-throw to be handled by checkVaultAccess
      throw error;
    }
  };

  const renderConsent = ({item}: {item: typeof consents[0]}) => {
    return <BadgeCard consent={item} onPress={() => onConsentPress(item.id)} />;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!unlocked) {
    return (
      <View style={styles.container}>
        <View style={styles.lockContainer}>
          <Text style={styles.lockTitle}>Vault Locked</Text>
          <Text style={styles.lockSubtitle}>Use FaceID to unlock your consent vault</Text>
          <TouchableOpacity 
            style={[styles.unlockButton, loading && styles.buttonDisabled]} 
            onPress={unlockVault}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.unlockButtonText}>Unlock with FaceID</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const sortedConsents = [...consents].sort((a, b) => b.createdAt - a.createdAt);
  const eligibleConsents = getUnlockEligibleConsents();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Consents</Text>
        <View style={styles.headerRight}>
          {eligibleConsents.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{eligibleConsents.length} eligible</Text>
            </View>
          )}
          <TouchableOpacity onPress={onProfilePress} style={styles.profileButton}>
            <Text style={styles.profileButtonText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {sortedConsents.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No consents yet</Text>
          <Text style={styles.emptySubtext}>Create your first consent to get started</Text>
        </View>
      ) : (
        <FlashList
          data={sortedConsents}
          renderItem={renderConsent}
          keyExtractor={(item) => item.id}
          estimatedItemSize={120}
          contentContainerStyle={styles.list}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={onCreateNew}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    paddingTop: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  badge: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    ...typography.smallBold,
    color: colors.surface,
  },
  profileButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  profileButtonText: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  list: {
    paddingVertical: spacing.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyText: {
    ...typography.h3,
    marginBottom: spacing.sm,
    color: colors.textSecondary,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  lockTitle: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.sm,
    color: colors.text,
  },
  lockSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  unlockButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    alignSelf: 'center',
    ...shadows.md,
  },
  unlockButtonText: {
    ...typography.bodyBold,
    color: colors.surface,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  fabText: {
    color: colors.surface,
    fontSize: 32,
    fontWeight: '300',
    lineHeight: 32,
  },
  lockContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
