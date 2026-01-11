# Implementation Plan - Catchpoint PWA Rewrite

> **Status**: 🚧 IN PROGRESS
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
- [x] **Nuke Old Codebase**: Remove all Expo/React Native files
  - Directories: `src/`, `e2e/`, `android/`, `ios/`, `app/`, `assets/`, `drizzle/`
  - Configs: `package.json`, `package-lock.json`, `tsconfig.json`, `babel.config.js`, `app.json`, `metro.config.js`, `expo-env.d.ts`
- [x] **Clean Git**: Ensure working directory is clean before starting fresh

## Phase 2: Foundation (Day 1)

- [x] **Initialize Vite Project**: React + TypeScript + SWC
  - Command: `npm create vite@latest catchpoint -- --template react-swc-ts`
  - Move files to root (careful with `_rescue/`)
- [x] **Install Core Dependencies**
  - Production: `react-router-dom`, `zustand`, `dexie`, `mapbox-gl`, `react-map-gl`, `date-fns`, `lucide-react`, `recharts`, `clsx`, `suncalc`
  - PWA: `vite-plugin-pwa`, `workbox-window`, `workbox-precaching`, `workbox-routing`, `workbox-strategies`, `workbox-background-sync`
- [x] **Install Dev Dependencies**
  - Testing: `vitest`, `jsdom`, `@testing-library/react`, `@playwright/test`
  - Linting: `eslint`, `prettier`
  - Types: `@types/mapbox-gl`, `@types/node`, `@types/suncalc`
- [x] **Project Configuration**
  - `vite.config.ts` (Paths, PWA plugin, Environment variables)
  - `tsconfig.json` (Strict mode, path aliases `@/*`)
  - `playwright.config.ts` (Mobile viewports)
  - `.env` template (VITE_OPENWEATHERMAP_API_KEY, VITE_MAPBOX_ACCESS_TOKEN)

## Phase 3: Core Infrastructure (Day 1-2)

- [x] **Database Layer (Dexie)**
  - `src/db/index.ts`: Schema definition (Catches table)
  - `src/db/repository.ts`: Typed CRUD operations
- [x] **State Management (Zustand)**
  - `src/stores/catchStore.ts`: Store for catches (synced with DB)
  - `src/stores/settingsStore.ts`: User preferences (persisted)
- [x] **Routing & Layout**
  - `src/App.tsx`: React Router setup
  - `src/components/Layout.tsx`: Shell with BottomNav
  - `src/components/BottomNav.tsx`: Navigation (Home, Log, Map, Stats)
- [x] **Global Styles**
  - `src/styles/index.css`: CSS Variables (Theming), Reset, Typography
- [x] **Hooks**
  - `src/hooks/useNetworkStatus.ts`: Implement using `window.navigator.onLine` and events

## Phase 4: Primary Features (Day 2-3)

- [x] **Quick Capture (Home)**
  - `src/pages/Home.tsx`: Hero button
  - `src/services/location.ts`: Implement using Geolocation API
  - `src/hooks/useQuickCapture.ts`: Optimistic capture logic
  - Animation & Haptics integration (via `navigator.vibrate`)
- [x] **Catch Log (List)**
  - `src/pages/Log.tsx`: List of catches (Standard list implemented)
  - `src/components/CatchCard.tsx`: Display component
  - `src/data/testCatches.ts`: Test data generator added
  - Swipe-to-delete deferred (using buttons)
- [x] **Catch Detail / Edit**
  - `src/pages/CatchDetail.tsx`: Form for editing
  - Photo upload handling (Base64 storage)
  - Species autocomplete (Created `src/data/species.ts`)

## Phase 5: Secondary Features (Day 3-4)

- [x] **Map View**
  - `src/pages/Map.tsx`: Mapbox GL integration
  - Clustering & Marker rendering
  - Filter integration (Deferred to separate task)
- [x] **Statistics**
  - `src/pages/Stats.tsx`: Dashboard layout
  - `src/utils/statistics.ts`: Update to match new `Catch` type
  - Charts (Line, Pie, Bar) integration
- [x] **Settings**
  - `src/pages/Settings.tsx`: Preferences form
  - Theme switcher logic
  - Data export (CSV) - Implement using `Blob` download
- [x] **Global Filtering (Log & Map)**
  - `src/components/FilterModal.tsx`: Shared filter UI
  - Filter store or local state integration

## Phase 6: PWA & Polish (Day 4)

- [x] **Service Worker**
  - [x] Background sync for weather (Workbox BackgroundSync / Custom Queue)
  - [x] Offline caching (App shell, Map tiles)
- [x] **Weather Service**
  - [x] `src/services/weather.ts`: Integration with new logic
  - [x] Sync queue processing (`src/services/sync.ts`)
- [x] **Manifest & Icons**
  - [x] Generate and configure `manifest.json` (Using `vite-plugin-pwa` with SVG icons)
  - [x] Add icons to `public/icons/` (Created `icon.svg`)

## Phase 7: Verification (Day 5)

- [x] **E2E Tests** (5/6 pass - Mobile Safari skipped, needs WebKit)
  - [x] `e2e/capture.spec.ts`: Full capture flow
  - [x] `e2e/offline.spec.ts`: Offline functionality
- [x] **Unit Tests**
  - [x] Utilities (`moonPhase.ts`, `statistics.ts`)
  - [x] Hooks (`useNetworkStatus.ts`)
- [x] **Lint & Build Check**
  - Ensure clean build (verified: build passes, lint clean, 21/21 unit tests pass)

## Phase 8: QA & Enhancements

- [x] **Stats Page Charts Not Displaying**: Full review and fix of the Stats page - charts are now rendering properly
  - Verified chart components in `src/pages/Stats.tsx` and `src/components/stats/`
  - Confirmed Recharts receives data correctly
  - Added E2E tests (`e2e/stats.spec.ts`) that verify:
    - Empty state shows correctly when no catches
    - Charts render with SVG elements when catches exist
    - Chart containers have proper height (220px+)
    - Weather conditions section displays correctly
  - All 9 Stats page E2E tests pass
- [x] **Full QA of the App**: Comprehensive quality assurance pass (completed)
  - Created `e2e/qa.spec.ts` with 10 comprehensive test scenarios
  - Tested all user flows: capture, edit, delete, filter, export
  - Verified responsive design on Mobile Chrome, Mobile Safari, Desktop Chrome
  - Fixed: Added Settings link to BottomNav (was missing)
  - Tested theme switching (light/dark/system) - works correctly
  - Tested unit switching (lbs/kg, in/cm) - works correctly
  - Verified all navigation works correctly
  - All 44 E2E tests pass (1 skipped: Mobile Safari offline)
- [ ] **Offline Map Support**: Implement proper offline map tile caching
  - Configure Mapbox for offline tile storage
  - Implement tile caching strategy in Service Worker
  - Add UI indicator for offline map availability
  - Handle map gracefully when offline with no cached tiles

## Discovered Issues / Notes

- [ ] **Mapbox Offline**: Check limits for offline tile caching (typically 6000 tiles).
- [ ] **Safari Support**: Background Sync API not supported; ensure fallback to foreground sync on network restore works reliably.
- [ ] **Storage Quota**: Monitor usage as photos are stored in IndexedDB.
