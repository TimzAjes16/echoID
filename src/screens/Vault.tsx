import React, {useEffect, useState} from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
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
  const insets = useSafeAreaInsets();

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
      await SecureStore.setItemAsync('vault-key-echoid-vault', 'vault-unlocked', {
        requireAuthentication: true,
        authenticationPrompt: 'Unlock vault with FaceID',
      });
    } catch (error: any) {
      console.error('Failed to initialize vault with biometric:', error);
      // If biometric is not available, store without access control
      try {
        await SecureStore.setItemAsync('vault-key-echoid-vault', 'vault-unlocked');
      } catch (fallbackError) {
        console.error('Failed to initialize vault:', fallbackError);
      }
    }
  };

  const unlockVault = async () => {
    try {
      // Attempt to retrieve with biometric prompt
      const credentials = await SecureStore.getItemAsync('vault-key-echoid-vault', {
        requireAuthentication: true,
        authenticationPrompt: 'Unlock vault with FaceID',
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
      <SafeAreaView style={[styles.container, {paddingTop: insets.top}]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!unlocked) {
    return (
      <SafeAreaView style={[styles.container, {paddingTop: insets.top}]} edges={['top', 'bottom']}>
        <View style={styles.lockContainer}>
          <View style={styles.lockIconContainer}>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>
          <Text style={styles.lockTitle}>Vault Locked</Text>
          <Text style={styles.lockSubtitle}>Use FaceID to unlock your consent vault</Text>
          <TouchableOpacity 
            style={[styles.unlockButton, loading && styles.buttonDisabled]} 
            onPress={unlockVault}
            disabled={loading}
            activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.unlockButtonText}>Unlock with FaceID</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const sortedConsents = [...consents].sort((a, b) => b.createdAt - a.createdAt);
  const eligibleConsents = getUnlockEligibleConsents();

  return (
    <SafeAreaView style={[styles.container, {paddingTop: insets.top}]} edges={['top']}>
      {/* Modern Header with proper notch spacing */}
      <View style={[styles.header, {paddingTop: Math.max(insets.top, spacing.md)}]}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>My Consents</Text>
          {eligibleConsents.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{eligibleConsents.length}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity 
          onPress={onProfilePress} 
          style={styles.profileButton}
          activeOpacity={0.7}>
          <Text style={styles.profileButtonText}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      <View style={styles.content}>
        {sortedConsents.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
            </View>
            <Text style={styles.emptyText}>No consents yet</Text>
            <Text style={styles.emptySubtext}>Create your first consent to get started</Text>
          </View>
        ) : (
          <FlashList
            data={sortedConsents}
            renderItem={renderConsent}
            keyExtractor={(item) => item.id}
            estimatedItemSize={120}
            contentContainerStyle={[styles.list, {paddingBottom: insets.bottom + spacing.xl}]}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Modern FAB with proper bottom spacing */}
      <TouchableOpacity 
        style={[styles.fab, {bottom: insets.bottom + spacing.md}]} 
        onPress={onCreateNew}
        activeOpacity={0.9}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  title: {
    ...typography.h1,
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: colors.text,
  },
  badge: {
    backgroundColor: colors.primary,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  badgeText: {
    ...typography.smallBold,
    fontSize: 11,
    color: colors.surface,
  },
  profileButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  profileButtonText: {
    ...typography.bodyBold,
    fontSize: 17,
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  list: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyText: {
    ...typography.h3,
    fontSize: 22,
    fontWeight: '600',
    marginBottom: spacing.xs,
    color: colors.text,
    textAlign: 'center',
  },
  emptySubtext: {
    ...typography.body,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  lockContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  lockIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  lockIcon: {
    fontSize: 48,
  },
  lockTitle: {
    ...typography.h2,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
    color: colors.text,
  },
  lockSubtitle: {
    ...typography.body,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
  },
  unlockButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xl + 8,
    borderRadius: borderRadius.lg,
    minWidth: 200,
    alignSelf: 'center',
    ...shadows.md,
  },
  unlockButtonText: {
    ...typography.bodyBold,
    fontSize: 17,
    color: colors.surface,
    fontWeight: '600',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  fabText: {
    color: colors.surface,
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 28,
    marginTop: -2,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
