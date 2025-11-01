# Complete Workflow Test Guide

## ✅ Fixed Issues

### 1. Duplicate ActivityIndicator Import
- **Fixed**: Removed duplicate import from `Auth.tsx`

### 2. Wallet Creation Framework
- **Replaced**: `viem/accounts` with `ethereum-cryptography` 
- **Based on**: [Chainlink tutorial](https://chain.link/tutorials/how-to-build-a-crypto-wallet)
- **Benefits**: Better React Native compatibility, no native module dependencies for basic operations

### 3. Complete Wallet Flow
Following Chainlink framework:
1. **BIP-39**: Generate 12-word mnemonic from entropy
2. **BIP-32**: Create HD root key (Hierarchical Deterministic)
3. **ECDSA (secp256k1)**: Derive public key from private key
4. **Keccak-256**: Calculate Ethereum address from public key

## Testing the Complete Workflow

### Prerequisites
✅ `ethereum-cryptography` installed
✅ `react-native-get-random-values` installed
✅ Metro cache cleared
✅ App rebuilt

### Step-by-Step Test

#### 1. Authentication (Sign Up)
```
Input: Username (e.g., "alex.wave")
Optional: Email (e.g., "alex@example.com")

Expected:
✅ Username validation (3+ chars, alphanumeric + dots/underscores/hyphens)
✅ Username availability check
✅ Device key generation
✅ Wallet creation using ethereum-cryptography:
   - Mnemonic: 12 words
   - Address: 0x... (valid Ethereum address)
   - Private key: 0x... (64 hex chars)
✅ User data stored
✅ Wallet stored securely
✅ Mnemonic displayed to user
```

#### 2. Authentication (Login)
```
Input: Username OR Email

Expected:
✅ Finds user by username or email
✅ Restores session
✅ Loads wallet address
✅ Proceeds to main app
```

#### 3. Onboarding
```
Expected Flow:
1. Device key already exists (from signup)
2. Wallet already exists (from signup)
3. Connect external wallet OR use existing
4. Setup FaceID
5. Create handle (optional)
```

#### 4. Consent Creation (Live Mode)
```
Steps:
1. Price & Chain → Select network
2. Template → Choose consent type
3. Participants → Add via QR/handle/wallet
4. Read Aloud → Record voice → voiceHash
5. Face Check → Capture selfie → faceHash
6. Device Sig → Automatic → deviceHash
7. Geo+UTC → Location → geoHash
8. Coercion Check → Analyze → risk level
9. Policy → Unlock mode
10. Attachments → IPFS upload (optional)
11. Fee Confirmation → Review fee
12. Review → Final check
13. Minting → Blockchain transaction:
    - WalletConnect prompt
    - User approves
    - Transaction submitted
    - Consent created
    - Stored in vault
```

## Verification Checklist

After each step, verify:

### Sign Up
- [ ] No duplicate import errors
- [ ] Wallet address generated (starts with 0x)
- [ ] Address is 42 characters (0x + 40 hex)
- [ ] Mnemonic is 12 words
- [ ] User data stored
- [ ] Can proceed to next step

### Login
- [ ] Can login with username
- [ ] Can login with email
- [ ] Username recovery works
- [ ] Session persists

### Wallet Creation
- [ ] Uses ethereum-cryptography
- [ ] No RNGetRandomValues errors
- [ ] Fallback works if native module unavailable
- [ ] Private key is valid hex
- [ ] Address is valid Ethereum address

### Consent Creation
- [ ] All hashes generated correctly
- [ ] Handshake data complete
- [ ] Transaction sent (in live mode)
- [ ] Consent appears in vault
- [ ] 24-hour lock active

## Debugging

### If wallet creation fails:

1. **Check console logs:**
   - Look for "✅ Wallet created successfully"
   - Check for error stack traces

2. **Verify imports:**
   ```typescript
   // Should work without native module
   import {generateMnemonic} from 'ethereum-cryptography/bip39';
   ```

3. **Test random values:**
   ```javascript
   // In console or debugger
   console.log(typeof crypto?.getRandomValues);
   // Should be "function"
   ```

4. **Verify ethereum-cryptography:**
   ```bash
   npm list ethereum-cryptography
   # Should show version 3.2.0
   ```

### Common Errors & Fixes

**Error: "ethereum-cryptography module not found"**
→ Run: `npm install ethereum-cryptography`

**Error: "getRandomValues is not a function"**
→ Check `index.js` imports `react-native-get-random-values` first
→ Fallback should handle this automatically

**Error: "Mnemonic generation failed"**
→ Verify crypto polyfill in `index.js`
→ Check `ensureRandomValues()` is called

**Error: "HDKey.fromMasterSeed failed"**
→ Verify entropy is valid Uint8Array
→ Check ethereum-cryptography version

## Expected Console Output

Successful wallet creation should log:
```
✅ Wallet created successfully: {address: "0x...", mnemonic: "word1 word2 word3..."}
```

Successful signup should show:
```
✅ Wallet created successfully
✅ User data stored
```

## Next Steps

After wallet creation works:
1. Test full onboarding flow
2. Test consent creation
3. Test with live blockchain (disable test mode)
4. Verify all hashes generate correctly
5. Test transaction flow

