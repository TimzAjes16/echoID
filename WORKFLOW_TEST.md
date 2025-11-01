# Complete Workflow Test Guide

## Fixed Issues

### 1. Account Creation Flow ✅
- Enhanced error handling in `signUp()` function
- Added fallback for device key generation (simulator support)
- Better error messages for debugging
- Wallet creation now uses ethereum-cryptography (Chainlink framework)

### 2. Onboarding Flow ✅
- Updated `checkOnboardingStatus()` to detect existing device key and wallet
- Skips steps that were already completed during signup
- If device key and wallet exist → skip to biometric
- If only device key exists → go to wallet step
- Otherwise → start from device key generation

### 3. Swift Build Errors ✅
- Fixed all `DispatchQueue.async` syntax errors
- Changed from `DispatchWorkItem` pattern to direct closure
- Should now build successfully

## Complete Workflow: Signup → Handshake

### Step 1: Create Account (Auth Screen)

**Actions:**
1. Enter username (e.g., "alex.wave")
2. Optionally enter email
3. Click "Create Account"

**Expected:**
- ✅ Username validation (3+ chars, alphanumeric + dots/underscores/hyphens)
- ✅ Username availability check
- ✅ Device key generation (or mock on simulator)
- ✅ Wallet creation (12-word mnemonic)
- ✅ User data stored
- ✅ Shows "Wallet Created" alert
- ✅ Proceeds to onboarding

**Debug Logs:**
- "✅ Device key generated: ..."
- "✅ Wallet created: 0x..."
- "✅ User data stored"
- "✅ Sign up successful: {username, walletAddress, hasMnemonic}"

### Step 2: Onboarding

**Actions:**
1. If device key/wallet exist → Skip to biometric
2. Otherwise → Generate device key → Create wallet → Show mnemonic
3. Setup FaceID
4. Optionally create handle

**Expected:**
- ✅ Detects existing device key and wallet
- ✅ Skips to biometric setup
- ✅ FaceID setup completes
- ✅ Proceeds to main app (Vault)

### Step 3: Create Consent (New Consent Wizard)

**Actions:**
1. Tap "+" FAB in Vault
2. Go through wizard steps:
   - Price & Chain
   - Template (e.g., "NDA")
   - Participants (add via handle/QR/wallet)
   - Read Aloud (record voice)
   - Face Check (capture selfie)
   - Policy (unlock mode)
   - Attachments (optional)
   - Fee Confirmation (Apple Pay or wallet)
   - Review
   - Minting

**Expected:**
- ✅ All steps complete successfully
- ✅ Voice hash generated
- ✅ Face hash generated
- ✅ Device hash generated
- ✅ Geo hash generated (or fallback)
- ✅ Coercion analysis (or default green)
- ✅ Payment processed (Apple Pay or wallet)
- ✅ Consent created on-chain (or test mode)
- ✅ 24-hour lock period starts
- ✅ Consent appears in vault

### Step 4: Handshake Verification

**Actions:**
1. View consent in vault
2. Check all hashes are present
3. Verify 24h lock countdown
4. Test unlock request (after 24h)

**Expected:**
- ✅ Consent badge shows correctly
- ✅ All verification hashes present
- ✅ Lock countdown working
- ✅ Can request unlock after 24h

## Testing Checklist

### Account Creation
- [ ] Username validation works
- [ ] Username availability check works
- [ ] Device key generates (or mock)
- [ ] Wallet creates successfully
- [ ] Mnemonic displayed/returned
- [ ] User data stored
- [ ] No errors in console

### Onboarding
- [ ] Detects existing device key/wallet
- [ ] Skips appropriate steps
- [ ] FaceID setup works
- [ ] Can skip handle creation
- [ ] Proceeds to vault

### Consent Creation
- [ ] Wizard steps work
- [ ] Voice recording works
- [ ] Selfie capture works
- [ ] Location permission works
- [ ] Payment works (Apple Pay or wallet)
- [ ] Consent created successfully
- [ ] Appears in vault

### Handshake
- [ ] All hashes present
- [ ] Consent locked for 24h
- [ ] Unlock request works
- [ ] Chat/vault accessible after unlock

## Common Issues & Fixes

### Issue: "Wallet creation failed"
**Fix:** 
- Check console for specific error
- Ensure crypto.getRandomValues polyfill is working
- Verify ethereum-cryptography is installed

### Issue: "Device key generation failed"
**Fix:**
- On simulator: Should use mock key automatically
- On device: Check Secure Enclave availability
- Verify SecureEnclaveModule is linked

### Issue: "Username already taken"
**Fix:**
- Try different username
- Check local storage isn't corrupted
- Clear app data if needed

### Issue: Payment fails
**Fix:**
- Verify Apple Pay is set up (merchant ID configured)
- Check network connection
- Use wallet option as fallback

## Debug Commands

```bash
# Check wallet creation
console.log('Testing wallet creation...');
const wallet = await createWallet();
console.log('Wallet:', wallet);

# Check device key
const deviceKey = await generateDeviceKey('test');
console.log('Device key:', deviceKey);

# Check signup
const result = await signUp('testuser', 'test@example.com');
console.log('Signup result:', result);
```

