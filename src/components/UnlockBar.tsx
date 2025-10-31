import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import {useConsentStore} from '../state/useConsentStore';
import {requestUnlock, approveUnlock} from '../sdk';
import {sendTransaction} from '../lib/walletconnect';

interface UnlockBarProps {
  consentId: string;
}

export const UnlockBar: React.FC<UnlockBarProps> = ({consentId}) => {
  const {getConsent, updateConsent, wallet} = useConsentStore();
  const consentData = getConsent(consentId);

  if (!consentData) {
    return null;
  }

  const isEligible = consentData.lockedUntil <= Date.now();
  const isRequester =
    consentData.unlockRequestFrom?.toLowerCase() === wallet.address?.toLowerCase();
  const hasApproved =
    consentData.unlockApprovedBy?.some(
      (addr) => addr.toLowerCase() === wallet.address?.toLowerCase(),
    ) || false;
  const isOtherParty = consentData.participantB.toLowerCase() === wallet.address?.toLowerCase() ||
    consentData.participantA.toLowerCase() === wallet.address?.toLowerCase();

  const handleRequestUnlock = async () => {
    if (!isEligible) {
      Alert.alert('Not Eligible', '24-hour lock period has not expired');
      return;
    }

    try {
      await requestUnlock(BigInt(consentData.consentId.toString()));
      updateConsent(consentId, {
        status: 'pending-unlock',
        unlockRequestFrom: wallet.address || undefined,
      });
      Alert.alert('Success', 'Unlock request sent');
    } catch (error) {
      Alert.alert('Error', 'Failed to request unlock');
      console.error(error);
    }
  };

  const handleApproveUnlock = async () => {
    try {
      await approveUnlock(BigInt(consentData.consentId.toString()));
      const updatedApprovers = [...(consentData.unlockApprovedBy || []), wallet.address || ''];
      updateConsent(consentId, {
        status: 'unlocked',
        unlockApprovedBy: updatedApprovers,
      });
      Alert.alert('Success', 'Unlock approved');
    } catch (error) {
      Alert.alert('Error', 'Failed to approve unlock');
      console.error(error);
    }
  };

  if (consentData.status === 'unlocked') {
    return (
      <View style={styles.container}>
        <Text style={styles.unlockedText}>✓ Unlocked</Text>
      </View>
    );
  }

  if (consentData.status === 'pending-unlock') {
    if (hasApproved) {
      return (
        <View style={styles.container}>
          <Text style={styles.pendingText}>Waiting for counterparty approval...</Text>
        </View>
      );
    }

    if (isRequester) {
      return (
        <View style={styles.container}>
          <Text style={styles.pendingText}>Your unlock request is pending approval</Text>
        </View>
      );
    }

    if (isOtherParty) {
      return (
        <View style={styles.container}>
          <TouchableOpacity style={styles.approveButton} onPress={handleApproveUnlock}>
            <Text style={styles.buttonText}>Approve Unlock</Text>
          </TouchableOpacity>
        </View>
      );
    }
  }

  if (!isEligible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.requestButton} onPress={handleRequestUnlock}>
        <Text style={styles.buttonText}>Request Unlock</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  requestButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#34C759',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  unlockedText: {
    fontSize: 16,
    color: '#34C759',
    fontWeight: '600',
    textAlign: 'center',
  },
  pendingText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
