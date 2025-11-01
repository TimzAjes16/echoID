# Apple Pay Setup Guide

## What Was Added

### 1. Native Module (`ApplePayModule.swift`)
- Swift module using PassKit framework
- Handles Apple Pay payment requests
- Returns payment token for processing

### 2. TypeScript Integration (`src/lib/applePay.ts`)
- React Native bridge for Apple Pay
- `requestApplePayPayment()` function
- Type-safe payment result interface

### 3. UI Integration
- Added Apple Pay button to fee confirmation step
- Shows total amount (protocol fee + gas estimate)
- Allows users to fund wallet via Apple Pay
- Also supports direct wallet payment

## Configuration Required

### 1. Apple Developer Account Setup

1. **Register Merchant ID:**
   - Go to [Apple Developer Portal](https://developer.apple.com/account/)
   - Certificates, Identifiers & Profiles → Identifiers
   - Add new Merchant ID (e.g., `merchant.com.echoid.app`)
   - Register and download certificate

2. **Update Merchant ID in Code:**
   ```swift
   // In ApplePayModule.swift, line 26:
   request.merchantIdentifier = "merchant.com.echoid.app" // Change to your merchant ID
   ```

3. **Configure App ID:**
   - Ensure your app's Bundle ID includes Apple Pay capability
   - In Xcode: Signing & Capabilities → Add "Apple Pay"

### 2. Payment Processor Integration (Optional)

Currently, the module returns the payment token but doesn't process it. For production:

1. **Choose Payment Processor:**
   - Stripe (recommended)
   - Square
   - Adyen
   - Or your own backend

2. **Process Payment Token:**
   - Send payment token to your backend
   - Backend processes via payment processor
   - Return success/failure to app
   - Update `PaymentDelegate.paymentAuthorizationController()` to wait for confirmation

### 3. Add Files to Xcode Project

1. **Open Xcode:**
   ```bash
   open ios/EchoID.xcworkspace
   ```

2. **Add Files:**
   - Right-click on `EchoID` folder in Navigator
   - "Add Files to EchoID..."
   - Select:
     - `ApplePayModule.swift`
     - `ApplePayModule.m`
   - Ensure "Copy items if needed" is checked
   - Target: `EchoID`

3. **Link PassKit Framework:**
   - Select project in Navigator
   - Target: `EchoID` → Build Phases → Link Binary With Libraries
   - Click `+` → Add `PassKit.framework`

### 4. Capabilities

In Xcode:
1. Select project → Target: `EchoID`
2. Signing & Capabilities tab
3. Click `+ Capability`
4. Add "Apple Pay"
5. Select your Merchant ID

## Testing

### Simulator Testing
- Apple Pay works in simulator
- Use test cards from Apple Pay documentation
- Test successful and failed payment flows

### Device Testing
- Requires real device with Apple Pay setup
- Add test card to Wallet app
- Test end-to-end payment flow

## Usage in App

```typescript
import {requestApplePayPayment} from '../lib/applePay';

// Request payment
const result = await requestApplePayPayment(
  'EchoID Consent Fee',
  '10.50', // Amount in USD
  'USD'
);

// result contains:
// - transactionIdentifier
// - paymentData (encrypted token)
// - paymentMethod (network, type, displayName)
```

## Current Implementation

- **MVP**: Returns payment token immediately (simulated)
- **Production**: Should send token to payment processor backend
- **Funding**: Payment should fund user's wallet for network fees
- **Integration**: Integrated into consent creation wizard

## Next Steps

1. ✅ Code complete
2. ⏳ Configure Merchant ID
3. ⏳ Add files to Xcode project
4. ⏳ Set up payment processor backend (optional for MVP)
5. ⏳ Test on device

## Notes

- Apple Pay requires iOS 10.0+
- Merchant ID must be configured in Apple Developer account
- Payment processing requires backend integration (optional for MVP)
- For MVP, can simulate successful payment and fund wallet manually

