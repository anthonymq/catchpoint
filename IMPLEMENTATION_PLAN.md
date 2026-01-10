# Implementation Plan - Catchpoint PWA Rewrite

> **Status**: Fresh Start (Phase 1 Ready)
> **Goal**: Replace existing React Native app with an offline-first PWA.

## Phase 1: Demolition & Rescue (Day 1)
- [x] **Rescue Assets**: Back up reusable logic to `_rescue/` directory
  - `src/data/species.ts` (Species database)
  - `src/data/testCatches.ts` (Test data)
  - `src/utils/moonPhase.ts` (Moon phase logic)
  - `src/utils/statistics.ts` (Statistics logic - **Update**: Adapt to new `Catch` interface)
  - `src/services/weather.ts` (Weather API logic - **Update**: Remove `expo-network`, use `fetch`)
  - `src/services/export.ts` (CSV formatting only - **Update**: Remove `expo-sharing`)
  - `src/theme/colors.ts` (Color palette)
- [ ] **Nuke Old Codebase**: Remove all Expo/React Native files
  - Directories: `src/`, `e2e/`, `android/`, `ios/`, `app/`, `assets/`, `drizzle/`
  - Configs: `package.json`, `package-lock.json`, `tsconfig.json`, `babel.config.js`, `app.json`, `metro.config.js`, `expo-env.d.ts`
- [ ] **Clean Git**: Ensure working directory is clean before starting fresh

## Phase 2: Foundation (Day 1)
- [ ] **Initialize Vite Project**: React + TypeScript + SWC
  - Command: `npm create vite@latest catchpoint -- --template react-swc-ts`
  - Move files to root (careful with `_rescue/`)
- [ ] **Install Core Dependencies**
  - Production: `react-router-dom`, `zustand`, `dexie`, `mapbox-gl`, `react-map-gl`, `date-fns`, `lucide-react`, `recharts`, `clsx`, `suncalc`
  - PWA: `vite-plugin-pwa`, `workbox-window`, `workbox-precaching`, `workbox-routing`, `workbox-strategies`, `workbox-background-sync`
- [ ] **Install Dev Dependencies**
  - Testing: `vitest`, `jsdom`, `@testing-library/react`, `@playwright/test`
  - Linting: `eslint`, `prettier`
  - Types: `@types/mapbox-gl`, `@types/node`, `@types/suncalc`
- [ ] **Project Configuration**
  - `vite.config.ts` (Paths, PWA plugin, Environment variables)
  - `tsconfig.json` (Strict mode, path aliases `@/*`)
  - `playwright.config.ts` (Mobile viewports)
  - `.env` template (VITE_OPENWEATHERMAP_API_KEY, VITE_MAPBOX_ACCESS_TOKEN)

## Phase 3: Core Infrastructure (Day 1-2)
- [ ] **Database Layer (Dexie)**
  - `src/db/index.ts`: Schema definition (Catches table)
  - `src/db/repository.ts`: Typed CRUD operations
- [ ] **State Management (Zustand)**
  - `src/stores/catchStore.ts`: Store for catches (synced with DB)
  - `src/stores/settingsStore.ts`: User preferences (persisted)
- [ ] **Routing & Layout**
  - `src/App.tsx`: React Router setup
  - `src/components/Layout.tsx`: Shell with BottomNav
  - `src/components/BottomNav.tsx`: Navigation (Home, Log, Map, Stats)
- [ ] **Global Styles**
  - `src/styles/index.css`: CSS Variables (Theming), Reset, Typography
- [ ] **Hooks**
  - `src/hooks/useNetworkStatus.ts`: Implement using `window.navigator.onLine` and events

## Phase 4: Primary Features (Day 2-3)
- [ ] **Quick Capture (Home)**
  - `src/pages/Home.tsx`: Hero button
  - `src/services/location.ts`: Implement using Geolocation API
  - `src/hooks/useQuickCapture.ts`: Optimistic capture logic
  - Animation & Haptics integration (via `navigator.vibrate`)
- [ ] **Catch Log (List)**
  - `src/pages/Log.tsx`: Virtualized list of catches
  - `src/components/CatchCard.tsx`: Display component
  - Swipe-to-delete/edit interactions
- [ ] **Catch Detail / Edit**
  - `src/pages/CatchDetail.tsx`: Form for editing
  - Photo upload handling (Blob storage / `indexedDB`)
  - Species autocomplete (using rescued `species.ts`)

## Phase 5: Secondary Features (Day 3-4)
- [ ] **Map View**
  - `src/pages/Map.tsx`: Mapbox GL integration
  - Clustering & Marker rendering
  - Filter integration
- [ ] **Statistics**
  - `src/pages/Stats.tsx`: Dashboard layout
  - `src/utils/statistics.ts`: Update to match new `Catch` type
  - Charts (Line, Pie, Bar) integration
- [ ] **Settings**
  - `src/pages/Settings.tsx`: Preferences form
  - Theme switcher logic
  - Data export (CSV) - Implement using `Blob` download

## Phase 6: PWA & Polish (Day 4)
- [ ] **Service Worker**
  - Background sync for weather (Workbox BackgroundSync)
  - Offline caching (App shell, Map tiles)
- [ ] **Weather Service**
  - `src/services/weather.ts`: Integration with new logic
  - Sync queue processing
- [ ] **Manifest & Icons**
  - Generate and configure `manifest.json`
  - Add icons to `public/icons/`

## Phase 7: Verification (Day 5)
- [ ] **E2E Tests**
  - `e2e/capture.spec.ts`: Full capture flow
  - `e2e/offline.spec.ts`: Offline functionality
- [ ] **Unit Tests**
  - Utilities and Hooks
- [ ] **Lint & Build Check**
  - Ensure clean build

## Discovered Issues / Notes
- [ ] **Mapbox Offline**: Check limits for offline tile caching (typically 6000 tiles).
- [ ] **Safari Support**: Background Sync API not supported; ensure fallback to foreground sync on network restore works reliably.
- [ ] **Storage Quota**: Monitor usage as photos are stored in IndexedDB.
