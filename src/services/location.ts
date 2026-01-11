export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

const STORAGE_KEY = "catchpoint_last_location";

/**
 * Persist location to localStorage for offline fallback
 */
const cacheLocation = (coords: LocationCoords) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coords));
  } catch (e) {
    console.error("Failed to cache location", e);
  }
};

/**
 * Retrieve cached location from localStorage
 */
const getCachedLocation = (): LocationCoords | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

/**
 * Get current location with fallback strategy:
 * 1. Try fresh GPS (8s timeout)
 * 2. Fallback to localStorage cache
 * 3. Return (0,0) as last resort
 */
export const getCurrentLocation = async (): Promise<LocationCoords> => {
  // 1. Try fresh GPS
  try {
    const position = await new Promise<GeolocationPosition>(
      (resolve, reject) => {
        if (!("geolocation" in navigator)) {
          reject(new Error("Geolocation not supported"));
          return;
        }

        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 60000, // Accept cached position up to 1 min old
        });
      },
    );

    const coords: LocationCoords = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    };

    cacheLocation(coords);
    return coords;
  } catch (error) {
    console.warn("GPS fetch failed, trying cache...", error);

    // 2. Fallback to cache
    const cached = getCachedLocation();
    if (cached) {
      return cached;
    }

    // 3. Last resort
    console.warn("No cached location available, using (0,0)");
    return {
      latitude: 0,
      longitude: 0,
      accuracy: 0,
      timestamp: Date.now(),
    };
  }
};
