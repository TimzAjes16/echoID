# Live Mode Setup & Testing Guide

## Prerequisites for Live Testing

Before testing with live blockchain data, ensure you have:

### 1. Deployed Contracts
- [ ] Factory contract deployed to your target network (Arbitrum Nova recommended for lower fees)
- [ ] Factory address saved in `src/sdk/index.ts`
- [ ] Contracts verified on block explorer

### 2. WalletConnect Configuration
- [ ] Get Project ID from [walletconnect.com](https://cloud.walletconnect.com)
- [ ] Update `PROJECT_ID` in `src/lib/walletconnect.ts`
- [ ] Configure redirect URLs in WalletConnect dashboard

### 3. Network Configuration
- [ ] Update `defaultChainId` in `src/lib/config.ts` if needed
- [ ] Verify RPC endpoints are accessible
- [ ] Ensure network is added to WalletConnect supported chains

### 4. Wallet Setup
- [ ] Wallet has sufficient funds for:
  - Protocol fee: 0.01 ETH (or configured amount)
  - Gas fees: ~$0.05-0.10 per transaction on Arbitrum Nova
- [ ] Test wallet is connected via WalletConnect

## Switching to Live Mode

### Option 1: Via Settings Screen (Recommended)
1. Open the app
2. Navigate to Profile → Settings
3. Toggle "Test Mode" OFF
4. Review pre-flight checklist
5. Confirm you understand real fees will apply

### Option 2: Programmatically
```typescript
import {setTestMode} from './src/lib/testMode';
await setTestMode(false); // Enable live mode
```

## Testing Checklist

### Authentication Flow
- [ ] Create account with username
- [ ] Add email for recovery (optional)
- [ ] Verify username uniqueness check works
- [ ] Login with username
- [ ] Login with email
- [ ] Test "Forgot Username" recovery

### Onboarding Flow
- [ ] Generate device key (Secure Enclave)
- [ ] Connect wallet via WalletConnect
- [ ] Setup FaceID/biometric
- [ ] Create EchoID handle (optional)

### Consent Creation Flow
1. [ ] **Price & Chain**: Verify network and fee display
2. [ ] **Template**: Select consent type
3. [ ] **Participants**: Add participant via:
   - QR code scan
   - Handle lookup
   - Direct wallet address
4. [ ] **Read Aloud**: Record voice, verify voiceHash generated
5. [ ] **Face Check**: Capture selfie, verify faceHash generated
6. [ ] **Device Sig**: Automatic, verify deviceHash generated
7. [ ] **Geo+UTC**: Location hash generated (or fallback)
8. [ ] **Coercion Check**: Analyze audio, get risk level
9. [ ] **Policy**: Select unlock mode
10. [ ] **Attachments**: Optional IPFS upload
11. [ ] **Fee Confirmation**: Review protocol fee
12. [ ] **Review**: Final check before minting
13. [ ] **Minting**: 
    - Verify WalletConnect transaction prompt
    - Confirm transaction on wallet
    - Wait for transaction confirmation
    - Verify consent appears in vault

### Post-Creation
- [ ] Verify consent appears in vault
- [ ] Check 24-hour lock timer
- [ ] Verify consent status is "locked"
- [ ] Check transaction hash on block explorer

## Troubleshooting

### Transaction Fails
1. Check wallet has sufficient funds
2. Verify network matches selected chain
3. Check Factory contract is deployed and accessible
4. Verify contract ABI matches deployed version
5. Check gas price is reasonable

### WalletConnect Issues
1. Verify Project ID is correct
2. Check WalletConnect service is accessible
3. Ensure wallet app supports the network
4. Try reconnecting wallet

### Hash Generation Issues
- Voice hash: Check audio recording permissions
- Face hash: Check camera permissions
- Device hash: Verify Secure Enclave access
- Geo hash: Check location permissions

### Module Not Found Errors
1. Run `cd ios && pod install && cd ..`
2. Clean build folder in Xcode
3. Rebuild app
4. Check native modules are properly linked

## Expected Live Mode Behavior

### Transaction Flow
1. User completes all wizard steps
2. App constructs transaction with:
   - Factory contract address
   - Consent parameters (hashes, unlock mode, etc.)
   - Protocol fee as `value`
3. WalletConnect prompts user to sign transaction
4. User approves in wallet app
5. Transaction submitted to network
6. App waits for confirmation (optional)
7. Consent created and stored locally

### Fees
- **Protocol Fee**: Set in config (default 0.01 ETH)
- **Gas Fee**: Network-dependent (~$0.05-0.10 on Arbitrum Nova)
- **Total**: Protocol + Gas fees

### Network Options
- **Arbitrum Nova** (42170): Recommended - Lowest fees
- **Base Sepolia** (84532): Testnet - Free testnet tokens
- **Polygon zkEVM** (1442): Lower fees than mainnet

## Switching Back to Test Mode

If you need to test without blockchain:
1. Go to Settings
2. Toggle "Test Mode" ON
3. App will use simulated transactions immediately

## Support

For issues:
1. Check console logs for detailed errors
2. Verify all prerequisites are met
3. Test with a small transaction first
4. Check block explorer for transaction status

