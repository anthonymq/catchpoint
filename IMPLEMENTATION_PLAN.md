# Implementation Plan - Catchpoint PWA

> **Last Updated**: 2026-01-11 (RALPH Build Mode - Phase 11 Complete)
> **Status**: Phases 1-11 Complete, Phases 12-18 Pending
> **Goal**: Offline-first PWA fishing log with one-tap capture

---

## Executive Summary

The core PWA is functional with Quick Capture, Log, Map, Stats, and Settings pages. Comprehensive gap analysis (6 parallel background agents) confirmed the following priorities:

| Priority   | Feature                   | Status      | Effort | Spec Reference           |
| ---------- | ------------------------- | ----------- | ------ | ------------------------ |
| **HIGH**   | Theme Flash Prevention    | **Missing** | S      | `specs/settings.md`      |
| **HIGH**   | i18n (EN/FR)              | **Missing** | L      | `specs/i18n.md`          |
| **HIGH**   | PWA Install Prompt        | **Missing** | S      | `specs/settings.md`      |
| **HIGH**   | Storage Quota Display     | **Missing** | S      | `specs/offline-sync.md`  |
| **MEDIUM** | Quick Capture Truly Async | Partial     | S      | `specs/quick-capture.md` |
| **MEDIUM** | Virtual Scrolling (Log)   | **Missing** | M      | `specs/catch-log.md`     |
| **LOW**    | E2E Test Coverage Gaps    | Partial     | M      | `specs/*.md`             |

---

## Phase 11: Theme & Language Flash Prevention

> **Status**: COMPLETE
> **Priority**: HIGH - Critical UX issue (users see white flash in dark mode)
> **Effort**: S (Small)
> **Completed**: 2026-01-11

### 11.1 Add Blocking Script to index.html

- [x] **Add Theme + Language Blocking Script** - S
  - Inserted inline `<script>` in `<head>` BEFORE any other scripts/styles
  - Reads `catchpoint-settings` from localStorage
  - Sets `data-theme="dark"` only for dark mode (matches useTheme.ts behavior)
  - Sets `document.documentElement.lang` for future i18n support
  - Handles "system" preference using `window.matchMedia`

### Acceptance Criteria

- [x] No flash of wrong theme on page load (test with slow 3G throttling)
- [x] Works with cleared localStorage (defaults correctly)
- [x] Dark mode users see dark immediately, no white flash

---

## Phase 12: PWA Install & Storage

> **Status**: NOT STARTED
> **Priority**: HIGH - Spec requirement, missing from codebase
> **Effort**: S-M
> **Verified**: No `useInstallPrompt` hook exists, Settings page missing PWA section

### 12.1 PWA Install Prompt Hook

- [ ] **Create `src/hooks/useInstallPrompt.ts`** - S
  - Capture `beforeinstallprompt` event
  - Store deferred prompt in state
  - Provide `canInstall`, `promptInstall()`, and `isInstalled` states
  - Track installation via `appinstalled` event

  ```typescript
  interface UseInstallPromptReturn {
    canInstall: boolean;
    isInstalled: boolean;
    promptInstall: () => Promise<void>;
  }
  ```

- [ ] **Detect iOS for special handling** - S
  - iOS Safari doesn't fire `beforeinstallprompt`
  - Detect via userAgent: `/iPad|iPhone|iPod/` + not standalone
  - Show "Add to Home Screen" instructions for iOS users

### 12.2 Storage Quota Display

- [ ] **Create `src/utils/storage.ts`** - S
  - Implement `getStorageQuota()` using `navigator.storage.estimate()`
  - Return `{ used: number, quota: number, percentUsed: number }`
  - Format as human-readable: "12.5 MB of 100 MB"

- [ ] **Create `src/hooks/useStorageQuota.ts`** - S
  - React hook that fetches and caches storage info
  - Refresh on mount and after data operations

### 12.3 Update Settings Page with PWA Section

- [ ] **Add PWA Section to `src/pages/Settings.tsx`** - S
  - Section header: "App"
  - "Install App" button (uses `useInstallPrompt`)
    - Show only when `canInstall === true`
    - Show "App Installed" badge when `isInstalled === true`
    - Show iOS instructions when on iOS and not installed
  - "Storage Used" row with quota display

  ```
  APP
  +-----------------------------------+
  | Install App           [Install]   |  <- or "Installed"
  | Storage Used      12.5 / 100 MB   |
  +-----------------------------------+
  ```

