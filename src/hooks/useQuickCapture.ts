import { useState, useCallback } from "react";
import { useCatchStore } from "../stores/catchStore";
import { getCurrentLocation } from "../services/location";
import { syncService } from "../services/sync";

export const useQuickCapture = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const addCatch = useCatchStore((state) => state.addCatch);

  const triggerHaptic = () => {
    if ("vibrate" in navigator) {
      navigator.vibrate(50); // 50ms pulse
    }
  };

  const capture = useCallback(async () => {
    // 1. Immediate UI feedback handled by caller (animations) or here if we expose state
    // We expose isCapturing for some UI states, but the button should animate on click instantly.
    setIsCapturing(true);
    triggerHaptic();

    try {
      // 2. Get location (this might take a few seconds, but UI shows success)
      // Note: In a real "fire and forget" scenario, we might want to not await this
      // before returning control, but we need the location for the catch object.
      // Ideally, we'd fire this off and let it run.
      // For now, following spec: await location.
      const location = await getCurrentLocation();

      // 3. Create Catch Object
      const newCatch = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        latitude: location.latitude,
        longitude: location.longitude,
        pendingWeatherFetch: true,
        // Optional fields defaults
        species: undefined,
        weight: undefined,
        length: undefined,
        photoUri: undefined,
        notes: undefined,
        weatherData: undefined,
      };

      // 4. Optimistic Save (Store updates immediately, DB in background)
      await addCatch(newCatch);

      // 5. Trigger weather sync if online (don't await - let it run in background)
      if (navigator.onLine) {
        syncService.processWeatherQueue();
      }
    } catch (error) {
      console.error("Capture failed:", error);
      // In a real app, we might want to surface this error to the user if it was a critical failure
      // but "Quick Capture" implies resilience.
    } finally {
      setIsCapturing(false);
    }
  }, [addCatch]);

  return {
    capture,
    isCapturing,
  };
};
