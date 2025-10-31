# EchoID Setup Guide

## Prerequisites

1. Node.js >= 20
2. CocoaPods installed
3. Xcode 15+ (for iOS development)
4. iOS Simulator or physical device

## Initial Setup

```bash
cd EchoID

# Install dependencies
pnpm install

# Install iOS pods
cd ios && pod install && cd ..
```

## Configuration Required

### 1. WalletConnect Project ID

Edit `src/lib/walletconnect.ts`:
```typescript
const PROJECT_ID = 'YOUR_WALLETCONNECT_PROJECT_ID'; // Get from https://cloud.walletconnect.com
```

### 2. Contract Addresses

Edit `src/sdk/index.ts`:
```typescript
const FACTORY_ADDRESS = '0x...'; // Your Factory contract address on Base Sepolia
```

Also update the ABI to match your actual contract:
```typescript
const FACTORY_ABI = parseAbi([
  // Your actual contract ABI methods
]);
```

### 3. Remote Config

Edit `src/lib/config.ts`:
```typescript
const DEFAULT_CONFIG: AppConfig = {
  treasuryAddress: '0x...', // Your treasury address
  protocolFeeWei: '50000000000000000', // 0.05 ETH in wei
  defaultChainId: 84532, // Base Sepolia
  supportedChainIds: [84532],
  apiBaseUrl: 'https://api.echoid.app', // Your API endpoint
};
```

### 4. Xcode Project Settings

1. Open `ios/EchoID.xcworkspace` (not .xcodeproj)
2. Add SecureEnclaveModule.swift and SecureEnclaveModule.m to the project
3. Set the bridging header path in Build Settings:
   - Swift Compiler - General → Objective-C Bridging Header: `EchoID/EchoID-Bridging-Header.h`

### 5. Native Module Integration

The `SecureEnclaveModule` is already created. Ensure:
- Swift files are added to the Xcode project
- Bridging header is configured (see above)
- Module exports are correct (already done)

## Running the App

```bash
# Start Metro bundler
pnpm start

# In another terminal, run iOS
pnpm ios

# Or open in Xcode
xed ios/EchoID.xcworkspace
```

## Testing Checklist

- [ ] Onboarding flow completes
- [ ] Device key generation works
- [ ] WalletConnect connects successfully
- [ ] FaceID unlock works for vault
- [ ] New consent wizard completes all steps
- [ ] Audio recording saves correctly
- [ ] Selfie capture works
- [ ] Consent minting succeeds (with fee)
- [ ] Unlock request/approval flow works
- [ ] Chat messages are encrypted
- [ ] IPFS upload works (if configured)

## Common Issues

### Pod Install Fails
```bash
cd ios
pod deintegrate
pod install
cd ..
```

### Native Module Not Found
- Verify bridging header path in Xcode
- Clean build folder (Cmd+Shift+K)
- Rebuild (Cmd+B)

### WalletConnect Connection Issues
- Verify PROJECT_ID is correct
- Check network permissions in Info.plist
- Ensure wallet app supports WalletConnect v2

### Secure Enclave Errors
- Ensure device has Secure Enclave (iPhone 6S+)
- Check FaceID/TouchID is enabled
- Verify keychain access controls

## Next Steps

1. Deploy contracts to Base Sepolia
2. Update contract addresses in SDK
3. Set up remote config endpoint
4. Configure push notifications
5. Add deep linking URLs in Xcode
6. Test end-to-end flow

## Production Checklist

- [ ] Replace mock face embeddings with CoreML
- [ ] Add proper error handling
- [ ] Implement transaction receipt parsing
- [ ] Add analytics (optional)
- [ ] Set up crash reporting
- [ ] Configure App Store Connect
- [ ] Test on physical devices
- [ ] Review App Store guidelines compliance

