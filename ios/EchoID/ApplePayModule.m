#import <React/RCTBridgeModule.h>
#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(ApplePayModule, NSObject)

RCT_EXTERN_METHOD(requestPayment:(NSString *)description
                  amount:(NSString *)amount
                  currency:(NSString *)currency
                  resolver:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

@end

