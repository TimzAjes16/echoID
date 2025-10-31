import Foundation
import Security
import CryptoKit
import React

@objc(SecureEnclaveModule)
class SecureEnclaveModule: NSObject, RCTBridgeModule {
  
  static func moduleName() -> String {
    return "SecureEnclaveModule"
  }
  
  // MARK: - Key Generation
  
  @objc(generateKeyPair:resolver:rejecter:)
  func generateKeyPair(_ label: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        // Generate P-256 key in Secure Enclave
        let accessControl = SecAccessControlCreateWithFlags(
          kCFAllocatorDefault,
          kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
          [.privateKeyUsage, .biometryAny],
          nil
        )!
        
        let attributes: [String: Any] = [
          kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
          kSecAttrKeySizeInBits as String: 256,
          kSecAttrTokenID as String: kSecAttrTokenIDSecureEnclave,
          kSecPrivateKeyAttrs as String: [
            kSecAttrIsPermanent as String: true,
            kSecAttrApplicationTag as String: label.data(using: .utf8)!,
            kSecAttrAccessControl as String: accessControl,
          ]
        ]
        
        var error: Unmanaged<CFError>?
        guard let privateKey = SecKeyCreateRandomKey(attributes as CFDictionary, &error) else {
          rejecter("KEYGEN_ERROR", "Failed to create key: \(error?.takeRetainedValue().localizedDescription ?? "unknown")", error?.takeRetainedValue())
          return
        }
        
        guard let publicKey = SecKeyCopyPublicKey(privateKey) else {
          rejecter("KEYGEN_ERROR", "Failed to extract public key", nil)
          return
        }
        
        // Export public key
        guard let publicKeyData = SecKeyCopyExternalRepresentation(publicKey, &error) as Data? else {
          rejecter("KEYGEN_ERROR", "Failed to export public key", error?.takeRetainedValue())
          return
        }
        
        let publicKeyBytes = publicKeyData.base64EncodedString()
        resolver(["publicKey": publicKeyBytes, "label": label])
      } catch {
        rejecter("KEYGEN_ERROR", error.localizedDescription, error)
      }
    })
  }
  
  // MARK: - Signing
  
  @objc(sign:withLabel:resolver:rejecter:)
  func sign(_ dataBase64: String, withLabel label: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      guard let data = Data(base64Encoded: dataBase64) else {
        rejecter("INVALID_INPUT", "Invalid base64 data", nil)
        return
      }
      
      // Retrieve private key
      let query: [String: Any] = [
        kSecClass as String: kSecClassKey,
        kSecAttrApplicationTag as String: label.data(using: .utf8)!,
        kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
        kSecReturnRef as String: true,
      ]
      
      var item: CFTypeRef?
      let status = SecItemCopyMatching(query as CFDictionary, &item)
      
      guard status == errSecSuccess, let privateKeyRef = item else {
        rejecter("KEY_NOT_FOUND", "Private key not found for label: \(label)", nil)
        return
      }
      
      let privateKey = privateKeyRef as! SecKey
      
      var error: Unmanaged<CFError>?
      guard let signature = SecKeyCreateSignature(
        privateKey,
        .ecdsaSignatureMessageX962SHA256,
        data as CFData,
        &error
      ) as Data? else {
        rejecter("SIGN_ERROR", "Failed to sign: \(error?.takeRetainedValue().localizedDescription ?? "unknown")", error?.takeRetainedValue())
        return
      }
      
      resolver(signature.base64EncodedString())
    })
  }
  
  // MARK: - Key Wrapping (ECDH + AES-GCM)
  
  @objc(wrapKey:recipientPubKey:withLabel:resolver:rejecter:)
  func wrapKey(_ symKeyBase64: String, recipientPubKey: String, withLabel label: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      guard let symKeyData = Data(base64Encoded: symKeyBase64) else {
        rejecter("INVALID_INPUT", "Invalid symmetric key", nil)
        return
      }
      
      guard let recipientPubKeyData = Data(base64Encoded: recipientPubKey) else {
        rejecter("INVALID_INPUT", "Invalid recipient public key", nil)
        return
      }
      
      // Create SecKey from recipient's public key
      let pubKeyAttributes: [String: Any] = [
        kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
        kSecAttrKeyClass as String: kSecAttrKeyClassPublic,
        kSecAttrKeySizeInBits as String: 256,
      ]
      
      var error: Unmanaged<CFError>?
      guard let recipientPubKeySec = SecKeyCreateWithData(recipientPubKeyData as CFData, pubKeyAttributes as CFDictionary, &error) else {
        rejecter("KEY_ERROR", "Failed to create recipient public key", error?.takeRetainedValue())
        return
      }
      
      // Retrieve our private key
      let query: [String: Any] = [
        kSecClass as String: kSecClassKey,
        kSecAttrApplicationTag as String: label.data(using: .utf8)!,
        kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
        kSecReturnRef as String: true,
      ]
      
      var item: CFTypeRef?
      let status = SecItemCopyMatching(query as CFDictionary, &item)
      
      guard status == errSecSuccess, let privateKeyRef = item else {
        rejecter("KEY_NOT_FOUND", "Private key not found", nil)
        return
      }
      
      let privateKey = privateKeyRef as! SecKey
      
      // Perform ECDH
      guard let sharedSecret = SecKeyCopyKeyExchangeResult(
        privateKey,
        .ecdhKeyExchangeStandard,
        recipientPubKeySec,
        [:] as CFDictionary,
        &error
      ) as Data? else {
        rejecter("ECDH_ERROR", "ECDH failed", error?.takeRetainedValue())
        return
      }
      
      // Derive AES key and encrypt
      let symmetricKey = SymmetricKey(data: SHA256.hash(data: sharedSecret))
      let nonce = AES.GCM.Nonce()
      let sealedBox = try! AES.GCM.seal(symKeyData, using: symmetricKey, nonce: nonce)
      
      resolver([
        "ciphertext": sealedBox.ciphertext.base64EncodedString(),
        "nonce": nonce.withUnsafeBytes { Data($0).base64EncodedString() },
        "tag": sealedBox.tag.base64EncodedString(),
      ])
    })
  }
  
  // MARK: - Key Unwrapping
  
  @objc(unwrapKey:nonce:tag:senderPubKey:withLabel:resolver:rejecter:)
  func unwrapKey(_ ciphertextBase64: String, nonce: String, tag: String, senderPubKey: String, withLabel label: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      guard let ciphertext = Data(base64Encoded: ciphertextBase64),
            let nonceData = Data(base64Encoded: nonce),
            let tagData = Data(base64Encoded: tag),
            let senderPubKeyData = Data(base64Encoded: senderPubKey) else {
        rejecter("INVALID_INPUT", "Invalid encrypted data", nil)
        return
      }
      
      // Create SecKey from sender's public key
      let pubKeyAttributes: [String: Any] = [
        kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
        kSecAttrKeyClass as String: kSecAttrKeyClassPublic,
        kSecAttrKeySizeInBits as String: 256,
      ]
      
      var error: Unmanaged<CFError>?
      guard let senderPubKeySec = SecKeyCreateWithData(senderPubKeyData as CFData, pubKeyAttributes as CFDictionary, &error) else {
        rejecter("KEY_ERROR", "Failed to create sender public key", error?.takeRetainedValue())
        return
      }
      
      // Retrieve our private key
      let query: [String: Any] = [
        kSecClass as String: kSecClassKey,
        kSecAttrApplicationTag as String: label.data(using: .utf8)!,
        kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
        kSecReturnRef as String: true,
      ]
      
      var item: CFTypeRef?
      let status = SecItemCopyMatching(query as CFDictionary, &item)
      
      guard status == errSecSuccess, let privateKeyRef = item else {
        rejecter("KEY_NOT_FOUND", "Private key not found", nil)
        return
      }
      
      let privateKey = privateKeyRef as! SecKey
      
      guard let sharedSecret = SecKeyCopyKeyExchangeResult(
        privateKey,
        .ecdhKeyExchangeStandard,
        senderPubKeySec,
        [:] as CFDictionary,
        &error
      ) as Data? else {
        rejecter("ECDH_ERROR", "ECDH failed", error?.takeRetainedValue())
        return
      }
      
      // Derive AES key and decrypt
      let symmetricKey = SymmetricKey(data: SHA256.hash(data: sharedSecret))
      let sealedBox = try! AES.GCM.SealedBox(
        nonce: try! AES.GCM.Nonce(data: nonceData),
        ciphertext: ciphertext,
        tag: tagData
      )
      
      do {
        let decrypted = try AES.GCM.open(sealedBox, using: symmetricKey)
        resolver(decrypted.base64EncodedString())
      } catch {
        rejecter("DECRYPT_ERROR", "Failed to decrypt: \(error.localizedDescription)", error)
      }
    })
  }
  
  // MARK: - Module Export
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}

