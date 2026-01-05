import * as Location from 'expo-location';
import { LocationAccuracy, LocationObject } from 'expo-location';

export interface CatchLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

export interface LocationPermission {
  granted: boolean;
  status: Location.PermissionStatus;
}

// Request location permissions
export async function requestLocationPermission(): Promise<LocationPermission> {
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  
  return {
    granted: foregroundStatus === 'granted',
    status: foregroundStatus,
  };
}

// Get current location with high accuracy
export async function getCurrentLocation(): Promise<CatchLocation> {
  const { granted } = await requestLocationPermission();
  
  if (!granted) {
    throw new Error('Location permission not granted');
  }

  const location: LocationObject = await Location.getCurrentPositionAsync({
    accuracy: LocationAccuracy.Highest,
  });

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy ?? undefined,
    timestamp: location.timestamp,
  };
}

// Check if location services are enabled
export async function isLocationServicesEnabled(): Promise<boolean> {
  return await Location.hasServicesEnabledAsync();
}

// Get cached location (more battery-efficient, may be stale)
export async function getCachedLocation(): Promise<CatchLocation | null> {
  const { granted } = await requestLocationPermission();
  
  if (!granted) {
    return null;
  }

  const lastKnownLocation = await Location.getLastKnownPositionAsync();

  if (!lastKnownLocation) {
    return null;
  }

  return {
    latitude: lastKnownLocation.coords.latitude,
    longitude: lastKnownLocation.coords.longitude,
    accuracy: lastKnownLocation.coords.accuracy ?? undefined,
    timestamp: lastKnownLocation.timestamp,
  };
}
