# WalletConnect Expo Go Compatibility Test

## Overview
Testing WalletConnect v2 compatibility with Expo Go to ensure wallet connection works properly.

## WalletConnect Setup

### Dependencies
- `@walletconnect/sign-client`: ^2.13.2
- `@walletconnect/utils`: ^2.13.2

### Configuration Required
1. **WalletConnect Project ID**: Update in `src/lib/walletconnect.ts`
   - Get Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com)
   - Replace `YOUR_WALLETCONNECT_PROJECT_ID` with your actual project ID

### Expo Go Compatibility Notes

✅ **WalletConnect v2 Sign Client works with Expo Go**
- No native modules required
- Uses WebSocket connections
- QR code scanning handled by WalletConnect modal

⚠️ **Potential Issues**:
1. **Network Permissions**: Expo Go requires proper network permissions
2. **Deep Linking**: QR codes use universal links/deep links
3. **WebSocket**: Should work with Expo Go's networking stack

## Testing Steps

### 1. Test Wallet Connection (Onboarding Screen)

```typescript
// In Onboarding.tsx, when user taps "Connect Wallet"
const handleConnectWallet = async () => {
  try {
    const {accounts, chainId} = await connectWallet();
    // Should open WalletConnect modal with QR code
    // User scans QR with wallet app (Rainbow, MetaMask, etc.)
    // Wallet app requests connection approval
    // Returns accounts and chainId
  } catch (error) {
    // Handle errors
  }
};
```

### 2. Test Transaction Signing (Consent Creation)

```typescript
// In NewConsentWizard.tsx, when creating consent
const {txHash} = await createConsent({
  // ... params
  chainId: selectedChain,
  feeWei: protocolFeeWei,
  treasury: config.treasuryAddress,
});
// Should:
// 1. Open WalletConnect modal
// 2. Show transaction details in wallet app
// 3. User approves transaction
// 4. Returns txHash
```

### 3. Verify Features

- [ ] QR code displays correctly
- [ ] Wallet app opens when scanning QR
- [ ] Connection approval works
- [ ] Account addresses returned correctly
- [ ] Chain ID matches selected network
- [ ] Transaction signing works
- [ ] Transaction hash returned correctly
- [ ] Error handling works for user rejection

## Common Issues & Fixes

### Issue: QR Code Not Displaying
**Fix**: Ensure WalletConnect modal has proper permissions and WebSocket connection works.

### Issue: Wallet Not Connecting
**Fix**: 
- Check Project ID is set correctly
- Verify network connection
- Check WalletConnect Cloud dashboard for issues

### Issue: Transaction Fails
**Fix**:
- Verify wallet has sufficient funds
- Check gas price/limit settings
- Verify chain ID matches wallet network

## Manual Test Checklist

1. **Start Expo**:
   ```bash
   cd /Users/timiajeigbe/Documents/echoID/EchoID
   npx expo start
   ```

2. **Open in Expo Go**:
   - Scan QR code with Expo Go app
   - App should load

3. **Test Wallet Connection**:
   - Go through onboarding
   - Tap "Connect Wallet"
   - Verify QR code appears
   - Scan with wallet app (Rainbow, MetaMask Mobile)
   - Approve connection
   - Verify wallet address appears in app

4. **Test Consent Creation**:
   - Create new consent
   - Complete wizard steps
   - When minting, verify transaction modal appears
   - Approve in wallet app
   - Verify transaction hash returned

## Expected Behavior

### Successful Connection
- QR code displays immediately
- WalletConnect modal shows connection request
- After wallet approval, account address is stored
- Chain ID is stored and used for transactions

### Successful Transaction
- Transaction modal shows in wallet app
- User can review transaction details
- After approval, transaction hash is returned
- Consent is created on-chain

## Debugging

### Enable WalletConnect Logs
```typescript
// In walletconnect.ts, add logging
console.log('WalletConnect client:', signClient);
console.log('Connection URI:', uri);
console.log('Session:', session);
```

### Check WebSocket Connection
- Verify device has internet connection
- Check Expo Go has network permissions
- Try different network (WiFi vs cellular)

### Verify Project ID
- Check WalletConnect Cloud dashboard
- Ensure Project ID is correct
- Verify project is active

