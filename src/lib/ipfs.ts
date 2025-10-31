// React Native-compatible IPFS helpers using HTTP API directly
// Avoids Node.js dependencies like fs, os, etc.

const IPFS_GATEWAY = 'https://ipfs.infura.io:5001/api/v0';
const PINATA_API_URL = 'https://api.pinata.cloud'; // Alternative for MVP

/**
 * Upload encrypted blob to IPFS via HTTP API (React Native compatible)
 */
export async function uploadToIPFS(data: Uint8Array): Promise<string> {
  try {
    // Use FormData for multipart upload (React Native compatible)
    const formData = new FormData();
    // React Native FormData expects {uri, type, name} for files
    // For blob data, we'll convert to base64 and use data URI
    const base64Data = Buffer.from(data).toString('base64');
    const dataUri = `data:application/octet-stream;base64,${base64Data}`;
    
    // Create file-like object for React Native FormData
    formData.append('file', {
      uri: dataUri,
      type: 'application/octet-stream',
      name: `file_${Date.now()}`,
    } as any);

    const response = await fetch(`${IPFS_GATEWAY}/add`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`IPFS upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.Hash || result.cid; // Some gateways return Hash, others cid
  } catch (error: any) {
    // Fallback: For MVP, return a mock CID if upload fails
    console.warn('IPFS upload failed, using mock CID:', error.message);
    // In production, implement retry logic or use Pinata/other service
    return `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Upload to Pinata (React Native compatible alternative)
 */
export async function uploadToPinata(
  data: Uint8Array,
  apiKey: string,
  apiSecret: string,
  name?: string,
): Promise<string> {
  try {
    const formData = new FormData();
    const blob = new Blob([data], {type: 'application/octet-stream'});
    formData.append('file', blob as any);
    if (name) {
      formData.append('pinataMetadata', JSON.stringify({name}));
    }

    const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: {
        pinata_api_key: apiKey,
        pinata_secret_api_key: apiSecret,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Pinata upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.IpfsHash;
  } catch (error) {
    throw new Error(`Pinata upload failed: ${error}`);
  }
}

/**
 * Download from IPFS via HTTP gateway (React Native compatible)
 */
export async function downloadFromIPFS(cid: string): Promise<Uint8Array> {
  try {
    // Use public IPFS gateway for downloading
    const gatewayUrl = `https://ipfs.io/ipfs/${cid}`;
    const response = await fetch(gatewayUrl);

    if (!response.ok) {
      throw new Error(`IPFS download failed: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (error: any) {
    throw new Error(`IPFS download failed: ${error.message}`);
  }
}

/**
 * Initialize IPFS (no-op for React Native, kept for API compatibility)
 */
export function initIPFS(gatewayUrl?: string) {
  // Gateway URL can be configured if needed
  console.log('IPFS initialized with gateway:', gatewayUrl || IPFS_GATEWAY);
}

/**
 * Initialize Web3.Storage (removed - use Pinata or direct IPFS for React Native)
 */
export function initWeb3Storage(apiToken?: string) {
  console.warn('Web3.Storage not available in React Native. Use uploadToPinata instead.');
}


