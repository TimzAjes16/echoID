import React, {useState, useEffect} from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert} from 'react-native';
import {useConsentStore} from '../state/useConsentStore';
import {BadgeCard} from '../components/BadgeCard';
import {UnlockBar} from '../components/UnlockBar';
import {Chat} from '../components/Chat';
import {withdrawConsent, pauseConsent, resumeConsent} from '../sdk';
import dayjs from 'dayjs';

interface ConsentDetailProps {
  consentId: string;
  onBack: () => void;
}

export const ConsentDetail: React.FC<ConsentDetailProps> = ({consentId, onBack}) => {
  const {getConsent, updateConsent, wallet} = useConsentStore();
  const consent = getConsent(consentId);
  const [activeTab, setActiveTab] = useState<'details' | 'chat'>('details');

  if (!consent) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Consent not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOwner = consent.participantA.toLowerCase() === wallet.address?.toLowerCase() ||
    consent.participantB.toLowerCase() === wallet.address?.toLowerCase();

  const handleWithdraw = async () => {
    Alert.alert(
      'Withdraw Consent',
      'Are you sure? This will prevent future unlocks until both parties resume.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            try {
              await withdrawConsent(BigInt(consent.consentId.toString()));
              updateConsent(consentId, {status: 'withdrawn'});
              Alert.alert('Success', 'Consent withdrawn');
            } catch (error) {
              Alert.alert('Error', 'Failed to withdraw consent');
              console.error(error);
            }
          },
        },
      ],
    );
  };

  const handlePause = async () => {
    try {
      if (consent.status === 'paused') {
        await resumeConsent(BigInt(consent.consentId.toString()));
        updateConsent(consentId, {status: consent.status === 'paused' ? 'locked' : 'paused'});
      } else {
        await pauseConsent(BigInt(consent.consentId.toString()));
        updateConsent(consentId, {status: 'paused'});
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update consent status');
      console.error(error);
    }
  };

  const remainingLock = Math.max(0, consent.lockedUntil - Date.now());
  const isLocked = remainingLock > 0 || consent.status === 'locked';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Consent Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        <BadgeCard consent={consent} onPress={() => {}} />

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'details' && styles.activeTab]}
            onPress={() => setActiveTab('details')}>
            <Text style={[styles.tabText, activeTab === 'details' && styles.activeTabText]}>
              Details
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'chat' && styles.activeTab]}
            onPress={() => setActiveTab('chat')}>
            <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>
              Chat
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'details' && (
          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Created</Text>
              <Text style={styles.detailValue}>{dayjs(consent.createdAt).format('MMMM D, YYYY HH:mm')}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Participant A</Text>
              <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="middle">
                {consent.participantA}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Participant B</Text>
              <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="middle">
                {consent.participantB}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Template</Text>
              <Text style={styles.detailValue}>{consent.templateType}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Unlock Mode</Text>
              <Text style={styles.detailValue}>{consent.unlockMode}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Coercion Risk</Text>
              <View style={styles.riskIndicator}>
                <View
                  style={[
                    styles.riskDot,
                    {
                      backgroundColor:
                        consent.coercionLevel === 'green'
                          ? '#34C759'
                          : consent.coercionLevel === 'amber'
                          ? '#FF9500'
                          : '#FF3B30',
                    },
                  ]}
                />
                <Text style={styles.detailValue}>{consent.coercionLevel.toUpperCase()}</Text>
              </View>
            </View>

            {consent.attachments && consent.attachments.length > 0 && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Attachments</Text>
                <Text style={styles.detailValue}>{consent.attachments.length} file(s)</Text>
              </View>
            )}

            {isOwner && (
              <View style={styles.actions}>
                {consent.status !== 'withdrawn' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.pauseButton]}
                    onPress={handlePause}>
                    <Text style={styles.actionButtonText}>
                      {consent.status === 'paused' ? 'Resume' : 'Pause'}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.actionButton, styles.withdrawButton]}
                  onPress={handleWithdraw}>
                  <Text style={styles.actionButtonText}>Withdraw</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {activeTab === 'chat' && <Chat consentId={consentId} />}
      </ScrollView>

      {isLocked && consent.status !== 'withdrawn' && consent.status !== 'paused' && (
        <UnlockBar consentId={consentId} />
      )}
    </View>
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
    flex: 1,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  detailsSection: {
    padding: 16,
    backgroundColor: 'white',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  detailLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#000',
    maxWidth: '60%',
  },
  riskIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  actions: {
    marginTop: 24,
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  pauseButton: {
    backgroundColor: '#FF9500',
  },
  withdrawButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 20,
  },
});
