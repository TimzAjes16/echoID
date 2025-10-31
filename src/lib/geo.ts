import Geolocation from 'react-native-geolocation-service';
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
 */
export async function getLocationHash(): Promise<GeoHash> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude, timestamp} = position.coords;
        const timestampMs = timestamp || Date.now();

        // Hash coordinates + timestamp
        const geoString = `${latitude.toFixed(6)},${longitude.toFixed(6)},${timestampMs}`;
        const hash = sha3_256(geoString);

        resolve({
          hash,
          lat: latitude,
          lon: longitude,
          timestamp: timestampMs,
        });
      },
      error => {
        reject(new Error(`Location error: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      },
    );
  });
}
