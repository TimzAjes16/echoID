import * as Location from 'expo-location';
import {sha3_256} from 'js-sha3';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface GeoHash {
  hash: string;
  lat: number;
  lon: number;
  timestamp: number;
}

/**
 * Get current location and return hashed geo data
 * Uses expo-location for Expo Go compatibility
 */
export async function getLocationHash(): Promise<GeoHash> {
  try {
    // Request location permissions
    const {status} = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission not granted');
    }

    // Get current position
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      maximumAge: 10000,
    });

    const {latitude, longitude} = position.coords;
    const timestampMs = position.timestamp || Date.now();

    // Hash coordinates + timestamp
    const geoString = `${latitude.toFixed(6)},${longitude.toFixed(6)},${timestampMs}`;
    const hash = sha3_256(geoString);

    return {
      hash,
      lat: latitude,
      lon: longitude,
      timestamp: timestampMs,
    };
  } catch (error: any) {
    throw new Error(`Location error: ${error?.message || 'Failed to get location'}`);
  }
}
