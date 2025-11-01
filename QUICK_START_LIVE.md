# Quick Start: Testing with Live Data

## Step 1: Disable Test Mode

### Method A: Via App UI
1. Launch the app
2. Go to **Profile** → **Settings**
3. Toggle **Test Mode** to OFF
4. Read the warning and confirm

### Method B: Via Code (for development)
Add this to your `App.tsx` initialization:

```typescript
import {setTestMode} from './src/lib/testMode';

// In initializeApp function
await setTestMode(false); // Disable test mode
```

## Step 2: Configure Contract Address

Edit `src/sdk/index.ts`:

```typescript
const FACTORY_ADDRESS = '0xYOUR_DEPLOYED_FACTORY_ADDRESS'; // Replace with actual address
```

## Step 3: Configure WalletConnect

Edit `src/lib/walletconnect.ts`:

```typescript
const PROJECT_ID = 'your-actual-project-id'; // Get from walletconnect.com
```

## Step 4: Test the Flow

### Minimal Test Checklist
1. ✅ Create account (username + wallet)
2. ✅ Complete onboarding
3. ✅ Start new consent wizard
4. ✅ Fill all required fields
5. ✅ Submit transaction
6. ✅ Approve in wallet
7. ✅ Verify consent in vault

### What to Watch For

**During Transaction:**
- WalletConnect modal should appear
- Transaction details should be correct
- Fee should match expected amount
- Network should match selected chain

**After Transaction:**
- Success message should appear
- Consent should show in vault
- Transaction hash should be valid
- 24-hour lock should be active

**On Block Explorer:**
- Transaction should be visible
- Status should be "Success"
- Gas used should be reasonable
- Events should be logged (if contract emits them)

## Network Recommendations

### For Testing (Low Cost)
- **Arbitrum Nova** (42170): ~$0.05-0.10 per tx
- **Base Sepolia** (84532): Testnet (free testnet ETH)

### For Production
- **Arbitrum Nova** (42170): Recommended for lower fees
- **Base Mainnet** (8453): Higher fees but well-supported
- **Polygon zkEVM** (1442): Lower fees, good scalability

## Troubleshooting Quick Fixes

**Error: "Wallet not connected"**
→ Complete onboarding and connect wallet via WalletConnect

**Error: "Insufficient funds"**
→ Add ETH to wallet (for protocol fee + gas)

**Error: "Factory address not set"**
→ Update FACTORY_ADDRESS in src/sdk/index.ts

**Error: "Transaction failed"**
→ Check block explorer for reason, verify contract is deployed

**Error: "Network mismatch"**
→ Ensure wallet is on same network as selected chain

## Safety Tips

⚠️ **Start Small**: Test with minimum protocol fee first
⚠️ **Test Network First**: Use Base Sepolia for initial testing
⚠️ **Verify Contract**: Confirm Factory address is correct
⚠️ **Monitor Gas**: Watch gas prices, wait for low-fee periods
⚠️ **Backup Data**: Export mnemonics and keys before testing

## Expected Costs

Per consent creation:
- Protocol fee: 0.01 ETH (~$20-40 depending on ETH price)
- Gas fee: ~$0.05-0.10 on Arbitrum Nova
- **Total**: ~$20-40.50 per consent

On testnets:
- Protocol fee: Still 0.01 ETH (testnet ETH)
- Gas fee: Free/testnet ETH
- **Total**: Free (using testnet tokens)

