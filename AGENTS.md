# CATCHPOINT - PROJECT KNOWLEDGE BASE

**Generated:** 2026-01-07
**Commit:** Phase 4 complete
**Branch:** main

## OVERVIEW

Offline-first mobile fishing log for iOS/Android. One-tap catch capture with auto GPS + weather. Stack: Expo SDK 54, Expo Router, Drizzle ORM + SQLite, Zustand, Mapbox.

## STRUCTURE

```
catchpoint/
├── app/                    # Expo Router file-based routing
│   ├── _layout.tsx         # Root: DB init, migrations, providers, hydration guard
│   ├── (tabs)/             # Tab navigation (Home, Map, Log, Stats, Settings)
│   │   └── stats.tsx       # Statistics dashboard with charts
│   └── catch/[id].tsx      # Dynamic catch detail/edit route
├── src/
│   ├── components/         # UI: QuickCaptureButton, SwipeableCatchRow, FilterModal
│   │   └── stats/          # Chart components (StatCard, OverviewSection, charts)
│   ├── context/            # ThemeContext (light/dark)
│   ├── db/                 # Drizzle schema, client, migrations
│   ├── hooks/              # useLocation, useNetworkStatus
│   ├── services/           # weather, location, photo, sync, export (CSV)
│   ├── stores/             # Zustand: catchStore, settingsStore (with persistence)
│   ├── utils/              # statistics.ts (aggregation, date ranges)
│   └── data/               # species.ts (100+ fish), testCatches.ts (60 test catches)
├── drizzle/                # Auto-generated migrations
└── e2e/                    # Maestro YAML tests (see e2e/README.md)
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add new screen | `app/(tabs)/` | File = route. Use `_layout.tsx` for tab config |
| Add catch field | `src/db/schema.ts` → run `drizzle-kit generate` | Update `catchStore.ts` too |
| Modify quick capture | `src/components/QuickCaptureButton.tsx` | Optimistic UI pattern |
| Weather fetching | `src/services/weather.ts` + `sync.ts` | Background sync on network change |
| Theme changes | `src/context/ThemeContext.tsx` | Synced with settingsStore |
| State management | `src/stores/` | Zustand with persistence |
| E2E tests | `e2e/*.yaml` | Maestro; run with `npm run test:e2e` |
| Map integration | `app/(tabs)/map.tsx` | Requires native build, not Expo Go |
| Statistics/charts | `app/(tabs)/stats.tsx` | Uses victory-native + Skia |
| CSV export | `src/services/export.ts` | Uses expo-sharing |

## CONVENTIONS

### Safe Areas (CRITICAL)
- Use `useSafeAreaInsets()` hook, NOT `<SafeAreaView>` wrapper
- Apply insets dynamically: `paddingTop: insets.top`
- Tab bar height: `60 + insets.bottom`

### Gestures
- Use React Native's native `PanResponder` + `Animated`, NOT react-native-gesture-handler Swipeable
- GestureHandlerRootView already wraps app in `_layout.tsx`

### Optimistic UI (Quick Capture)
- Show success immediately (~0.3s), background the work
- Location: try fresh (8s timeout) → fallback cached → refresh async
- Weather: never block UI, queue for background sync

### Database
- Drizzle ORM with expo-sqlite
- Types exported from `src/db/schema.ts`: `Catch`, `InsertCatch`
- Migrations in `/drizzle/`, run via `runMigrations()` in `_layout.tsx`
- Web platform: DB is mocked (expo-sqlite is native-only)

### State
- Zustand stores in `src/stores/`
- `catchStore`: CRUD for catches, platform-aware (mocks on web)
- `settingsStore`: user prefs (units, theme)

## ANTI-PATTERNS

| Pattern | Why Forbidden |
|---------|---------------|
| `SafeAreaView` wrapper | Use `useSafeAreaInsets()` for granular control |
| Blocking location/weather on capture | Breaks optimistic UI; must be async |
| Mapbox in app.json env vars | Token MUST be shell env: `export RNMAPBOX_MAPS_DOWNLOAD_TOKEN=...` |
| Expo Go for map testing | Maps require native build: `expo run:android` |
| `any` for icon names | Type properly or use `as const` |
| Testing on iOS | Android only - do not build/test iOS version |

## UNIQUE STYLES

### Logging
- Prefix: `[App]`, `[Weather]`, `[Sync]`, etc.
- Heavy `console.log` for debugging (TODO: replace with logger before prod)

### Weather
- OpenWeatherMap 2.5 (free tier)
- Historical data requires paid One Call 3.0 - app falls back gracefully
- `pendingWeatherFetch` flag on catches, synced when online

### Icons
- `@expo/vector-icons` (Ionicons)
- Commonly cast with `as any` due to type limitations

## COMMANDS

```bash
# Android Emulator (ALWAYS start first)
export ANDROID_SDK_ROOT=~/Library/Android/sdk
emulator -avd Medium_Phone_API_36.1 &

# Development
npm start                    # Expo dev server
expo run:android             # Native Android build (required for maps)
expo run:ios                 # Native iOS build

# Database
npx drizzle-kit generate     # Generate migration from schema changes
npx drizzle-kit studio       # Visual DB browser

# Testing
npm run test:e2e             # All Maestro tests
npm run test:e2e:home        # Single test
maestro test e2e/home.yaml   # Direct Maestro

# Build (Android)
export RNMAPBOX_MAPS_DOWNLOAD_TOKEN=$(grep "^RNMAPBOX_MAPS_DOWNLOAD_TOKEN=" .env | cut -d'=' -f2)
npx expo prebuild --clean --platform android
cd android && ./gradlew app:assembleDebug
```

## ENVIRONMENT

Required in `.env`:
```
EXPO_PUBLIC_OPENWEATHERMAP_API_KEY=xxx   # Weather API (BLOCKER)
RNMAPBOX_MAPS_DOWNLOAD_TOKEN=sk.xxx      # Mapbox downloads (build-time)
```

## NOTES

- **Mapbox SDK**: Locked to `11.16.2` for `@rnmapbox/maps` v10.2.10 compatibility
- **iOS**: Uses static frameworks (`useFrameworks: "static"` in app.json)
- **New Architecture**: Enabled (`newArchEnabled: true`)
- **Typed Routes**: Expo Router experiment enabled
- **Phase 3 complete**: Map, Log, Settings, Catch Details all functional
- **Phase 4 complete**: Statistics dashboard, Charts (victory-native), CSV Export, Settings Persistence

## PHASE 4 FEATURES

### Statistics Dashboard (`app/(tabs)/stats.tsx`)
- Time range filter: 7D, 30D, 1Y, All
- Overview section with 4 stat cards (Total, Avg Weight, Biggest, Best Day)
- Charts: Catches Over Time (line), Top Species (pie), Best Fishing Hours (bar)
- Empty state with "Load Test Data" button for demo
- Uses victory-native + @shopify/react-native-skia for charting

### CSV Export (`src/services/export.ts`)
- `exportCatchesToCSV()` - generates and shares CSV file
- Export button in Settings screen
- Uses expo-sharing for native share sheet

### Settings Persistence (`src/stores/settingsStore.ts`)
- Zustand persist middleware with @react-native-async-storage/async-storage
- Theme, units, and preferences persist across app restarts
- Hydration guard in `_layout.tsx` prevents flash of wrong theme

### Statistics Utilities (`src/utils/statistics.ts`)
- `calculateStatistics()` - comprehensive aggregation
- Date range filtering and grouping functions
- By-hour, by-species, by-weather breakdowns

### Test Dataset (`src/data/testCatches.ts`)
- 60 realistic test catches spanning 1 year
- Varied species, locations, weather conditions, times
- Used for chart testing when no real data exists
