import Foundation
import PassKit
import React

@objc(ApplePayModule)
class ApplePayModule: NSObject, RCTBridgeModule {
  
  static func moduleName() -> String {
    return "ApplePayModule"
  }
  
  // MARK: - Apple Pay Payment
  
  @objc(requestPayment:amount:currency:resolver:rejecter:)
  func requestPayment(_ description: String, amount: String, currency: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    
    // Check if Apple Pay is available
    guard PKPaymentAuthorizationController.canMakePayments() else {
      rejecter("NOT_AVAILABLE", "Apple Pay is not available on this device", nil)
      return
    }
    
    // Check if cards are available
    guard PKPaymentAuthorizationController.canMakePayments(usingNetworks: [.visa, .masterCard, .amex]) else {
      rejecter("NO_CARDS", "No payment cards available. Please add a card to Wallet.", nil)
      return
    }
    
    // Create payment request
    let request = PKPaymentRequest()
    
    // Set merchant identifier (you need to configure this in your Apple Developer account)
    request.merchantIdentifier = "merchant.com.echoid.app"
    
    // Set country and currency codes
    request.countryCode = "US"
    request.currencyCode = currency.uppercased()
    
    // Set supported networks
    request.supportedNetworks = [.visa, .masterCard, .amex, .discover]
    
    // Set merchant capabilities
    request.merchantCapabilities = [.capability3DS, .capabilityCredit, .capabilityDebit]
    
    // Parse amount (amount should be in smallest currency unit, e.g., cents for USD)
    guard let amountDecimal = Decimal(string: amount) else {
      rejecter("INVALID_AMOUNT", "Invalid amount format", nil)
      return
    }
    
    // Create payment summary item
    let paymentItem = PKPaymentSummaryItem(
      label: description,
      amount: NSDecimalNumber(decimal: amountDecimal)
    )
    
    request.paymentSummaryItems = [paymentItem]
    
    // Create payment authorization controller
    let paymentController = PKPaymentAuthorizationController(paymentRequest: request)
    
    paymentController.delegate = PaymentDelegate(resolver: resolver, rejecter: rejecter)
    
    // Present payment sheet
    paymentController.present { (presented) in
      if !presented {
        rejecter("PRESENTATION_ERROR", "Failed to present Apple Pay sheet", nil)
      }
    }
  }
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
}

// MARK: - PKPaymentAuthorizationControllerDelegate

class PaymentDelegate: NSObject, PKPaymentAuthorizationControllerDelegate {
  let resolver: RCTPromiseResolveBlock
  let rejecter: RCTPromiseRejectBlock
  
  init(resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    self.resolver = resolver
    self.rejecter = rejecter
  }
  
  func paymentAuthorizationController(
    _ controller: PKPaymentAuthorizationController,
    didAuthorizePayment payment: PKPayment,
    handler completion: @escaping (PKPaymentAuthorizationResult) -> Void
  ) {
    // Process payment token
    // In production, send this to your payment processor (e.g., Stripe, Square)
    let token = payment.token
    
    // Extract payment data
    let paymentData: [String: Any] = [
      "transactionIdentifier": token.transactionIdentifier,
      "paymentData": token.paymentData.base64EncodedString(),
      "paymentMethod": [
        "network": token.paymentMethod.network?.rawValue ?? "unknown",
        "type": token.paymentMethod.type.rawValue,
        "displayName": token.paymentMethod.displayName ?? "unknown"
      ]
    ]
    
    // For MVP: Return success immediately
    // In production: Send to payment processor and wait for confirmation
    resolver(paymentData)
    completion(PKPaymentAuthorizationResult(status: .success, errors: nil))
  }
  
  func paymentAuthorizationControllerDidFinish(_ controller: PKPaymentAuthorizationController) {
    controller.dismiss(completion: nil)
  }
}

