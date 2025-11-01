import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Platform} from 'react-native';
import dayjs from 'dayjs';
import {Consent, CoercionLevel} from '../state/useConsentStore';
import {colors, spacing, typography, borderRadius, shadows} from '../lib/design';

interface BadgeCardProps {
  consent: Consent;
  onPress: () => void;
}

export const BadgeCard: React.FC<BadgeCardProps> = ({consent, onPress}) => {
  const getStatusColor = (status: Consent['status']) => {
    switch (status) {
      case 'locked':
        return '#FF9500';
      case 'unlocked':
        return '#34C759';
      case 'pending-unlock':
        return '#007AFF';
      case 'withdrawn':
        return '#8E8E93';
      case 'paused':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getCoercionColor = (level: CoercionLevel) => {
    switch (level) {
      case 'green':
        return '#34C759';
      case 'amber':
        return '#FF9500';
      case 'red':
        return '#FF3B30';
    }
  };

  const remainingLock = Math.max(0, consent.lockedUntil - Date.now());
  const hoursRemaining = Math.floor(remainingLock / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((remainingLock % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={styles.cardContent}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.purpose} numberOfLines={2}>{consent.purpose}</Text>
            <View style={[styles.statusBadge, {backgroundColor: getStatusColor(consent.status)}]}>
              <Text style={styles.statusText}>{consent.status.replace('-', ' ').toUpperCase()}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.metaContainer}>
          <Text style={styles.date}>{dayjs(consent.createdAt).format('MMM D, YYYY')}</Text>
          {consent.status === 'locked' && remainingLock > 0 && (
            <View style={styles.lockTimeContainer}>
              <Text style={styles.lockIcon}>⏱</Text>
              <Text style={styles.lockTime}>
                {hoursRemaining}h {minutesRemaining}m
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.footer}>
          <View style={styles.riskIndicator}>
            <View style={[styles.riskDot, {backgroundColor: getCoercionColor(consent.coercionLevel)}]} />
            <Text style={styles.riskLabel}>{consent.coercionLevel}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginVertical: spacing.xs,
    marginHorizontal: spacing.md,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        ...shadows.md,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardContent: {
    padding: spacing.md + 4,
  },
  header: {
    marginBottom: spacing.md,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  purpose: {
    ...typography.h3,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    lineHeight: 24,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  statusText: {
    ...typography.smallBold,
    fontSize: 10,
    color: colors.surface,
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  date: {
    ...typography.caption,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  lockTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: `${colors.warning}15`,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  lockIcon: {
    fontSize: 12,
  },
  lockTime: {
    ...typography.caption,
    fontSize: 12,
    color: colors.warning,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  riskIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  riskDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
    }),
  },
  riskLabel: {
    ...typography.small,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
});
