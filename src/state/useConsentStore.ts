import {create} from 'zustand';
import dayjs from 'dayjs';

export type UnlockMode = 'one-shot' | 'windowed' | 'scheduled';
export type ConsentStatus = 'locked' | 'unlocked' | 'pending-unlock' | 'withdrawn' | 'paused';
export type CoercionLevel = 'green' | 'amber' | 'red';

export interface Consent {
  id: string;
  consentId: bigint;
  participantA: string; // wallet address
  participantB: string; // wallet address
  templateType: string;
  purpose: string;
  createdAt: number;
  lockedUntil: number; // timestamp when 24h lock expires
  status: ConsentStatus;
  unlockMode: UnlockMode;
  windowMinutes: number;
  voiceHash: string;
  faceHash: string;
  deviceHash: string;
  geoHash: string;
  coercionLevel: CoercionLevel;
  unlockRequestFrom?: string; // who requested unlock
  unlockApprovedBy?: string[]; // array of approvers
  attachments?: string[]; // IPFS CIDs
  localData?: {
    audioPath?: string;
    selfiePath?: string;
    chatHistory?: any[];
  };
}

export interface WalletState {
  address: string | null;
  chainId: string | null;
  connected: boolean;
}

export interface Entitlements {
  pro: boolean;
  skins: string[]; // Array of unlocked skin IDs
}

export interface ChainConfig {
  chainId: number;
  name: string;
  nativeCurrency: string;
}

export interface UserProfile {
  username: string; // Added username
  handle?: string; // Optional EchoID handle
  qrPayload: string;
  ensName?: string;
}

interface ConsentStore {
  wallet: WalletState;
  consents: Consent[];
  deviceKey: {publicKey: string; label: string} | null;
  selectedChain: number;
  protocolFeeWei: string;
  entitlements: Entitlements;
  profile: UserProfile | null;
  setWallet: (wallet: Partial<WalletState>) => void;
  addConsent: (consent: Consent) => void;
  updateConsent: (id: string, updates: Partial<Consent>) => void;
  removeConsent: (id: string) => void;
  setDeviceKey: (key: {publicKey: string; label: string}) => void;
  setSelectedChain: (chainId: number) => void;
  setProtocolFee: (feeWei: string) => void;
  setEntitlements: (entitlements: Partial<Entitlements>) => void;
  setProfile: (profile: UserProfile | null) => void;
  getConsent: (id: string) => Consent | undefined;
  getUnlockEligibleConsents: () => Consent[];
}

export const useConsentStore = create<ConsentStore>((set, get) => ({
  wallet: {
    address: null,
    chainId: null,
    connected: false,
  },
  consents: [],
  deviceKey: null,
  selectedChain: 42170, // Arbitrum Nova default (lower fees)
  protocolFeeWei: '10000000000000000', // 0.01 ETH (lower fee)
  entitlements: {
    pro: false,
    skins: [],
  },
  profile: null,

  setWallet: (wallet) =>
    set((state) => ({
      wallet: {...state.wallet, ...wallet},
    })),

  addConsent: (consent) =>
    set((state) => ({
      consents: [...state.consents, consent],
    })),

  updateConsent: (id, updates) =>
    set((state) => ({
      consents: state.consents.map((c) =>
        c.id === id ? {...c, ...updates} : c,
      ),
    })),

  removeConsent: (id) =>
    set((state) => ({
      consents: state.consents.filter((c) => c.id !== id),
    })),

  setDeviceKey: (key) => set({deviceKey: key}),

  setSelectedChain: (chainId) => set({selectedChain: chainId}),

  setProtocolFee: (feeWei) => set({protocolFeeWei: feeWei}),

  setEntitlements: (entitlements) =>
    set((state) => ({
      entitlements: {...state.entitlements, ...entitlements},
    })),

  setProfile: (profile) => set({profile}),

  getConsent: (id) => get().consents.find((c) => c.id === id),

  getUnlockEligibleConsents: () => {
    const now = Date.now();
    return get().consents.filter(
      (c) =>
        c.status === 'locked' &&
        c.lockedUntil <= now &&
        c.unlockRequestFrom &&
        !c.unlockApprovedBy?.includes(c.unlockRequestFrom),
    );
  },
}));
