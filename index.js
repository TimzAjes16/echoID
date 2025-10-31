/**
 * @format
 */

import { enableScreens } from 'react-native-screens';
enableScreens();

import { Buffer } from 'buffer';
global.Buffer = Buffer;

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
