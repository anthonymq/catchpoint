/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { clientsClaim } from "workbox-core";
import { registerRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
// import { BackgroundSyncPlugin } from "workbox-background-sync";

declare let self: ServiceWorkerGlobalScope;

// Cleanup old caches
cleanupOutdatedCaches();

// Take control immediately
self.skipWaiting();
clientsClaim();

// Precache app shell
precacheAndRoute(self.__WB_MANIFEST);

// Cache API responses (OpenWeatherMap)
registerRoute(
  ({ url }) => url.origin === "https://api.openweathermap.org",
  new NetworkFirst({
    cacheName: "weather-api",
    networkTimeoutSeconds: 10,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      }),
    ],
  }),
);

// Cache Mapbox tiles
registerRoute(
  ({ url }) => url.origin === "https://api.mapbox.com",
  new CacheFirst({
    cacheName: "mapbox-tiles",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 500,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      }),
    ],
  }),
);

// Background sync for weather
// Note: This registers a sync event that fires when connectivity returns
// const bgSyncPlugin = new BackgroundSyncPlugin("weatherQueue", {
//   maxRetentionTime: 24 * 60, // Retry for 24 hours (in minutes)
// });

// We don't have a specific API endpoint to retry for weather syncing via BackgroundSyncPlugin
// because our sync logic is complex (read DB -> fetch -> update DB).
// Workbox Background Sync is mostly for replaying failed fetch requests.
//
// However, we can use the 'sync' event listener manually if we wanted,
// but since our app logic handles queue processing on 'online' event,
// we rely primarily on that in the foreground.
//
// The BackgroundSyncPlugin is useful if we were sending POST requests to a server.
// Here we are just fetching data.
//
// For now, we rely on the foreground 'online' listener in App.tsx.
// But we keep the SW ready for asset caching.
