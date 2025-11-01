# Wallet Creation Test Guide

## Fixed Issues

### 1. Duplicate Import Error ✅
- Removed duplicate `ActivityIndicator` import from `Auth.tsx`
- Fixed syntax errors

### 2. Wallet Implementation ✅
- Replaced `viem/accounts` with `ethereum-cryptography` (better React Native support)
- Following Chainlink tutorial framework: https://chain.link/tutorials/how-to-build-a-crypto-wallet
- Uses proper BIP-39 mnemonic generation
- Uses BIP-32 HD wallet derivation
- Uses secp256k1 ECDSA for key generation
- Uses Keccak-256 for address calculation

### 3. Error Handling ✅
- Fallback random number generator if native module unavailable
- Enhanced error messages with retry logic
- Proper error propagation

## Testing the Workflow

### Step 1: Verify Installation
```bash
cd /Users/timiajeigbe/Documents/echoID/EchoID
npm list ethereum-cryptography
```

### Step 2: Rebuild Metro Cache
```bash
npx react-native start --reset-cache
```

### Step 3: Test Wallet Creation

The wallet creation now uses:
1. **BIP-39**: Generate 12-word mnemonic
2. **BIP-32**: Create HD root key from entropy
3. **ECDSA**: Derive public key from private key
4. **Keccak-256**: Calculate Ethereum address

### Expected Flow

**Sign Up:**
1. User enters username (3+ chars, alphanumeric + dots/underscores/hyphens)
2. Optional email for recovery
3. System checks username availability
4. Generates device key (Secure Enclave or fallback)
5. Creates wallet using ethereum-cryptography:
   - Generate mnemonic
   - Create HD root key
   - Derive private key
   - Calculate public key
   - Compute address
6. Stores user data (username, email, wallet address, device key)
7. Stores wallet securely (without mnemonic)
8. Returns mnemonic for user to save

**Onboarding:**
1. Device key already generated (from signup)
2. Wallet already created (from signup)
3. Connect external wallet OR use created wallet
4. Setup FaceID
5. Create handle (optional)

**Consent Creation:**
1. All wizard steps
2. Generate handshake hashes
3. Create consent (test or live mode)
4. Store locally in Zustand

## Troubleshooting

### If wallet creation still fails:

1. **Check random values polyfill:**
   - Verify `index.js` imports `react-native-get-random-values`
   - Check fallback is working

2. **Verify ethereum-cryptography:**
   ```bash
   npm list ethereum-cryptography
   ```

3. **Clear and rebuild:**
   ```bash
   # Clear Metro cache
   npx react-native start --reset-cache
   
   # Rebuild iOS
   cd ios && pod install && cd ..
   npx react-native run-ios
   ```

4. **Check console logs:**
   - Look for "✅ Wallet created successfully"
   - Check for any error messages

### Common Issues

**Error: "getRandomValues not found"**
→ Fallback should handle this, but rebuild app if persists

**Error: "Mnemonic generation failed"**
→ Check crypto polyfill is working in `index.js`

**Error: "Failed to create HD root key"**
→ Verify ethereum-cryptography is installed correctly

## Verification

After successful signup, you should see:
- ✅ Wallet address generated (0x...)
- ✅ Mnemonic displayed (12 words)
- ✅ User data stored
- ✅ Wallet stored securely
- ✅ Can proceed to onboarding

