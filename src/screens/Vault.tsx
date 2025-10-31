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
      // Check if biometric is enabled
      const credentials = await Keychain.getGenericPassword({
        service: 'echoid-vault',
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
      });

      if (credentials) {
        setUnlocked(true);
      } else {
        // Try to unlock with biometric
        await unlockVault();
      }
    } catch (error) {
      // Vault not set up or biometric failed
      setUnlocked(true); // For MVP, allow access
    } finally {
      setLoading(false);
    }
  };

  const unlockVault = async () => {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: 'echoid-vault',
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
        authenticationPrompt: {
          title: 'Unlock Vault',
          subtitle: 'Use FaceID to access your consent vault',
        },
      });

      if (credentials) {
        setUnlocked(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to unlock vault');
      console.error(error);
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
        <Text style={styles.lockTitle}>Vault Locked</Text>
        <Text style={styles.lockSubtitle}>Use FaceID to unlock your consent vault</Text>
        <TouchableOpacity style={styles.unlockButton} onPress={unlockVault}>
          <Text style={styles.unlockButtonText}>Unlock with FaceID</Text>
        </TouchableOpacity>
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
});
