# Expo Go Migration Guide

This guide explains how to convert the React Native bare project to Expo Go.

## Key Changes

### 1. Native Modules Replaced

| React Native Module | Expo Equivalent | Notes |
|---------------------|-----------------|-------|
| `react-native-keychain` | `expo-secure-store` | Secure key storage |
| `react-native-encrypted-storage` | `expo-secure-store` | Encrypted storage |
| `react-native-vision-camera` | `expo-camera` | Camera access |
| `react-native-audio-recorder-player` | `expo-av` | Audio recording |
| `react-native-fs` | `expo-file-system` | File operations |
| `react-native-geolocation-service` | `expo-location` | Location services |
| `react-native-get-random-values` | `expo-crypto` | Random values |
| `SecureEnclaveModule` (custom) | `expo-secure-store` + fallback | Device key generation |
| `ApplePayModule` (custom) | ❌ Not available in Expo Go | Requires EAS Build |

### 2. Limitations

**Important**: Expo Go does NOT support custom native modules. The following features require EAS Build (custom development build):

- **Apple Pay**: Custom Swift module cannot run in Expo Go
- **Secure Enclave**: Native module replaced with `expo-secure-store` (works but not hardware-backed)

### 3. Migration Steps

1. **Install Expo CLI** (if not already installed):
   ```bash
   npm install -g expo-cli
   ```

2. **Update package.json**:
   ```bash
   # Use package-expo.json as reference
   npm install expo@~52.0.0
   npm install expo-secure-store expo-camera expo-av expo-file-system expo-location expo-crypto
   npm uninstall react-native-keychain react-native-encrypted-storage react-native-vision-camera react-native-audio-recorder-player react-native-fs react-native-geolocation-service
   ```

3. **Update imports** in code:
   - Replace `react-native-keychain` → `expo-secure-store`
   - Replace `react-native-vision-camera` → `expo-camera`
   - Replace `react-native-audio-recorder-player` → `expo-av`
   - Replace `react-native-fs` → `expo-file-system`
   - Replace `react-native-geolocation-service` → `expo-location`

4. **Remove native code**:
   - Delete `ios/` and `android/` folders (Expo manages these)
   - Delete custom Swift modules (SecureEnclaveModule, ApplePayModule)

5. **Update app.json** (already done)

6. **Start Expo**:
   ```bash
   npx expo start
   ```

## Running the App

### With Expo Go (Recommended for Development)

1. Install Expo Go on your phone (iOS App Store / Google Play)
2. Run `npx expo start`
3. Scan QR code with Expo Go app

**Limitations**: No Apple Pay, Secure Enclave uses software fallback

### With EAS Build (For Production Features)

1. Install EAS CLI: `npm install -g eas-cli`
2. Configure: `eas build:configure`
3. Build: `eas build --profile development --platform ios`
4. Install on device

**Benefits**: Custom native modules work (Apple Pay, Secure Enclave)

## Code Changes Required

See `EXPO_CODE_CHANGES.md` for detailed code migration.

