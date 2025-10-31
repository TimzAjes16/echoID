import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
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
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.purpose}>{consent.purpose}</Text>
        <View style={[styles.statusBadge, {backgroundColor: getStatusColor(consent.status)}]}>
          <Text style={styles.statusText}>{consent.status.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.date}>{dayjs(consent.createdAt).format('MMM D, YYYY')}</Text>
      {consent.status === 'locked' && remainingLock > 0 && (
        <Text style={styles.lockTime}>
          Locked for {hoursRemaining}h {minutesRemaining}m
        </Text>
      )}
      <View style={styles.footer}>
        <View style={[styles.riskDot, {backgroundColor: getCoercionColor(consent.coercionLevel)}]} />
        <Text style={styles.riskLabel}>Risk: {consent.coercionLevel}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginVertical: spacing.sm,
    marginHorizontal: spacing.md,
    ...shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  purpose: {
    ...typography.h3,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  statusBadge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    ...typography.smallBold,
    color: colors.surface,
    letterSpacing: 0.5,
  },
  date: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  lockTime: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  riskLabel: {
    ...typography.small,
    color: colors.textSecondary,
  },
});
