#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(SecureEnclaveModule, NSObject)

RCT_EXTERN_METHOD(generateKeyPair:(NSString *)label
                  resolver:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)

RCT_EXTERN_METHOD(sign:(NSString *)dataBase64
                  withLabel:(NSString *)label
                  resolver:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)

RCT_EXTERN_METHOD(wrapKey:(NSString *)symKeyBase64
                  recipientPubKey:(NSString *)recipientPubKey
                  withLabel:(NSString *)label
                  resolver:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)

RCT_EXTERN_METHOD(unwrapKey:(NSString *)ciphertextBase64
                  nonce:(NSString *)nonce
                  tag:(NSString *)tag
                  senderPubKey:(NSString *)senderPubKey
                  withLabel:(NSString *)label
                  resolver:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
