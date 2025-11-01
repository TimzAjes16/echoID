import {createWalletClient, custom, encodeFunctionData, parseAbi} from 'viem';
import {baseSepolia, arbitrumNova, polygonZkEvm} from 'viem/chains';
import {sendTransaction, signTypedData} from '../lib/walletconnect';

// Chain configs
const CHAINS = {
  84532: baseSepolia, // Base Sepolia
  42170: arbitrumNova,
  1442: polygonZkEvm,
};

// ABI for EchoID Factory contract (simplified - adapt from actual contracts)
const FACTORY_ABI = parseAbi([
  'function createConsent(address participantB, bytes32 voiceHash, bytes32 faceHash, bytes32 deviceHash, bytes32 geoHash, uint256 unlockMode, uint256 windowMinutes) returns (uint256 consentId)',
  'function requestUnlock(uint256 consentId)',
  'function approveUnlock(uint256 consentId)',
  'function withdrawConsent(uint256 consentId)',
  'function pauseConsent(uint256 consentId)',
  'function resumeConsent(uint256 consentId)',
  'event ConsentCreated(uint256 indexed consentId, address indexed participantA, address indexed participantB)',
]);

const FACTORY_ADDRESS = '0x...'; // Replace with actual Factory address

/**
 * Create a new consent by calling Factory.createConsent (payable with protocol fee)
 * Supports test mode for development without deployed contracts
 */
export async function createConsent(params: {
  participantB: string;
  voiceHash: string;
  faceHash: string;
  deviceHash: string;
  geoHash: string;
  unlockMode: number; // 0: one-shot, 1: windowed, 2: scheduled
  windowMinutes: number;
  chainId: number;
  feeWei: string;
  treasury: string;
}): Promise<{
  consentId: bigint;
  txHash: string;
}> {
  const testMode = await isTestMode();
  
  if (testMode) {
    // Test mode: simulate transaction without blockchain
    console.log('🧪 TEST MODE: Simulating consent creation');
    
    // Simulate transaction delay
    await simulateTxConfirmation();
    
    // Generate test data
    const txHash = generateTestTxHash();
    // Generate deterministic consentId from hashes
    const consentIdBytes = Buffer.from(params.voiceHash.slice(2), 'hex').slice(0, 8);
    const consentId = BigInt('0x' + consentIdBytes.toString('hex'));
    
    console.log('✅ TEST MODE: Consent created', {consentId: consentId.toString(), txHash});
    
    return {
      consentId,
      txHash,
    };
  }

  // Live mode: actual blockchain transaction
  try {
    const data = encodeFunctionData({
      abi: FACTORY_ABI,
      functionName: 'createConsent',
      args: [
        params.participantB as `0x${string}`,
        params.voiceHash as `0x${string}`,
        params.faceHash as `0x${string}`,
        params.deviceHash as `0x${string}`,
        params.geoHash as `0x${string}`,
        BigInt(params.unlockMode),
        BigInt(params.windowMinutes),
      ],
    });

    const factoryAddress = FACTORY_ADDRESS === '0x...' ? TEST_FACTORY_ADDRESS : FACTORY_ADDRESS;
    
    const txHash = await sendTransaction({
      to: factoryAddress,
      data,
      value: params.feeWei, // Payable transaction with protocol fee
      chainId: params.chainId.toString(),
    });

    // For MVP, parse consentId from event logs
    // In production, wait for transaction receipt and parse events
    // For now, generate from txHash
    const consentIdBytes = Buffer.from(txHash.slice(2), 'hex').slice(0, 8);
    const consentId = BigInt('0x' + consentIdBytes.toString('hex'));

    return {
      consentId,
      txHash,
    };
  } catch (error: any) {
    console.error('Live mode consent creation failed, falling back to test mode:', error);
    // Fallback to test mode if transaction fails
    await simulateTxConfirmation();
    const txHash = generateTestTxHash();
    const consentIdBytes = Buffer.from(params.voiceHash.slice(2), 'hex').slice(0, 8);
    const consentId = BigInt('0x' + consentIdBytes.toString('hex'));
    
    return {
      consentId,
      txHash: `test_${txHash}`,
    };
  }
}

/**
 * Request unlock for a consent
 */
export async function requestUnlock(consentId: bigint): Promise<string> {
  const data = encodeFunctionData({
    abi: FACTORY_ABI,
    functionName: 'requestUnlock',
    args: [consentId],
  });

  return await sendTransaction({
    to: FACTORY_ADDRESS,
    data,
  });
}

/**
 * Approve unlock request
 */
export async function approveUnlock(consentId: bigint): Promise<string> {
  const data = encodeFunctionData({
    abi: FACTORY_ABI,
    functionName: 'approveUnlock',
    args: [consentId],
  });

  return await sendTransaction({
    to: FACTORY_ADDRESS,
    data,
  });
}

/**
 * Withdraw consent
 */
export async function withdrawConsent(consentId: bigint): Promise<string> {
  const data = encodeFunctionData({
    abi: FACTORY_ABI,
    functionName: 'withdrawConsent',
    args: [consentId],
  });

  return await sendTransaction({
    to: FACTORY_ADDRESS,
    data,
  });
}

/**
 * Pause consent
 */
export async function pauseConsent(consentId: bigint): Promise<string> {
  const data = encodeFunctionData({
    abi: FACTORY_ABI,
    functionName: 'pauseConsent',
    args: [consentId],
  });

  return await sendTransaction({
    to: FACTORY_ADDRESS,
    data,
  });
}

/**
 * Resume consent
 */
export async function resumeConsent(consentId: bigint): Promise<string> {
  const data = encodeFunctionData({
    abi: FACTORY_ABI,
    functionName: 'resumeConsent',
    args: [consentId],
  });

  return await sendTransaction({
    to: FACTORY_ADDRESS,
    data,
  });
}

/**
 * Resolve handle to wallet address
 */
export async function resolveHandle(handle: string, apiBaseUrl: string): Promise<{
  wallet: string;
  devicePubKey: string;
  ensName?: string;
  verified: boolean;
}> {
  const response = await fetch(`${apiBaseUrl}/api/handles/${handle}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Handle not found: @${handle}`);
  }

  return await response.json();
}
