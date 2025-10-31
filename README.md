# EchoID — React Native iOS App

Secure consent management app with cryptographic verification, WalletConnect integration, and encrypted vault storage.

## Features

- **On-device crypto**: Secure Enclave key generation and signing
- **WalletConnect v2**: Connect external wallets (Rainbow, MetaMask, etc.)
- **Consent NFTs**: Mint SBTs on Base Sepolia (supports chain switching)
- **Protocol fees**: Per-consent fee system with treasury
- **24-hour auto-lock**: Mandatory lock period before unlock eligibility
- **Dual-consent unlock**: Both parties must approve to unlock
- **E2EE Chat**: Per-consent encrypted chat history
- **FaceID vault**: Biometric-protected local storage
- **Coercion detection**: Heuristic analysis of voice recordings
- **IPFS attachments**: Encrypted file storage on IPFS

## Architecture

- **Framework**: React Native (bare RN 0.82.1)
- **Native Crypto**: Swift CryptoKit with Secure Enclave
- **Wallet**: WalletConnect v2 (no private key custody)
- **Chain**: Base Sepolia (default), supports Arbitrum Nova/Polygon zkEVM
- **State**: Zustand
- **Navigation**: React Navigation

## Setup

```bash
# Install dependencies
pnpm install

# Install iOS pods
cd ios && pod install && cd ..

# Run on iOS
pnpm react-native run-ios
```

## Configuration

Update `src/lib/config.ts` with:
- Treasury address
- Protocol fee (wei)
- Supported chain IDs
- API base URL

Update `src/lib/walletconnect.ts` with:
- Your WalletConnect Project ID

Update `src/sdk/index.ts` with:
- Factory contract address
- Contract ABIs (from your contracts repo)

## Project Structure

```
/src
  /screens      # Onboarding, Vault, NewConsentWizard, ConsentDetail
  /components   # Recorder, SelfieCapture, BadgeCard, UnlockBar, Chat
  /lib          # walletconnect, config, templates, coercion, geo, ipfs
  /crypto       # Secure Enclave wrappers, encryption helpers
  /sdk          # Contract interactions (createConsent, requestUnlock, etc.)
  /state        # Zustand store (consents, wallet, entitlements)
```

## Native Modules

### SecureEnclaveModule (Swift)

- `generateKeyPair(label)` - Generate P-256 key in Secure Enclave
- `sign(data, label)` - Sign data with device key
- `wrapKey/unwrapKey` - ECDH key wrapping for encryption

## Permissions

- Camera: Face verification
- Microphone: Voice recording
- Location: Geo-hashing for consent
- FaceID: Vault unlock

## Acceptance Criteria

✅ Create consent → SBTs minted, 24h lock, countdown visible  
✅ Dual-sign unlock after 24h → reveals attachments/chat  
✅ Sex-NDA template → age gate, read-aloud capture, coercion enum  
✅ Encrypted storage → at-rest and in-transit  
✅ WalletConnect → end-to-end on Base Sepolia  

## Notes

- MVP uses mock face embeddings (replace with CoreML in production)
- Protocol fee is displayed and charged at consent creation
- Chain switching UI is prepared but wizard shows fee on selected chain
- Entitlements (Pro/Skins) read from remote config (web purchases)
- Deep linking: `echoid://consent/<id>` (configure in Xcode)

## License

Proprietary - EchoID
