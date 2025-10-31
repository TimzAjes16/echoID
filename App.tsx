import React, {useEffect, useState} from 'react';
import {StatusBar, StyleSheet, useColorScheme} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import * as Keychain from 'react-native-keychain';

import {Onboarding} from './src/screens/Onboarding';
import {Vault} from './src/screens/Vault';
import {NewConsentWizard} from './src/screens/NewConsentWizard';
import {ConsentDetail} from './src/screens/ConsentDetail';
import {Profile} from './src/screens/Profile';
import {useConsentStore} from './src/state/useConsentStore';
import {fetchConfig} from './src/lib/config';
import {parseDeepLink} from './src/lib/handles';
import {Linking} from 'react-native';

export type RootStackParamList = {
  Onboarding: undefined;
  Vault: undefined;
  NewConsent: undefined;
  ConsentDetail: {consentId: string};
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [isOnboarding, setIsOnboarding] = useState<boolean | null>(null);
  const {setProtocolFee, setSelectedChain} = useConsentStore();

  useEffect(() => {
    initializeApp();
    setupDeepLinking();
  }, []);

  const setupDeepLinking = () => {
    // Handle deep links when app is already running
    Linking.addEventListener('url', handleDeepLink);

    // Handle deep links when app is opened from closed state
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({url});
      }
    });

    return () => {
      Linking.removeAllListeners('url');
    };
  };

  const handleDeepLink = ({url}: {url: string}) => {
    const parsed = parseDeepLink(url);
    if (!parsed) return;

    // Navigate based on deep link type
    // This will be handled in the navigation setup
    console.log('Deep link received:', parsed);
  };

  const initializeApp = async () => {
    try {
      // Fetch remote config
      const config = await fetchConfig();
      setProtocolFee(config.protocolFeeWei);
      setSelectedChain(config.defaultChainId);

      // Check if onboarding is complete
      const deviceKey = await Keychain.getGenericPassword({service: 'echoid-device'});
      setIsOnboarding(!deviceKey);
    } catch (error) {
      console.error('App initialization error:', error);
      setIsOnboarding(true);
    }
  };

  if (isOnboarding === null) {
    return null; // Or show a loading screen
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              contentStyle: {backgroundColor: '#F2F2F7'},
            }}>
            {isOnboarding ? (
              <Stack.Screen name="Onboarding">
                {() => <Onboarding onComplete={() => setIsOnboarding(false)} />}
              </Stack.Screen>
            ) : (
              <>
                <Stack.Screen name="Vault">
                  {({navigation}) => (
                    <Vault
                      onConsentPress={(consentId) =>
                        navigation.navigate('ConsentDetail', {consentId})
                      }
                      onCreateNew={() => navigation.navigate('NewConsent')}
                      onProfilePress={() => navigation.navigate('Profile')}
                    />
                  )}
                </Stack.Screen>
                <Stack.Screen name="NewConsent">
                  {({navigation}) => (
                    <NewConsentWizard onComplete={() => navigation.navigate('Vault')} />
                  )}
                </Stack.Screen>
                <Stack.Screen name="ConsentDetail">
                  {({route, navigation}) => (
                    <ConsentDetail
                      consentId={route.params.consentId}
                      onBack={() => navigation.goBack()}
                    />
                  )}
                </Stack.Screen>
                <Stack.Screen name="Profile">
                  {({navigation}) => (
                    <Profile onBack={() => navigation.goBack()} />
                  )}
                </Stack.Screen>
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;