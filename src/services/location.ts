import { catchRepository } from "../db/repository";

export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

const STORAGE_KEY = "catchpoint_last_location";
const CACHE_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

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
 * Returns null if no cache or cache is older than 5 minutes
 */
export const getCachedLocation = (): LocationCoords | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const coords: LocationCoords = JSON.parse(stored);

    // Check if cache is still fresh (within 5 minutes)
    if (Date.now() - coords.timestamp > CACHE_MAX_AGE_MS) {
      return null;
    }

    return coords;
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

/**
 * Background function to refresh GPS and update an existing catch.
 * Fire-and-forget: call this after quick capture to improve location accuracy.
 * Updates the catch in the database if a better location is obtained.
 */
export const refreshLocationForCatch = async (
  catchId: string,
): Promise<void> => {
  try {
    // Only fetch fresh GPS, don't use cache
    const position = await new Promise<GeolocationPosition>(
      (resolve, reject) => {
        if (!("geolocation" in navigator)) {
          reject(new Error("Geolocation not supported"));
          return;
        }

        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 0, // Force fresh position
        });
      },
    );

    const coords: LocationCoords = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    };

    // Cache the fresh location for future quick captures
    cacheLocation(coords);

    // Update the catch with fresh location
    await catchRepository.update(catchId, {
      latitude: coords.latitude,
      longitude: coords.longitude,
      pendingLocationRefresh: false,
    });

    console.log("[Location] Refreshed location for catch", catchId);
  } catch (error) {
    console.warn("[Location] Background GPS refresh failed:", error);
    // Mark as no longer pending even if refresh failed (we tried)
    try {
      await catchRepository.update(catchId, {
        pendingLocationRefresh: false,
      });
    } catch {
      // Ignore update errors - catch may have been deleted
    }
  }
};
