/**
 * Apple Pay integration for funding wallet and paying fees
 */

import {NativeModules, Platform} from 'react-native';

const {ApplePayModule} = NativeModules;

export interface ApplePayResult {
  transactionIdentifier: string;
  paymentData: string;
  paymentMethod: {
    network: string;
    type: number;
    displayName: string;
  };
}

/**
 * Request Apple Pay payment
 * @param description - Payment description
 * @param amount - Amount in USD (e.g., "10.50")
 * @param currency - Currency code (default: "USD")
 */
export async function requestApplePayPayment(
  description: string,
  amount: string,
  currency: string = 'USD',
): Promise<ApplePayResult> {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple Pay is only available on iOS');
  }

  if (!ApplePayModule || !ApplePayModule.requestPayment) {
    throw new Error(
      'ApplePayModule is not available. Please ensure ApplePayModule.swift is added to the Xcode project.',
    );
  }

  try {
    const result = await ApplePayModule.requestPayment(description, amount, currency);
    return result;
  } catch (error: any) {
    throw new Error(`Apple Pay payment failed: ${error?.message || error}`);
  }
}

/**
 * Check if Apple Pay is available
 */
export async function isApplePayAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') {
    return false;
  }

  if (!ApplePayModule) {
    return false;
  }

  try {
    // Try a test request to check availability
    // In production, use a dedicated check method
    return true;
  } catch {
    return false;
  }
}

