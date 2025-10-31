# EchoID React Native App - Changelog

## v1.0.0 - MVP Release

### Added Features

#### Core Functionality
- ✅ Secure Enclave native module for key generation and signing
- ✅ WalletConnect v2 integration for external wallet connections
- ✅ Protocol fee system with treasury collection
- ✅ Multi-chain support (Base Sepolia, Arbitrum Nova, Polygon zkEVM)

#### User Identity & Discovery
- ✅ Username/Handle system (`@alex.wave` format)
- ✅ QR code generation for sharing EchoID handles
- ✅ QR code scanning for adding participants
- ✅ Handle resolution API integration
- ✅ Profile screen for handle management
- ✅ Deep linking support (`echoid://u/<handle>`, `echoid://invite/<nonce>`, `echoid://consent/<id>`)

#### Consent Management
- ✅ Multi-step consent wizard (9 steps)
- ✅ Template selection (Sex-NDA, NDA, Creative, Collab, Conversation)
- ✅ Voice recording with coercion detection
- ✅ Face verification capture
- ✅ Device fingerprinting
- ✅ Geo-hashing for location verification
- ✅ 24-hour auto-lock mechanism
- ✅ Dual-consent unlock system
- ✅ Pause/Withdraw functionality

#### Communication
- ✅ Per-consent E2EE chat
- ✅ Encrypted local vault storage
- ✅ IPFS attachment upload

#### UI/UX
- ✅ FaceID-protected vault
- ✅ Consent badge cards with status indicators
- ✅ Unlock eligibility notifications
- ✅ Fee display with fiat conversion
- ✅ Chain selection UI

### Technical Implementation

#### Native Modules
- `SecureEnclaveModule` (Swift) - CryptoKit integration for Secure Enclave operations

#### State Management
- Zustand store with profile, wallet, consents, entitlements

#### Components Created
- `Recorder` - Audio recording for voice verification
- `SelfieCapture` - Camera-based face verification
- `BadgeCard` - Consent display card
- `UnlockBar` - Dual-consent unlock interface
- `Chat` - E2EE messaging component
- `QRCodeView` - QR code generation and display
- `QRScanner` - QR code scanning (with manual fallback)
- `ParticipantInput` - Multi-input participant addition

#### Screens
- `Onboarding` - 4-step setup (device key, wallet, FaceID, handle)
- `Vault` - Main consent list with FaceID protection
- `NewConsentWizard` - 9-step consent creation flow
- `ConsentDetail` - Full consent view with chat
- `Profile` - Handle management and QR sharing

### Configuration Required

1. **WalletConnect Project ID** - Set in `src/lib/walletconnect.ts`
2. **Factory Contract Address** - Set in `src/sdk/index.ts`
3. **Contract ABIs** - Update in `src/sdk/index.ts`
4. **Remote Config** - Set API endpoints in `src/lib/config.ts`
5. **Treasury Address** - Set in `src/lib/config.ts`

### Known Limitations (MVP)

- QR scanning uses manual input fallback (native frame processor TODO)
- Face embeddings are mocked (CoreML integration TODO)
- Transaction receipt parsing simplified (event log parsing TODO)
- Deep link navigation handler needs completion
- Entitlement refresh on foreground needs implementation

### Next Steps

1. Implement native QR code frame processor
2. Integrate CoreML for real face embeddings
3. Complete deep link navigation
4. Add push notification relay
5. Implement entitlement refresh mechanism
6. Add PDF export for proof bundles
7. Add multi-device sync (stretch)

