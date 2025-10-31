import SignClient from '@walletconnect/sign-client';
import {SignClientTypes} from '@walletconnect/types';

const PROJECT_ID = 'YOUR_WALLETCONNECT_PROJECT_ID'; // Replace with your project ID

let signClient: SignClient | null = null;

/**
 * Initialize WalletConnect Sign Client
 */
export async function initWalletConnect(): Promise<SignClient> {
  if (signClient) {
    return signClient;
  }

  signClient = await SignClient.init({
    projectId: PROJECT_ID,
    metadata: {
      name: 'EchoID',
      description: 'Consent management with cryptographic verification',
      url: 'https://echoid.app',
      icons: ['https://echoid.app/icon.png'],
    },
  });

  return signClient;
}

/**
 * Connect to external wallet (supports multiple chains)
 */
export async function connectWallet(supportedChainIds: number[] = [84532]): Promise<{
  accounts: string[];
  chainId: string;
}> {
  const client = await initWalletConnect();

  const chainList = supportedChainIds.map((id) => `eip155:${id}`);

  const {uri, approval} = await client.connect({
    requiredNamespaces: {
      eip155: {
        methods: ['eth_sendTransaction', 'eth_signTypedData_v4', 'eth_chainId'],
        chains: chainList,
        events: ['chainChanged', 'accountsChanged'],
      },
    },
  });

  // Display URI as QR code or deep link
  // For mobile, use deep link: wc:${uri}
  // Approval will resolve when wallet approves

  const session = await approval();

  const accounts = session.namespaces.eip155?.accounts?.map(
    acc => acc.split(':')[2],
  ) || [];

  const chainId = session.namespaces.eip155?.chains?.[0]?.split(':')[1] || '84532';

  return {
    accounts,
    chainId,
  };
}

/**
 * Send transaction via WalletConnect (supports value for payable functions)
 */
export async function sendTransaction(
  transaction: {
    to: string;
    value?: string;
    data?: string;
    gas?: string;
    chainId?: string;
  },
): Promise<string> {
  const client = await initWalletConnect();
  if (!client.session) {
    throw new Error('Wallet not connected');
  }

  const accounts = client.session.namespaces.eip155?.accounts?.map(
    acc => acc.split(':')[2],
  ) || [];

  if (accounts.length === 0) {
    throw new Error('No accounts available');
  }

  // Use provided chainId or default to first chain in session
  const chainId = transaction.chainId
    ? `eip155:${transaction.chainId}`
    : client.session.namespaces.eip155?.chains?.[0] || 'eip155:84532';

  const txHash = await client.request({
    topic: client.session.topic,
    chainId,
    request: {
      method: 'eth_sendTransaction',
      params: [
        {
          from: accounts[0],
          to: transaction.to,
          value: transaction.value ? `0x${BigInt(transaction.value).toString(16)}` : '0x0',
          data: transaction.data || '0x',
          gas: transaction.gas || '0x5208',
        },
      ],
    },
  });

  return txHash as string;
}

/**
 * Sign typed data via WalletConnect
 */
export async function signTypedData(
  domain: any,
  types: any,
  message: any,
): Promise<string> {
  const client = await initWalletConnect();
  if (!client.session) {
    throw new Error('Wallet not connected');
  }

  const accounts = client.session.namespaces.eip155?.accounts?.map(
    acc => acc.split(':')[2],
  ) || [];

  if (accounts.length === 0) {
    throw new Error('No accounts available');
  }

  const signature = await client.request({
    topic: client.session.topic,
    chainId: 'eip155:84532',
    request: {
      method: 'eth_signTypedData_v4',
      params: [accounts[0], JSON.stringify({domain, types, primaryType: 'Consent', message})],
    },
  });

  return signature as string;
}

/**
 * Disconnect wallet
 */
export async function disconnectWallet(): Promise<void> {
  const client = await initWalletConnect();
  if (client.session) {
    await client.disconnect({
      topic: client.session.topic,
      reason: {
        code: 6000,
        message: 'User disconnected',
      },
    });
  }
}
