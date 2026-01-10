# Catchpoint PWA - Project Overview

## Vision

Catchpoint is an **offline-first Progressive Web App** for fishers to log their catches with minimal friction. The core experience is a single-tap capture that automatically records GPS location and weather conditions, allowing fishers to focus on fishing rather than fiddling with their phone.

## Core Principles

### 1. Offline-First
- **All features work without internet**
- IndexedDB is the source of truth
- Weather data syncs in background when online
- No "loading" spinners blocking the UI

### 2. Speed Over Features
- Quick Capture completes in <300ms (perceived)
- Optimistic UI everywhere
- Background processing for heavy operations
- Virtual scrolling for large lists

### 3. Mobile-First, Desktop-Enhanced
- Designed for one-handed phone use
- Touch-optimized interactions
- Responsive layout adapts to larger screens
- PWA installable on any device

### 4. Privacy-Respecting
- All data stays on device
- No account required
- No analytics tracking
- Export your data anytime (CSV)

## Technology Stack

| Layer | Technology | Why |
|-------|------------|-----|
| **Runtime** | Browser (PWA) | Cross-platform, no app store, instant updates |
| **Framework** | React 18 + Vite | Fast dev experience, modern React patterns |
| **Routing** | React Router v6 | Standard, well-documented |
| **State** | Zustand | Minimal boilerplate, great DevTools |
| **Database** | Dexie.js (IndexedDB) | Offline storage, good DX, reactive |
| **Maps** | Mapbox GL JS | Beautiful tiles, clustering, offline capable |
| **Charts** | Recharts | React-native charting, SSR-safe |
| **PWA** | Workbox | Industry standard, Vite plugin available |
| **Styling** | Vanilla CSS | No build complexity, CSS variables for theming |
| **Testing** | Vitest + Playwright | Fast unit tests, reliable E2E |

## Features

### Quick Capture (Home Screen)
- Large "FISH ON!" button
- Auto-captures: timestamp, GPS, weather
- Haptic feedback (if supported)
- Success animation (<300ms)
- Queues weather fetch if offline

### Catch Log
- Scrollable list of all catches
- Filter by date, species, weather
- Sort by date, weight, species
- Swipe or button actions for edit/delete
- Virtual scrolling for performance

### Map View
- All catches plotted on Mapbox map
- Clustering at low zoom levels
- Click marker to see catch details
- User location indicator
- Filter affects visible markers

### Statistics Dashboard
- Time range filter (7D, 30D, 1Y, All)
- Overview cards (total, avg weight, biggest, best day)
- Line chart: catches over time
- Pie chart: species distribution
- Bar chart: best fishing hours

### Settings
- Theme: Light / Dark / System
- Units: lbs/kg, in/cm
- Export to CSV
- Load test data (dev)
- Clear all data
- PWA install button
- Storage usage display

### Catch Detail / Edit
- View all catch properties
- Edit species, weight, length, notes
- Add/change photo
- View weather at time of catch
- Delete catch

## User Flows

### Primary Flow: Quick Capture
```
1. Open app (instant, cached)
2. Tap "FISH ON!" button
3. See success animation (haptic)
4. Continue fishing
   └── Background: save to IndexedDB, fetch weather
```

### Secondary Flow: Review & Edit
```
1. Navigate to Log tab
2. Scroll to find catch
3. Tap catch card
4. Edit details (species, weight, notes)
5. Save changes
```

### Tertiary Flow: Analyze
```
1. Navigate to Stats tab
2. Select time range
3. View charts and insights
4. Adjust filters as needed
```

## Data Model

```typescript
interface Catch {
  id: string;              // UUID
  timestamp: Date;         // When caught
  latitude: number;        // GPS lat
  longitude: number;       // GPS lon
  species?: string;        // Fish species
  weight?: number;         // In user's preferred unit (stored as lbs)
  length?: number;         // In user's preferred unit (stored as inches)
  photoUri?: string;       // Base64 or blob URL
  notes?: string;          // Free text
  weatherData?: {          // From OpenWeatherMap
    temp: number;
    description: string;
    icon: string;
    // ... more fields
  };
  pendingWeatherFetch: boolean;  // True if weather needs sync
  createdAt: Date;
  updatedAt: Date;
}

interface Settings {
  theme: 'light' | 'dark' | 'system';
  weightUnit: 'lbs' | 'kg';
  lengthUnit: 'in' | 'cm';
}
```

## External Dependencies

### APIs
- **OpenWeatherMap** (Current Weather 2.5) - Free tier, 60 calls/min
- **Mapbox** - Free tier generous for personal use

### Environment Variables
```
VITE_OPENWEATHERMAP_API_KEY=xxx
VITE_MAPBOX_ACCESS_TOKEN=pk.xxx
```

## Non-Goals (Explicitly Out of Scope)

- User accounts / cloud sync
- Social features / sharing
- Fish identification AI
- Fishing regulations database
- Tournament management
- Real-time weather alerts
- Multi-device sync

## Success Metrics

1. **Quick Capture < 300ms** (perceived completion)
2. **Lighthouse PWA score > 90**
3. **Works 100% offline** (except weather fetch)
4. **Zero runtime errors** in production
5. **< 500KB initial bundle** (gzipped)

## Related Specs

- `specs/quick-capture.md` - Capture flow details
- `specs/catch-log.md` - List view specs
- `specs/map-view.md` - Map integration
- `specs/statistics.md` - Charts and analytics
- `specs/settings.md` - Preferences and data management
- `specs/offline-sync.md` - PWA and sync architecture
