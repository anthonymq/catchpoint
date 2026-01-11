# Implementation Plan - Catchpoint PWA Rewrite

> **Status**: 🔄 IN PROGRESS - Phase 9 (Mobile Polish & iOS)
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
- [x] **Offline Map Support**: Implement proper offline map tile caching (completed)
  - Updated Service Worker to cache all Mapbox domains:
    - `api.mapbox.com` (styles, sprites, fonts/glyphs)
    - `tiles.mapbox.com` and `*.tiles.mapbox.com` (vector/raster tiles)
  - Added offline indicator banner in Map.tsx when offline
  - Added error handling for map when offline with no cached tiles
  - Implemented retry button for users to reload map when back online
  - Configured tile cache limit to 2000 entries (~50-100MB)
  - 30-day expiration for tiles (they rarely change)

## Phase 9: Mobile Polish & iOS Compatibility

> **Status**: 🔴 NOT STARTED
> **Priority**: HIGH - Critical UX issues on mobile devices

### 9.1 Stats Screen Mobile Fix (Pixel 7)

**Problem**: Charts are not fully visible on mobile (Pixel 7 - 1080x2400, 412x915 CSS pixels). User cannot see all charts without issues.

- [ ] **Audit Stats Page Layout**
  - Open Stats page on Pixel 7 viewport (412x915)
  - Identify which charts are cut off, overlapping, or not visible
  - Check if BottomNav overlaps chart content
  - Verify scroll behavior works correctly

- [ ] **Fix Chart Container Heights**
  - Ensure each chart section has proper `min-height` that works on mobile
  - Charts should NOT have fixed heights that break on small screens
  - Use `aspect-ratio` or percentage-based heights where appropriate
  - Add proper padding-bottom for BottomNav clearance (at least 80px)

- [ ] **Fix Chart Responsiveness**
  - Verify Recharts `ResponsiveContainer` is used correctly
  - Charts should resize properly on orientation change
  - Ensure chart legends don't overflow on narrow screens
  - Test touch interactions on charts (tooltips should work)

- [ ] **Fix Stats Page Scroll**
  - Page must scroll smoothly to show all content
  - No content should be hidden behind BottomNav
  - Add `padding-bottom: env(safe-area-inset-bottom)` for iOS
  - Verify all 4 chart sections are accessible by scrolling

- [ ] **E2E Test on Mobile Viewport**
  - Add/update E2E test for Pixel 7 viewport (412x915)
  - Verify all charts are visible and have proper dimensions
  - Test scrolling to bottom of stats page

### 9.2 iOS Full Compatibility

**Problem**: PWA needs to work flawlessly on iOS Safari, including standalone mode (Add to Home Screen).

- [ ] **Safe Area Handling**
  - Add `viewport-fit=cover` to meta viewport tag
  - Use `env(safe-area-inset-*)` for all edge elements:
    - Top: Header/status bar area
    - Bottom: BottomNav + home indicator
    - Left/Right: For landscape mode
  - Test on iPhone with notch (X, 11, 12, 13, 14, 15 series)

- [ ] **iOS PWA Meta Tags**
  - Add `apple-mobile-web-app-capable` meta tag
  - Add `apple-mobile-web-app-status-bar-style` (black-translucent recommended)
  - Add `apple-mobile-web-app-title`
  - Add Apple touch icons (180x180 required)
  - Add `apple-touch-startup-image` for splash screens (optional but nice)

- [ ] **iOS-Specific Touch Behaviors**
  - Disable double-tap zoom on interactive elements (`touch-action: manipulation`)
  - Prevent pull-to-refresh interfering with app (`overscroll-behavior: none` on body)
  - Fix any `-webkit-overflow-scrolling: touch` issues
  - Ensure smooth momentum scrolling on all scrollable containers

- [ ] **iOS PWA Standalone Mode**
  - Test app works when added to home screen
  - Verify navigation doesn't break in standalone mode
  - Ensure back gesture works correctly
  - Test that external links open in Safari (not in-app)

- [ ] **iOS Safari Quirks**
  - Fix any 100vh issues (iOS Safari has dynamic viewport)
  - Use `dvh` units or JS-based viewport height fix
  - Test keyboard behavior doesn't break layout on forms
  - Verify date inputs work correctly (iOS has native date picker)

- [ ] **iOS Geolocation**
  - Verify location permissions work on iOS Safari
  - Test location accuracy on iOS devices
  - Handle iOS-specific permission prompts gracefully

- [ ] **iOS Offline/Service Worker**
  - Test Service Worker registration on iOS Safari
  - Verify offline mode works (iOS has SW limitations)
  - Note: Background Sync not supported - ensure foreground sync works
  - Test app reload behavior when coming from background

- [ ] **E2E Tests for iOS**
  - Run E2E tests on WebKit (Safari) engine
  - Verify all critical flows work on iOS Safari viewport
  - Test PWA install flow on iOS

### 9.3 Verification

- [ ] **Manual Testing Checklist**
  - [ ] Stats page fully visible and scrollable on Pixel 7 (Android)
  - [ ] Stats page fully visible and scrollable on iPhone 12/13/14 (iOS)
  - [ ] All charts render correctly on both platforms
  - [ ] Quick Capture works on iOS
  - [ ] Map loads and works on iOS
  - [ ] Theme switching works on iOS
  - [ ] Offline mode works on iOS (with limitations noted)
  - [ ] PWA installs correctly on iOS (Add to Home Screen)

- [ ] **Build & Test**
  - All E2E tests pass including mobile viewports
  - Build completes without errors
  - Lighthouse PWA audit passes on iOS Safari

## Discovered Issues / Notes

- [x] **Mapbox Offline**: Tile caching implemented with 2000-tile limit. Users should browse areas while online to cache tiles.
- [ ] **Safari Support**: Background Sync API not supported; ensure fallback to foreground sync on network restore works reliably.
- [ ] **Storage Quota**: Monitor usage as photos are stored in IndexedDB.
- [ ] **iOS 100vh Bug**: iOS Safari's 100vh includes the URL bar. Use `100dvh` or JS workaround.
- [ ] **iOS PWA Limitations**: No Background Sync, no Push notifications without workarounds, limited Service Worker support.