### Acceptance Criteria

- [ ] Install button appears on supported browsers (Chrome, Edge)
- [ ] Install button triggers native prompt
- [ ] Button changes to "Installed" after installation
- [ ] iOS shows manual instructions
- [ ] Storage displays correct usage

---

## Phase 13: Internationalization (i18n)

> **Status**: NOT STARTED - **Entirely missing from codebase**
> **Priority**: HIGH - Spec exists (`specs/i18n.md`), implementation missing
> **Effort**: L (Large)
> **Verified**: No `src/i18n/` directory, no translation files, no language in settingsStore

### 13.1 i18n Infrastructure

- [ ] **Create `src/i18n/` directory** - S
  - `src/i18n/index.ts` - Provider, context, `useTranslation` hook
  - `src/i18n/types.ts` - TypeScript types for translation keys

- [ ] **Create translation files** - M
  - `src/i18n/en.json` - English translations (all keys)
  - `src/i18n/fr.json` - French translations (all keys)
  - Follow namespace structure from `specs/i18n.md`

- [ ] **Implement `useTranslation` hook** - S
  - `t(key: string, params?: Record<string, string | number>) => string`
  - Support dot notation: `t('nav.home')` -> "Home"
  - Support interpolation: `t('log.catches', { count: 5 })` -> "5 catches"
  - Fallback to key if translation missing

- [ ] **Create `I18nProvider` component** - S
  - Wrap app in `src/main.tsx`
  - Provide translation context
  - Listen to language changes from `settingsStore`

### 13.2 Settings Store Update

- [ ] **Add language to `src/stores/settingsStore.ts`** - S
  - Add `language: 'en' | 'fr' | 'system'` state (default: `'system'`)
  - Add `setLanguage(lang)` action
  - Persist with existing Zustand middleware

### 13.3 Language Selector UI

- [ ] **Add Language section to Settings** - S
  - Three options: System, English, Francais
  - Same toggle UI pattern as theme selector
  - Position: First item in Preferences section (before Appearance)

### 13.4 Translate All Hardcoded Strings

- [ ] **Pages** - L
  - `src/pages/Home.tsx` - greeting, capture button text
  - `src/pages/Log.tsx` - "Catch Log", empty state, filter labels
  - `src/pages/Map.tsx` - offline indicator, controls
  - `src/pages/Stats.tsx` - chart titles, stat labels, time ranges
  - `src/pages/Settings.tsx` - all sections and labels
  - `src/pages/CatchDetail.tsx` - form labels, buttons

- [ ] **Components** - M
  - `src/components/QuickCaptureButton.tsx` - "FISH ON!", "CAUGHT!"
  - `src/components/FilterModal.tsx` - filter options, buttons
  - `src/components/ConfirmModal.tsx` - button labels
  - `src/components/BottomNav.tsx` - nav labels
  - `src/components/CatchCard.tsx` - labels, date text

- [ ] **Utilities** - S
  - `src/utils/format.ts` - "Today at", "Yesterday at"
  - `src/services/export.ts` - CSV column headers

### 13.5 Species Translations

- [ ] **Update `src/data/species.ts`** - M
  - Convert to language-aware structure
  - Provide both EN and FR species names
  - Autocomplete should use current language

### Acceptance Criteria

- [ ] App detects system language on first launch
- [ ] Language persists when explicitly set
- [ ] "System" option follows device preference
- [ ] All UI text is translated (no hardcoded strings visible)
- [ ] Date/time formats respect locale (Intl.DateTimeFormat)
- [ ] Language switch applies immediately (no reload)
- [ ] No flash of wrong language on startup

---

## Phase 14: Quick Capture Optimization

> **Status**: PARTIAL
> **Priority**: MEDIUM
> **Effort**: S
> **Spec**: `specs/quick-capture.md`
> **Verified**: `useQuickCapture.ts` line 28 awaits `getCurrentLocation()` blocking up to 8s

### Current Issue

In `src/hooks/useQuickCapture.ts`:

