import { db } from "../db";
import { fetchWeather } from "./weather";
import { useCatchStore } from "../stores/catchStore";

interface SyncResult {
  processed: number;
  failed: number;
  errors: string[];
}

export const syncService = {
  /**
   * Check if there are any catches pending weather sync
   */
  async getPendingCount(): Promise<number> {
    return await db.catches.filter((c) => c.pendingWeatherFetch).count();
  },

  /**
   * Process the weather queue
   * Fetches weather for all catches marked with pendingWeatherFetch
   * Skips catches that are still waiting for location refresh (to avoid fetching weather for wrong coords)
   */
  async processWeatherQueue(): Promise<SyncResult> {
    const result: SyncResult = { processed: 0, failed: 0, errors: [] };

    // Find all catches needing weather
    // Skip catches with pendingLocationRefresh=true (wait for valid coords)
    // Skip catches with (0,0) coordinates (invalid fallback location)
    // Sort by newest first to prioritize recent catches (better chance of current weather match)
    const pendingCatches = await db.catches
      .filter((c) => {
        // Must need weather fetch
        if (!c.pendingWeatherFetch) return false;
        // Skip if location refresh is pending (coords may be invalid)
        if (c.pendingLocationRefresh) return false;
        // Skip if coords are (0,0) - this is the fallback when no location available
        if (c.latitude === 0 && c.longitude === 0) return false;
        return true;
      })
      .reverse()
      .toArray();

    if (pendingCatches.length === 0) {
      return result;
    }

    console.log(
      `[Sync] Processing ${pendingCatches.length} catches for weather data...`,
    );

    for (const catchItem of pendingCatches) {
      try {
        // Rate limiting: simple 1s delay to be nice to the API
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const weather = await fetchWeather(
          catchItem.latitude,
          catchItem.longitude,
          catchItem.timestamp,
        );

        // Update DB
        await db.catches.update(catchItem.id, {
          weatherData: weather,
          pendingWeatherFetch: false,
          updatedAt: new Date(), // Update timestamp
        });

        // Update Store (if active)
        useCatchStore.getState().updateCatch(catchItem.id, {
          weatherData: weather,
          pendingWeatherFetch: false,
        });

        result.processed++;
        console.log(
          `[Sync] Weather synced for catch ${catchItem.id.slice(0, 8)}`,
        );
      } catch (error) {
        result.failed++;
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        result.errors.push(`Catch ${catchItem.id}: ${errorMessage}`);
        console.error(
          `[Sync] Failed to sync weather for catch ${catchItem.id}:`,
          error,
        );
      }
    }

    return result;
  },
};
