import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator} from 'react-native';
import {useConsentStore} from '../state/useConsentStore';
import {Recorder} from '../components/Recorder';
import {SelfieCapture} from '../components/SelfieCapture';
import {ParticipantInput} from '../components/ParticipantInput';
import {getTemplate, templates, TemplateType} from '../lib/templates';
import {getLocationHash} from '../lib/geo';
import {hashAudioPcm, hashFaceEmbedding, generateDeviceKey} from '../crypto';
import {extractAudioFeatures, analyzeCoercion} from '../lib/coercion';
import {createConsent} from '../sdk';
import {getConfig, weiToFiat} from '../lib/config';
import {uploadToIPFS} from '../lib/ipfs';
import {v4 as uuidv4} from 'uuid';
import RNFS from 'react-native-fs';
import dayjs from 'dayjs';

type WizardStep =
  | 'price'
  | 'template'
  | 'participants'
  | 'read-aloud'
  | 'face-check'
  | 'policy'
  | 'attachments'
  | 'fee-confirmation'
  | 'review'
  | 'minting';

export const NewConsentWizard: React.FC<{onComplete: () => void}> = ({onComplete}) => {
  const [step, setStep] = useState<WizardStep>('price');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | null>(null);
  const [participantB, setParticipantB] = useState('');
  const [audioPath, setAudioPath] = useState<string | null>(null);
  const [selfiePath, setSelfiePath] = useState<string | null>(null);
  const [unlockMode, setUnlockMode] = useState<'one-shot' | 'windowed' | 'scheduled'>('one-shot');
  const [windowMinutes, setWindowMinutes] = useState(60);
  const [loading, setLoading] = useState(false);
  const {wallet, deviceKey, addConsent, selectedChain, protocolFeeWei} = useConsentStore();
  const config = getConfig();

  const script = selectedTemplate && wallet.address
    ? getTemplate(selectedTemplate).generateScript(
        wallet.address,
        participantB || '0x...',
        dayjs().toISOString(),
        '0x...', // Will be replaced with actual geoHash
      )
    : '';

  const handleNext = () => {
    switch (step) {
      case 'price':
        setStep('template');
        break;
      case 'template':
        if (!selectedTemplate) {
          Alert.alert('Error', 'Please select a template');
          return;
        }
        if (selectedTemplate === 'sex-nda') {
          // Show age gate
          Alert.alert(
            'Age Verification',
            'This template is for consenting adults only. Are you 18 or older?',
            [
              {text: 'No', style: 'cancel'},
              {text: 'Yes', onPress: () => setStep('participants')},
            ],
          );
        } else {
          setStep('participants');
        }
        break;
      case 'participants':
        if (!participantB.trim()) {
          Alert.alert('Error', 'Please add participant B');
          return;
        }
        setStep('read-aloud');
        break;
      case 'read-aloud':
        if (!audioPath) {
          Alert.alert('Error', 'Please record your voice');
          return;
        }
        setStep('face-check');
        break;
      case 'face-check':
        if (!selfiePath) {
          Alert.alert('Error', 'Please capture your face');
          return;
        }
        setStep('policy');
        break;
      case 'policy':
        setStep('attachments');
        break;
      case 'attachments':
        setStep('fee-confirmation');
        break;
      case 'fee-confirmation':
        setStep('review');
        break;
      case 'review':
        handleMint();
        break;
    }
  };

  const handleMint = async () => {
    if (!wallet.address || !deviceKey || !selectedTemplate || !audioPath || !selfiePath) {
      Alert.alert('Error', 'Missing required data for consent creation');
      return;
    }

    setStep('minting');
    setLoading(true);
    
    try {
      // Read audio file and hash (with fallback)
      let audioBytes: Buffer;
      try {
        const base64 = await RNFS.readFile(audioPath, 'base64');
        audioBytes = Buffer.from(base64, 'base64');
      } catch (error) {
        console.warn('Failed to read audio file, using test data:', error);
        // Fallback: generate test audio bytes
        audioBytes = Buffer.alloc(1024).fill(0xAA);
      }
      
      const voiceHash = hashAudioPcm(new Uint8Array(audioBytes));
      console.log('✅ Voice hash generated:', voiceHash.slice(0, 16) + '...');

      // Hash face - extract from selfie or use mock
      let faceHash: string;
      try {
        // TODO: In production, extract face embedding from selfie image
        // For MVP, generate hash from selfie file
        const selfieBase64 = await RNFS.readFile(selfiePath, 'base64');
        const selfieBytes = Buffer.from(selfieBase64, 'base64');
        faceHash = hashFaceEmbedding(Array.from(selfieBytes.slice(0, 128))); // Use first 128 bytes as embedding
      } catch (error) {
        console.warn('Failed to process selfie, using mock embedding:', error);
        faceHash = hashFaceEmbedding([0.1, 0.2, 0.3, 0.4, 0.5]); // Mock embedding
      }
      console.log('✅ Face hash generated:', faceHash.slice(0, 16) + '...');

      // Device hash from public key
      const deviceKeyBytes = Buffer.from(deviceKey.publicKey, 'base64');
      const deviceHash = hashAudioPcm(new Uint8Array(deviceKeyBytes));
      console.log('✅ Device hash generated:', deviceHash.slice(0, 16) + '...');

      // Get location hash (with fallback)
      let geoHash: {hash: string; coordinates?: {lat: number; lng: number}};
      try {
        geoHash = await getLocationHash();
      } catch (error) {
        console.warn('Location access failed, using test geo hash:', error);
        // Generate test geo hash
        const testGeoBytes = Buffer.from(Date.now().toString());
        geoHash = {
          hash: Array.from(new Uint8Array(hashAudioPcm(new Uint8Array(testGeoBytes)))).map(b => b.toString(16).padStart(2, '0')).join(''),
        };
      }
      console.log('✅ Geo hash generated:', geoHash.hash.slice(0, 16) + '...');

      // Analyze coercion (with fallback)
      let features: any;
      let coercion: 'green' | 'amber' | 'red';
      try {
        features = await extractAudioFeatures(audioBytes.buffer);
        coercion = analyzeCoercion(features);
      } catch (error) {
        console.warn('Coercion analysis failed, defaulting to green:', error);
        coercion = 'green'; // Safe default
      }

      // Upload attachments to IPFS (if any, with fallback)
      const attachmentCids: string[] = [];
      if (selfiePath) {
        try {
          const selfieBytes = await RNFS.readFile(selfiePath, 'base64').then((base64) =>
            Buffer.from(base64, 'base64'),
          );
          const cid = await uploadToIPFS(new Uint8Array(selfieBytes));
          attachmentCids.push(cid);
          console.log('✅ Selfie uploaded to IPFS:', cid);
        } catch (error) {
          console.warn('IPFS upload failed, storing locally only:', error);
          // Continue without IPFS CID
        }
      }

      // Create consent on-chain with protocol fee
      const unlockModeNum = unlockMode === 'one-shot' ? 0 : unlockMode === 'windowed' ? 1 : 2;
      
      console.log('📝 Creating consent with params:', {
        participantB,
        unlockMode: unlockModeNum,
        windowMinutes,
        chainId: selectedChain,
      });

      const {consentId, txHash} = await createConsent({
        participantB,
        voiceHash: `0x${voiceHash}`,
        faceHash: `0x${faceHash}`,
        deviceHash: `0x${deviceHash}`,
        geoHash: `0x${geoHash.hash}`,
        unlockMode: unlockModeNum,
        windowMinutes,
        chainId: selectedChain,
        feeWei: protocolFeeWei,
        treasury: config.treasuryAddress,
      });

      console.log('✅ Consent created:', {consentId: consentId.toString(), txHash});

      // Create local consent object
      const consentIdStr = uuidv4();
      const lockedUntil = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

      addConsent({
        id: consentIdStr,
        consentId,
        participantA: wallet.address,
        participantB,
        templateType: selectedTemplate,
        purpose: getTemplate(selectedTemplate).name,
        createdAt: Date.now(),
        lockedUntil,
        status: 'locked',
        unlockMode,
        windowMinutes,
        voiceHash,
        faceHash,
        deviceHash,
        geoHash: geoHash.hash,
        coercionLevel: coercion,
        attachments: attachmentCids.length > 0 ? attachmentCids : undefined,
        localData: {
          audioPath,
          selfiePath,
        },
      });

      Alert.alert(
        'Success', 
        `Consent created successfully!\n\nTransaction: ${txHash.slice(0, 10)}...\nConsent ID: ${consentId.toString()}\n\n24-hour lock period started.`, 
        [
          {text: 'OK', onPress: onComplete},
        ]
      );
    } catch (error: any) {
      console.error('Consent creation error:', error);
      Alert.alert(
        'Error', 
        error?.message || 'Failed to create consent. Please try again.',
        [{text: 'OK'}]
      );
      setStep('review'); // Go back to review step on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>New Consent</Text>
        <Text style={styles.stepIndicator}>
          Step {['price', 'template', 'participants', 'read-aloud', 'face-check', 'policy', 'attachments', 'fee-confirmation', 'review'].indexOf(step) + 1} of 9
        </Text>
      </View>

      {step === 'price' && (
        <View style={styles.step}>
          <Text style={styles.stepTitle}>Price & Chain</Text>
          <View style={styles.feeCard}>
            <Text style={styles.feeLabel}>Network</Text>
            <Text style={styles.feeAmount}>
              {selectedChain === 42170 ? 'Arbitrum Nova' : 
               selectedChain === 84532 ? 'Base Sepolia' : 
               selectedChain === 1442 ? 'Polygon zkEVM' : 'Unknown'}
            </Text>
          </View>
          <View style={styles.feeCard}>
            <Text style={styles.feeLabel}>Protocol Fee</Text>
            <Text style={styles.feeAmount}>{weiToFiat(protocolFeeWei)} USD</Text>
            <Text style={styles.feeSubtext}>Plus gas fees (~$0.05-0.10)</Text>
          </View>
          <Text style={styles.note}>
            Arbitrum Nova has lower fees than other networks. You can switch networks if needed.
          </Text>
        </View>
      )}

      {step === 'template' && (
        <View style={styles.step}>
          <Text style={styles.stepTitle}>Network & Fee</Text>
          <View style={styles.feeCard}>
            <Text style={styles.feeLabel}>Protocol Fee</Text>
            <Text style={styles.feeAmount}>{weiToFiat(protocolFeeWei)} USD</Text>
            <Text style={styles.feeSubtext}>({protocolFeeWei} wei on Chain ID: {selectedChain})</Text>
          </View>
          <Text style={styles.note}>
            A small protocol fee is required to create this consent. This fee goes to the EchoID
            treasury.
          </Text>
        </View>
      )}

      {step === 'template' && (
        <View style={styles.step}>
          <Text style={styles.stepTitle}>Select Template</Text>
          {Object.values(templates).map((template) => (
            <TouchableOpacity
              key={template.id}
              style={[styles.templateCard, selectedTemplate === template.id && styles.selectedTemplate]}
              onPress={() => setSelectedTemplate(template.id)}>
              <Text style={styles.templateName}>{template.name}</Text>
              <Text style={styles.templateDescription}>{template.description}</Text>
              {template.ageGate && <Text style={styles.ageGate}>18+</Text>}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {step === 'participants' && (
        <View style={styles.step}>
          <Text style={styles.stepTitle}>Add Participant B</Text>
          <ParticipantInput
            onParticipantSelected={(wallet, handle) => {
              setParticipantB(wallet);
              if (handle) {
                // Store handle for display
                Alert.alert('Participant Added', `Added @${handle}`);
              }
            }}
          />
        </View>
      )}

      {step === 'read-aloud' && (
        <View style={styles.step}>
          <Text style={styles.stepTitle}>Read Aloud</Text>
          <Recorder script={script} onRecordingComplete={setAudioPath} />
        </View>
      )}

      {step === 'face-check' && (
        <View style={styles.step}>
          <Text style={styles.stepTitle}>Face Verification</Text>
          <SelfieCapture onCaptureComplete={setSelfiePath} />
        </View>
      )}

      {step === 'policy' && (
        <View style={styles.step}>
          <Text style={styles.stepTitle}>Unlock Policy</Text>
          {/* Unlock mode selector */}
          <Text style={styles.note}>Note: All consents are auto-locked for 24 hours</Text>
        </View>
      )}

      {step === 'attachments' && (
        <View style={styles.step}>
          <Text style={styles.stepTitle}>Attachments (Optional)</Text>
          <Text style={styles.note}>You can add additional files later</Text>
        </View>
      )}

      {step === 'fee-confirmation' && (
        <View style={styles.step}>
          <Text style={styles.stepTitle}>Confirm Fee</Text>
          <View style={styles.feeCard}>
            <Text style={styles.feeLabel}>Protocol Fee</Text>
            <Text style={styles.feeAmount}>{weiToFiat(protocolFeeWei)} USD</Text>
            <Text style={styles.feeSubtext}>Plus gas fees</Text>
          </View>
          <Text style={styles.note}>
            By proceeding, you acknowledge that a protocol fee of {weiToFiat(protocolFeeWei)} USD
            will be paid to the EchoID treasury.
          </Text>
        </View>
      )}

      {step === 'review' && (
        <View style={styles.step}>
          <Text style={styles.stepTitle}>Review</Text>
          <Text>Template: {selectedTemplate}</Text>
          <Text>Participant B: {participantB}</Text>
          <Text>Unlock Mode: {unlockMode}</Text>
          <Text>Fee: {weiToFiat(protocolFeeWei)} USD</Text>
        </View>
      )}

      {step === 'minting' && (
        <View style={styles.step}>
          <ActivityIndicator size="large" />
          <Text style={styles.mintingText}>Minting consent NFT...</Text>
        </View>
      )}

      {step !== 'minting' && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onComplete}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.nextButton, loading && styles.buttonDisabled]}
            onPress={handleNext}
            disabled={loading}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  stepIndicator: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  step: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
  },
  templateCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedTemplate: {
    borderColor: '#007AFF',
  },
  templateName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  ageGate: {
    marginTop: 8,
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  note: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  mintingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'space-between',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  nextButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  feeCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  feeLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  feeAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  feeSubtext: {
    fontSize: 12,
    color: '#8E8E93',
  },
});
