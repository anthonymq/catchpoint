import { useState, useCallback } from "react";
import { useCatchStore } from "../stores/catchStore";
import {
  getCachedLocation,
  refreshLocationForCatch,
} from "../services/location";
import { syncService } from "../services/sync";

/**
 * Quick Capture Hook - Implements truly fire-and-forget capture.
 *
 * Spec requirement: Success animation must show within 300ms of tap.
 * Solution: Use cached location (instant), fire GPS refresh in background.
 */
export const useQuickCapture = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const addCatch = useCatchStore((state) => state.addCatch);

  const triggerHaptic = () => {
    if ("vibrate" in navigator) {
      navigator.vibrate(50); // 50ms pulse
    }
  };

  const capture = useCallback(async () => {
    // 1. INSTANT UI feedback
    setIsCapturing(true);
    triggerHaptic();

    try {
      // 2. Get cached location (instant, synchronous read from localStorage)
      // This never blocks - returns null if no cache or cache expired
      const cachedLocation = getCachedLocation();

      // 3. Determine if we need a background GPS refresh
      const needsLocationRefresh = !cachedLocation;

      // 4. Create Catch Object with cached/default coords
      const newCatch = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        latitude: cachedLocation?.latitude ?? 0,
        longitude: cachedLocation?.longitude ?? 0,
        pendingWeatherFetch: true,
        pendingLocationRefresh: needsLocationRefresh,
        syncStatus: "pending" as const,
        // Optional fields defaults
        species: undefined,
        weight: undefined,
        length: undefined,
        photoUri: undefined,
        notes: undefined,
        weatherData: undefined,
      };

      // 5. Save immediately (optimistic UI in store)
      await addCatch(newCatch);

      // 6. SUCCESS! User sees success within ~50-100ms
      setIsCapturing(false);

      // 7. Background: Refresh GPS and update catch if better coords obtained
      // This is fire-and-forget - don't await
      if (needsLocationRefresh) {
        refreshLocationForCatch(newCatch.id);
      }

      // 8. Background: Fetch weather (fire-and-forget)
      if (navigator.onLine) {
        syncService.processWeatherQueue();
      }
    } catch (error) {
      console.error("[QuickCapture] Capture failed:", error);
      setIsCapturing(false);
      // In a production app, we might surface this error to the user
      // For Quick Capture, we prioritize resilience over error reporting
    }
  }, [addCatch]);

  return {
    capture,
    isCapturing,
  };
};
