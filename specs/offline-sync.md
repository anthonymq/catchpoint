# Offline Sync Specification

## Overview
Catchpoint is an offline-first Progressive Web App. All data persists locally in IndexedDB, 
with background synchronization for weather data when network is available.

## User Story
**As a** fisher  
**I want to** log catches without worrying about connectivity  
**So that** I can fish in remote areas and still track everything

## Architecture

### Data Flow
```
User Action → IndexedDB → Zustand Store → UI Update
                   ↓
             [When Online]
                   ↓
             Weather API → Update IndexedDB → Update Store → UI Update
```

### Storage Stack
- **Primary**: IndexedDB via Dexie.js (recommended wrapper)
- **State**: Zustand with persistence to localStorage
- **Service Worker**: Workbox for caching and background sync

## Requirements

### Offline Capabilities

| Feature | Offline Behavior |
|---------|------------------|
| Capture catch | Full functionality |
| View log | Full functionality |
| Edit catch | Full functionality |
| Delete catch | Full functionality |
| View map | Cached tiles only (limited) |
| View stats | Full functionality |
| Weather data | Queued for later |

### IndexedDB Schema

Using Dexie.js:

```typescript
import Dexie, { Table } from 'dexie';

interface Catch {
  id: string;
  timestamp: Date;
  latitude: number;
  longitude: number;
  species?: string;
  weight?: number;
  length?: number;
  photoUri?: string;
  notes?: string;
  weatherData?: object;
  pendingWeatherFetch: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class CatchpointDB extends Dexie {
  catches!: Table<Catch>;

  constructor() {
    super('catchpoint');
    this.version(1).stores({
      catches: 'id, timestamp, species, pendingWeatherFetch',
    });
  }
}

export const db = new CatchpointDB();
```

### Sync Queue

Catches with `pendingWeatherFetch: true` are queued for weather sync:

```typescript
interface SyncQueue {
  // Find all catches needing weather
  getPendingCatches(): Promise<Catch[]>;
  
  // Fetch and update weather for a catch
  syncWeather(catchId: string): Promise<void>;
  
  // Process entire queue
  processQueue(): Promise<SyncResult>;
}
```

### Network Detection

Use `navigator.onLine` and `online`/`offline` events:

```typescript
const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOnline;
};
```

On network restore: trigger sync queue processing.
Debounce rapid network changes (500ms).

### Sync Trigger Points

1. **Network restore** - Primary trigger, process full queue
2. **Page visibility** - Check queue on page focus
3. **Manual refresh** - Pull-to-refresh or refresh button
4. **Background Sync API** - If supported, register for background sync

## Service Worker Setup

Using Workbox:

```typescript
// sw.ts
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

// Precache app shell
precacheAndRoute(self.__WB_MANIFEST);

// Cache API responses
registerRoute(
  ({ url }) => url.origin === 'https://api.openweathermap.org',
  new NetworkFirst({
    cacheName: 'weather-api',
    networkTimeoutSeconds: 10,
  })
);

// Cache map tiles (Mapbox)
registerRoute(
  ({ url }) => url.origin === 'https://api.mapbox.com',
  new CacheFirst({
    cacheName: 'mapbox-tiles',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 500,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      }),
    ],
  })
);

// Background sync for weather
const bgSyncPlugin = new BackgroundSyncPlugin('weatherQueue', {
  maxRetentionTime: 24 * 60, // Retry for 24 hours
});
```

## Weather Sync Flow

```
1. Check network status
2. If offline → exit (queue preserved)
3. Fetch pending catches from IndexedDB
4. For each catch:
   a. Fetch weather from OpenWeatherMap
   b. Update catch.weatherData
   c. Set pendingWeatherFetch = false
   d. Handle errors (retry later)
5. Update Zustand store
6. UI reflects changes reactively
```

### Rate Limiting

OpenWeatherMap free tier: 60 calls/minute
- Batch weather fetches with 1 second delay between
- Priority: newest catches first
- Skip catches older than 5 days (historical data unavailable on free tier)

### Error Handling

| Error | Behavior |
|-------|----------|
| Network error | Keep in queue, retry later |
| API rate limit | Pause 60 seconds, resume |
| Invalid location | Mark weather unavailable |
| API key missing | Log error, skip weather feature |
| IndexedDB quota exceeded | Warn user, attempt cleanup |

## PWA Manifest

```json
{
  "name": "Catchpoint - Fishing Log",
  "short_name": "Catchpoint",
  "description": "Offline-first fishing log with GPS and weather tracking",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a1a2e",
  "theme_color": "#0f3460",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

## Storage Considerations

### IndexedDB Quotas
- Modern browsers: ~50% of available disk space (varies)
- Safari: More restrictive, ~1GB
- Use `navigator.storage.estimate()` to check

### Photo Storage
- Store photos as Blobs in IndexedDB
- Consider compressing before storage
- Implement cleanup for old photos if space is low

```typescript
const checkStorageQuota = async () => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const { usage, quota } = await navigator.storage.estimate();
    const percentUsed = (usage / quota) * 100;
    console.log(`Using ${percentUsed.toFixed(2)}% of available storage`);
    return { usage, quota, percentUsed };
  }
  return null;
};
```

## Acceptance Criteria

- [ ] All CRUD operations work offline
- [ ] Catches queue for weather sync when offline
- [ ] Sync triggers automatically on network restore
- [ ] Sync status visible to user (optional indicator)
- [ ] Rate limiting prevents API abuse
- [ ] Failed syncs retry automatically
- [ ] Old catches (>5 days) handled gracefully
- [ ] Service Worker caches app shell
- [ ] PWA installable on supported browsers
- [ ] Storage quota warnings shown when low

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| IndexedDB | ✅ | ✅ | ✅ | ✅ |
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| Background Sync | ✅ | ❌ | ❌ | ✅ |
| Web Share API | ✅ | ❌ | ✅ | ✅ |
| Geolocation | ✅ | ✅ | ✅ | ✅ |

Provide graceful fallbacks for unsupported features.

## Related Specs
- `quick-capture.md` - How captures initiate sync queue
- `settings.md` - Sync preferences
