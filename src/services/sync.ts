// Background sync service for weather data
// Fetches weather for catches that were created offline

import { useCatchStore } from '../stores/catchStore';
import { fetchWeather, fetchHistoricalWeather, isWeatherConfigured } from './weather';
import { checkNetworkStatus } from '../hooks/useNetworkStatus';

// Track if sync is currently in progress to prevent duplicate runs
let isSyncing = false;

/**
 * Sync pending weather data for catches that were created offline.
 * Uses historical weather API when the catch was created more than a few minutes ago.
 */
export async function syncPendingWeather(): Promise<void> {
  // Prevent concurrent syncs
  if (isSyncing) {
    console.log('[Sync] Sync already in progress, skipping...');
    return;
  }

  // Check if weather API is configured
  if (!isWeatherConfigured()) {
    console.log('[Sync] Weather API not configured, skipping sync');
    return;
  }

  // Check network status
  const networkState = await checkNetworkStatus();
  if (networkState.status !== 'online') {
    console.log('[Sync] Device is offline, skipping sync');
    return;
  }

  isSyncing = true;
  console.log('[Sync] Starting weather sync...');

  try {
    const store = useCatchStore.getState();
    const pendingCatches = await store.getPendingWeatherFetches();

    if (pendingCatches.length === 0) {
      console.log('[Sync] No pending weather fetches');
      return;
    }

    console.log(`[Sync] Found ${pendingCatches.length} catches pending weather fetch`);

    // Process catches sequentially to avoid rate limiting
    for (const catchItem of pendingCatches) {
      try {
        const now = new Date();
        const catchTime = catchItem.createdAt;
        const timeDiffMs = now.getTime() - catchTime.getTime();
        const timeDiffMinutes = timeDiffMs / (1000 * 60);

        let weather;
        
        // If catch was created more than 5 minutes ago, use historical API
        if (timeDiffMinutes > 5) {
          console.log(`[Sync] Using historical weather for catch ${catchItem.id} (${Math.round(timeDiffMinutes)} min ago)`);
          weather = await fetchHistoricalWeather(
            catchItem.latitude,
            catchItem.longitude,
            catchTime
          );
        } else {
          console.log(`[Sync] Using current weather for catch ${catchItem.id}`);
          weather = await fetchWeather(catchItem.latitude, catchItem.longitude);
        }

        // Update the catch with weather data
        await store.markWeatherFetched(catchItem.id, {
          temperature: weather.temperature,
          temperatureUnit: weather.temperatureUnit,
          weatherCondition: weather.weatherCondition,
          pressure: weather.pressure,
          pressureUnit: weather.pressureUnit,
          humidity: weather.humidity,
          windSpeed: weather.windSpeed,
          weatherFetchedAt: weather.fetchedAt,
        });

        console.log(`[Sync] Weather fetched for catch ${catchItem.id}`);

        // Small delay between API calls to avoid rate limiting
        await delay(500);
      } catch (error) {
        console.error(`[Sync] Failed to fetch weather for catch ${catchItem.id}:`, error);
        // Continue with next catch even if one fails
      }
    }

    console.log('[Sync] Weather sync completed');
  } finally {
    isSyncing = false;
  }
}

/**
 * Utility function to create a delay
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if a sync is currently in progress
 */
export function isSyncInProgress(): boolean {
  return isSyncing;
}
