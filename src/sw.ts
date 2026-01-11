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

// ============================================================================
// Mapbox Offline Tile Caching
// ============================================================================
// Mapbox GL JS loads resources from multiple domains:
// - api.mapbox.com: Styles, sprites, fonts (glyphs), and API requests
// - tiles.mapbox.com: Vector and raster tiles (with a/b/c/d subdomains)
//
// We use CacheFirst strategy for tiles and styles since map data changes
// infrequently and we want fast offline access to previously viewed areas.
// ============================================================================

// Cache Mapbox API resources (styles, sprites, fonts/glyphs)
// This includes:
// - Style JSON: api.mapbox.com/styles/v1/...
// - Sprites: api.mapbox.com/styles/v1/.../sprite...
// - Fonts/Glyphs: api.mapbox.com/fonts/v1/...
registerRoute(
  ({ url }) => url.origin === "https://api.mapbox.com",
  new CacheFirst({
    cacheName: "mapbox-api",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      }),
    ],
  }),
);

// Cache Mapbox vector/raster tiles from tiles.mapbox.com and subdomains
// Tiles are loaded from: a.tiles.mapbox.com, b.tiles.mapbox.com, etc.
// This is the most important cache for offline map functionality.
// Mapbox recommends max 6000 tiles for offline (we use 2000 to be safe).
registerRoute(
  ({ url }) =>
    url.hostname === "tiles.mapbox.com" ||
    url.hostname.match(/^[a-d]\.tiles\.mapbox\.com$/),
  new CacheFirst({
    cacheName: "mapbox-tiles",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 2000, // ~50-100MB depending on tile size
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days (tiles rarely change)
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
