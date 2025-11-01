# EchoID — Expo Go Mobile App

Secure consent management app with cryptographic verification, WalletConnect integration, and encrypted vault storage.

**Built with Expo Go** for rapid development and testing.

## Features

- **On-device crypto**: Secure storage with Expo SecureStore (software-based, hardware-backed available with EAS Build)
- **WalletConnect v2**: Connect external wallets (Rainbow, MetaMask, etc.)
- **Consent NFTs**: Mint SBTs on Base Sepolia / Arbitrum Nova (supports chain switching)
- **Protocol fees**: Per-consent fee system with treasury
- **24-hour auto-lock**: Mandatory lock period before unlock eligibility
- **Dual-consent unlock**: Both parties must approve to unlock
- **E2EE Chat**: Per-consent encrypted chat history
- **FaceID vault**: Biometric-protected local storage (via Expo SecureStore)
- **Coercion detection**: Heuristic analysis of voice recordings
- **IPFS attachments**: Encrypted file storage on IPFS

## Architecture

- **Framework**: Expo Go (~52.0.0) with React Native
- **Crypto Storage**: Expo SecureStore (software-based encryption)
- **Camera**: Expo Camera
- **Audio**: Expo AV
- **Location**: Expo Location
- **File System**: Expo File System
- **Wallet**: WalletConnect v2 (no private key custody)
- **Chain**: Arbitrum Nova (default, lower fees), supports Base Sepolia/Polygon zkEVM
- **State**: Zustand
- **Navigation**: React Navigation

## Quick Start

### Prerequisites

1. Install [Expo Go](https://expo.dev/client) on your phone:
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. Start Expo:
```bash
npx expo start
```

4. Scan QR code with Expo Go app on your phone

### Development

```bash
# Start Expo dev server
npm start

# iOS simulator
npm run ios

# Android emulator
npm run android

# Web (for testing)
npm run web
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
  /screens      # Onboarding, Vault, NewConsentWizard, ConsentDetail, Auth, Profile, Settings
  /components   # Recorder, SelfieCapture, BadgeCard, UnlockBar, Chat, ParticipantInput, QRScanner
  /lib          # walletconnect, config, templates, coercion, geo, ipfs, auth, wallet, handles
  /crypto       # Expo SecureStore wrappers, encryption helpers (expo-index.ts)
  /sdk          # Contract interactions (createConsent, requestUnlock, etc.)
  /state        # Zustand store (consents, wallet, entitlements)
```

## Expo Modules Used

- **expo-secure-store**: Secure key/value storage (replaces Keychain/EncryptedStorage)
- **expo-camera**: Camera access for selfie capture
- **expo-av**: Audio recording for voice verification
- **expo-location**: GPS for geo-hashing
- **expo-file-system**: File operations
- **expo-crypto**: Cryptographic utilities (random bytes, hashing)

## Limitations (Expo Go)

⚠️ **Important**: Expo Go has some limitations compared to custom native builds:

1. **No Apple Pay**: Custom native module not supported in Expo Go
   - **Solution**: Use EAS Build for custom development build
   
2. **No Hardware Secure Enclave**: Uses software-based encryption (expo-secure-store)
   - **Solution**: Use EAS Build with custom SecureEnclaveModule for hardware-backed keys
   
3. **WalletConnect**: ✅ Works with Expo Go
4. **Camera/Mic/Location**: ✅ All work with Expo Go

## For Production Features

If you need Apple Pay or hardware-backed Secure Enclave:

1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

2. **Configure EAS**:
   ```bash
   eas build:configure
   ```

3. **Create Development Build**:
   ```bash
   eas build --profile development --platform ios
   ```

4. **Install on device** and use custom native modules

## Permissions

The app requires the following permissions (configured in `app.json`):
- **Camera**: Face verification
- **Microphone**: Voice recording  
- **Location**: Geo-hashing for consent
- **FaceID**: Vault unlock (via Expo SecureStore)

## Testing

### Account Creation Flow
1. Create username
2. Wallet generated automatically
3. Device key created
4. Proceed to onboarding

### Consent Creation Flow
1. Select template (NDA, Sex-NDA, etc.)
2. Add participant (QR/handle/wallet)
3. Record voice (read aloud)
4. Capture selfie
5. Select unlock policy
6. Pay fee (WalletConnect or Apple Pay with EAS Build)
7. Mint consent → 24h lock starts

### Unlock Flow
1. After 24h, both parties can request unlock
2. Dual approval required
3. Chat and attachments become accessible

## Acceptance Criteria

✅ Create consent → SBTs minted, 24h lock, countdown visible  
✅ Dual-sign unlock after 24h → reveals attachments/chat  
✅ Sex-NDA template → age gate, read-aloud capture, coercion enum  
✅ Encrypted storage → at-rest and in-transit  
✅ WalletConnect → end-to-end on Arbitrum Nova / Base Sepolia  

## Notes

- MVP uses mock face embeddings (replace with CoreML in production with EAS Build)
- Protocol fee is displayed and charged at consent creation
- Chain switching UI is prepared but wizard shows fee on selected chain
- Entitlements (Pro/Skins) read from remote config (web purchases)
- Deep linking: `echoid://consent/<id>` (configure in app.json)
- Test mode available for development without blockchain transactions

## Migrating from React Native Bare

This project was migrated from React Native bare to Expo Go. See `EXPO_MIGRATION.md` for details.

Key changes:
- `react-native-keychain` → `expo-secure-store`
- `react-native-vision-camera` → `expo-camera`
- `react-native-audio-recorder-player` → `expo-av`
- `react-native-fs` → `expo-file-system`
- `react-native-geolocation-service` → `expo-location`
- Custom native modules replaced with Expo equivalents

## License

Proprietary - EchoID