- Line 28: `const location = await getCurrentLocation();` **blocks** before showing success
- User sees "Capturing..." for up to 8 seconds (GPS timeout)
- Spec requires: success feedback in <300ms
- UI appears fire-and-forget (button doesn't await), but catch NOT saved until GPS completes

### 14.1 Make Capture Truly Fire-and-Forget

- [ ] **Refactor `useQuickCapture.ts`** - S
  - Show success animation IMMEDIATELY on tap
  - Use cached location first (from localStorage)
  - Fire GPS request in background, update catch later if better coords
  - Don't block on `await getCurrentLocation()`

  ```typescript
  const capture = async () => {
    // 1. INSTANT feedback
    setIsCapturing(true);
    triggerHaptic();

    // 2. Get cached location (instant)
    const cachedLocation = getCachedLocation();

    // 3. Create catch with cached/default coords
    const newCatch = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      latitude: cachedLocation?.latitude ?? 0,
      longitude: cachedLocation?.longitude ?? 0,
      pendingWeatherFetch: true,
      pendingLocationRefresh: !cachedLocation, // Flag if needs GPS refresh
    };

    // 4. Save immediately
    await addCatch(newCatch);
    setIsCapturing(false); // SUCCESS within 300ms!

    // 5. Background: refresh GPS and update if better
    refreshLocationAsync(newCatch.id);

    // 6. Background: fetch weather
    if (navigator.onLine) {
      syncService.processWeatherQueue();
    }
  };
  ```

### 14.2 Location Service Enhancement

- [ ] **Update `src/services/location.ts`** - S
  - Export `getCachedLocation()` function (already exists, make public)
  - Add `refreshLocationAsync(catchId)` to update catch with fresh GPS
  - Cache successful GPS reads for 5 minutes

- [ ] **Update `src/db/index.ts`** - S
  - Add `pendingLocationRefresh?: boolean` to Catch interface

### Acceptance Criteria

- [ ] Success animation shows within 300ms of tap
- [ ] GPS fetch happens in background
- [ ] Catch is saved immediately with cached/default location
- [ ] Location updates asynchronously if GPS returns

---

## Phase 15: Virtual Scrolling for Catch Log

> **Status**: NOT STARTED
> **Priority**: MEDIUM
> **Effort**: M
> **Spec**: `specs/catch-log.md`
> **Verified**: No `@tanstack/react-virtual` in package.json, `Log.tsx` uses direct `.map()`

### 15.1 Install Virtualization Library

- [ ] **Add @tanstack/react-virtual** - S
  ```bash
  npm install @tanstack/react-virtual
  ```

### 15.2 Implement Virtual List in Log.tsx

- [ ] **Refactor `src/pages/Log.tsx`** - M
  - Replace direct `.map()` (lines 164-171) with `useVirtualizer`
  - Maintain scroll position on filter changes
  - Support variable height items (catches with photos)
  - Add proper sizing estimates

  ```typescript
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: filteredCatches.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Estimated card height
    overscan: 5,
  });
  ```

### Acceptance Criteria

- [ ] Smooth 60fps scrolling with 1000+ catches
- [ ] Memory usage stays low with large lists
- [ ] Cards render correctly at all scroll positions
- [ ] Filter changes don't cause scroll jump

---

## Phase 16: Settings Page Completion

> **Status**: PARTIAL
> **Priority**: MEDIUM
> **Effort**: S
> **Spec**: `specs/settings.md`
> **Verified**: Version is hardcoded "v0.1.0 (Alpha)", no About section links

### 16.1 Missing Settings Features

- [ ] **Dynamic Version Display** - S
  - Read from `import.meta.env.VITE_APP_VERSION` or package.json
  - Add build script to inject version
  - Display: "Catchpoint v1.0.0" (not hardcoded)

- [ ] **About Section Links** - S
  - Licenses: Link to `/licenses` or modal with OSS attributions
  - Privacy Policy: External link (can be placeholder URL for now)
  - Version: Dynamic from above

### 16.2 Already Implemented

- [x] Theme switching (Light/Dark/System)
- [x] Unit preferences (lbs/kg, in/cm)
- [x] Export CSV
- [x] Load Test Data
- [x] Clear All Data with confirmation

---

## Phase 17: Code Quality & Tech Debt

> **Status**: ONGOING
> **Priority**: LOW
> **Effort**: M

### 17.1 Inline Styles Cleanup

Files with inline styles to migrate to CSS:

- [ ] `src/components/QuickCaptureButton.tsx` (line 67) - opacity, marginTop
- [ ] `src/pages/CatchDetail.tsx` (lines 169, 299) - width spacer, textTransform
- [ ] `src/pages/Stats.tsx` (lines 17, 21) - skeleton dimensions
- [ ] `src/components/stats/SpeciesChart.tsx` (lines 93, 106) - font styling

Note: Dynamic styles for chart colors and animation transforms are acceptable.

### 17.2 Skeleton Utility Classes

- [ ] **Create skeleton utilities in `src/styles/index.css`** - S
  - `.skeleton-sm`, `.skeleton-md`, `.skeleton-lg` for common sizes
  - Replace inline width/height on skeleton elements

---

## Phase 18: E2E Test Coverage Expansion

> **Status**: PARTIAL
> **Priority**: LOW
> **Effort**: M
> **Verified**: No map tests, no photo tests, WebKit offline skipped

### 18.1 Current Coverage (Good)

- [x] Quick Capture flow (`capture.spec.ts`)
- [x] Offline sync (`offline.spec.ts`)
- [x] Statistics display (`stats.spec.ts`)
- [x] Settings (theme, units, data management) (`qa.spec.ts`)
- [x] Basic navigation (`qa.spec.ts`)
- [x] Delete catch flow (`qa.spec.ts`)
- [x] Filter modal basic usage (`qa.spec.ts`)

### 18.2 Coverage Gaps

- [ ] **Map View Tests** (`e2e/map.spec.ts`) - M
  - Marker rendering
  - Cluster behavior at low zoom
  - Popup/info interactions
  - Heatmap toggle
  - Offline map indicator

- [ ] **Photo Upload Flow** - M
  - Test photo capture/upload in CatchDetail
  - Verify photo persists and displays

- [ ] **Log Sorting** - S
  - Verify sort order changes (newest/oldest)
  - Test weight-based sorting

- [ ] **i18n Tests** (after Phase 13) - M
  - Language switching
  - System language detection
  - Verify no hardcoded English leaks

### 18.3 Known Flaky/Skipped Tests

- `e2e/offline.spec.ts` - WebKit is skipped (unreliable offline emulation)
- `e2e/qa.spec.ts` has timing issues in:
  - Unit switching test (lines 65-94) - class assertion may be flaky
  - Filter modal test (lines 119-154)
  - Delete flow test (lines 156-183)

---

## Completed Phases (Archive)

<details>
<summary>Phase 1-10: Core Implementation (COMPLETE)</summary>

### Phase 1: Demolition & Rescue (COMPLETE)

- [x] Rescue reusable logic to `_rescue/`
- [x] Nuke old Expo/React Native codebase
- [x] Clean Git

### Phase 2: Foundation (COMPLETE)

- [x] Initialize Vite project (React + TypeScript + SWC)
- [x] Install dependencies (Dexie, Zustand, Mapbox, Recharts, Workbox)
- [x] Project configuration (vite.config.ts, tsconfig.json, playwright.config.ts)

### Phase 3: Core Infrastructure (COMPLETE)

- [x] Database Layer (Dexie) - `src/db/index.ts`, `src/db/repository.ts`
- [x] State Management (Zustand) - `src/stores/catchStore.ts`, `src/stores/settingsStore.ts`
- [x] Routing & Layout - React Router, Layout component, BottomNav
- [x] Global Styles - CSS Variables, theming
- [x] Hooks - `useNetworkStatus`, `useTheme`

### Phase 4: Primary Features (COMPLETE)

- [x] Quick Capture (Home) - optimistic UI, haptic feedback
- [x] Catch Log (List) - filtering, sorting, skeleton loading
- [x] Catch Detail / Edit - species autocomplete, photo upload, weather display

### Phase 5: Secondary Features (COMPLETE)

- [x] Map View - Mapbox GL JS, clustering, heatmap toggle
- [x] Statistics - Recharts, time range filter, stat cards
- [x] Settings - theme, units, export, clear data
- [x] Global Filtering - FilterModal, filterStore

### Phase 6: PWA & Polish (COMPLETE)

- [x] Service Worker (Workbox) - app shell caching, map tile caching
- [x] Weather Service - OpenWeatherMap integration, sync queue
- [x] Manifest & Icons - vite-plugin-pwa, SVG + PNG icons

### Phase 7: Verification (COMPLETE)

- [x] E2E Tests - capture.spec.ts, offline.spec.ts, stats.spec.ts, qa.spec.ts
- [x] Unit Tests - moonPhase.ts, statistics.ts, useNetworkStatus.ts
- [x] Build verification - TypeScript clean, ESLint clean

### Phase 8: QA & Enhancements (COMPLETE)

- [x] Stats page charts rendering fix
- [x] Full QA pass (44 E2E tests)
- [x] Offline map support with tile caching

### Phase 9: Mobile Polish & iOS (COMPLETE)

- [x] Stats screen mobile fix (nested scrolling issue)
- [x] iOS safe area handling (viewport-fit, env() insets)
- [x] iOS PWA meta tags (apple-mobile-web-app-capable, etc.)
- [x] Touch behaviors (touch-action, overscroll-behavior)
- [x] 100vh bug fix (using 100dvh)

### Phase 10: Enhanced Stats & Map (COMPLETE)

- [x] Moon Phase Impact Chart
- [x] Barometric Pressure Impact Chart
- [x] Map Heatmap Layer with toggle

</details>

---

## Discovered Technical Debt

From comprehensive codebase analysis (no explicit TODO/FIXME comments found - codebase is clean):

| Item                        | Location                      | Status          | Notes                                   |
| --------------------------- | ----------------------------- | --------------- | --------------------------------------- |
| BackgroundSyncPlugin        | `src/sw.ts`                   | Commented out   | Foreground sync used instead            |
| Web Share API for export    | `src/services/export.ts`      | Not implemented | Only CSV download, no share             |
| Map auto-retry on reconnect | `src/pages/Map.tsx:52`        | Manual only     | Comment notes user must reload          |
| Location (0,0) fallback     | `src/services/location.ts:77` | Hardcoded       | Used when GPS + cache both fail         |
| Default map center          | `src/pages/Map.tsx:192`       | Hardcoded       | `[40, -100]` - should use user location |

---

## Known Issues / Limitations

| Issue                   | Status         | Notes                                              |
| ----------------------- | -------------- | -------------------------------------------------- |
| Safari Background Sync  | Limitation     | Not supported; fallback to foreground sync works   |
| WebKit offline E2E test | Skipped        | Unreliable offline emulation in WebKit             |
| QA test flakiness       | 3 tests        | Timing issues in unit switch, filter, delete flows |
| Photo storage quota     | Monitor        | Large photos in IndexedDB could hit limits         |
| iOS PWA limitations     | Known          | No push notifications, limited SW support          |
| Historical weather      | API limitation | OpenWeatherMap free tier lacks historical data     |
| No TODO/FIXME markers   | Clean          | Codebase has no explicit incomplete markers        |

---

## Quick Reference

### Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
npm run test         # Unit tests (Vitest)
npm run test:e2e     # E2E tests (Playwright)
npm run lint         # ESLint
npm run typecheck    # TypeScript check
```

### Environment Variables

```
VITE_OPENWEATHERMAP_API_KEY=xxx  # Required for weather
VITE_MAPBOX_ACCESS_TOKEN=pk.xxx  # Required for map
```

### Key Files

| Category       | Files                                                     |
| -------------- | --------------------------------------------------------- |
| Entry          | `src/main.tsx`, `src/App.tsx`                             |
| Database       | `src/db/index.ts`, `src/db/repository.ts`                 |
| State          | `src/stores/catchStore.ts`, `src/stores/settingsStore.ts` |
| Service Worker | `src/sw.ts`                                               |
| PWA Config     | `vite.config.ts` (VitePWA plugin)                         |
| Specs          | `specs/*.md`                                              |

---

## Implementation Order (Recommended)

1. **Phase 11**: Theme Flash Prevention (blocker for good UX, small effort)
2. **Phase 12**: PWA Install + Storage (quick wins, high visibility)
3. **Phase 14**: Quick Capture Async (spec compliance, small effort)
4. **Phase 13**: i18n (largest scope, defer if time constrained)
5. **Phase 15**: Virtual Scrolling (performance, defer until needed)
6. **Phase 16-18**: Polish and tests (as time permits)

---

_Generated by RALPH Planning Mode - 2026-01-11_
_Gap analysis completed with 6 parallel background agents_
