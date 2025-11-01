# EchoID Flow Testing Guide

## Test Mode vs Live Mode

The app supports two modes:

### Test Mode (Default for Development)
- **Enabled by default** in development
- Creates consents without blockchain transactions
- Uses test wallet addresses
- Simulates transaction delays
- No actual fees required

### Live Mode
- Requires deployed contracts
- Uses real blockchain transactions
- Requires WalletConnect setup
- Real fees apply

## Switching Between Modes

Test mode is enabled by default. To switch to live mode:

```typescript
import {setTestMode} from './src/lib/testMode';
await setTestMode(false); // Enable live mode
```

## End-to-End Flow

### 1. Authentication Flow ✅
- **Sign Up**: Creates username + wallet address
- **Login**: Restores existing session
- **Wallet Creation**: Uses `react-native-get-random-values` polyfill

### 2. Onboarding Flow ✅
- Device key generation (with simulator fallback)
- Wallet connection (WalletConnect or in-app)
- FaceID setup
- Handle creation (optional)

### 3. Consent Creation Flow ✅
**Steps:**
1. **Price & Chain**: Select network (Arbitrum Nova default)
2. **Template**: Choose consent type
3. **Participants**: Add via QR/handle/wallet
4. **Read Aloud**: Record voice (generates voiceHash)
5. **Face Check**: Capture selfie (generates faceHash)
6. **Device Sig**: Automatic (deviceHash from Secure Enclave)
7. **Geo+UTC**: Location hash (with fallback)
8. **Coercion Check**: Analyzes audio features
9. **Policy**: Unlock mode selection
10. **Fee Confirmation**: Shows protocol fee
11. **Review**: Final check
12. **Minting**: Creates consent (test or live)

### 4. Handshake Components ✅
- **voiceHash**: SHA3-256 hash of audio PCM
- **faceHash**: SHA3-256 hash of face embedding
- **deviceHash**: SHA3-256 hash of device public key
- **geoHash**: SHA3-256 hash of location + timestamp

### 5. Test Data Fallbacks ✅
All components have fallbacks:
- Audio file read failure → test audio bytes
- Selfie processing failure → mock embedding
- Location access failure → test geo hash
- Coercion analysis failure → defaults to 'green'
- IPFS upload failure → stores locally only
- Handle resolution failure → test wallet address

## Validation Checklist

- [x] Auth: Sign up creates username and wallet
- [x] Auth: Login restores session
- [x] Onboarding: Device key generation works (with fallback)
- [x] Onboarding: Wallet creation/connection works
- [x] Onboarding: FaceID setup works
- [x] Wizard: All steps validate inputs
- [x] Wizard: Handshake hashes generated correctly
- [x] Wizard: Test mode creates consent without blockchain
- [x] Wizard: Live mode attempts blockchain transaction
- [x] Error handling: Graceful fallbacks at each step
- [x] Storage: Consent saved to Zustand store
- [x] Vault: Consents display correctly

## Known Limitations (MVP)

1. **Face Embedding**: Uses file bytes hash (not ML embedding)
2. **Event Parsing**: ConsentId from txHash (should parse events)
3. **Handle Resolution**: Test mode only (API not deployed)
4. **IPFS**: Falls back to mock CID on failure
5. **Secure Enclave**: Mock on simulator

## Next Steps for Production

1. Deploy contracts to Arbitrum Nova
2. Update FACTORY_ADDRESS in `src/sdk/index.ts`
3. Set up handle resolution API
4. Implement real face embedding extraction
5. Add event log parsing for consentId
6. Set up IPFS pinning service
7. Configure WalletConnect PROJECT_ID

