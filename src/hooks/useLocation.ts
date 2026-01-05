import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';

export type LocationPermissionStatus = 'granted' | 'denied' | 'undetermined';

interface UseLocationPermissionResult {
  permission: LocationPermissionStatus;
  requestPermission: () => Promise<boolean>;
  canAskAgain: boolean;
}

export function useLocationPermission(): UseLocationPermissionResult {
  const [permission, setPermission] = useState<LocationPermissionStatus>('undetermined');
  const [canAskAgain, setCanAskAgain] = useState(true);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const { status, canAskAgain: canAsk } = await Location.requestForegroundPermissionsAsync();
    
    setCanAskAgain(canAsk);

    if (status === 'granted') {
      setPermission('granted');
      return true;
    } else if (status === 'denied') {
      setPermission('denied');
      return false;
    }
    
    setPermission('undetermined');
    return false;
  }, []);

  useEffect(() => {
    let mounted = true;

    const checkPermission = async () => {
      const { status, canAskAgain: canAsk } = await Location.getForegroundPermissionsAsync();
      
      if (!mounted) return;

      setCanAskAgain(canAsk);

      if (status === 'granted') {
        setPermission('granted');
      } else if (status === 'denied') {
        setPermission('denied');
      } else {
        setPermission('undetermined');
      }
    };

    checkPermission();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    permission,
    requestPermission,
    canAskAgain,
  };
}

interface UseLocationResult {
  location: Location.LocationObject | null;
  loading: boolean;
  error: string | null;
  permission: LocationPermissionStatus;
  canAskAgain: boolean;
  getCurrentLocation: () => Promise<Location.LocationObject | null>;
  requestPermission: () => Promise<boolean>;
}

export function useLocation(): UseLocationResult {
  const { permission, requestPermission, canAskAgain } = useLocationPermission();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = useCallback(async (): Promise<Location.LocationObject | null> => {
    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) {
        setError('Location permission denied');
        return null;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      setLocation(currentLocation);
      return currentLocation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
      return null;
    } finally {
      setLoading(false);
    }
  }, [permission, requestPermission]);

  return {
    location,
    loading,
    error,
    permission,
    canAskAgain,
    getCurrentLocation,
    requestPermission,
  };
}
