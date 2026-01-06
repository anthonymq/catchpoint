# CATCHPOINT - PROJECT KNOWLEDGE BASE

**Generated:** 2026-01-06
**Commit:** 86b14c5
**Branch:** main

## OVERVIEW

Offline-first mobile fishing log for iOS/Android. One-tap catch capture with auto GPS + weather. Stack: Expo SDK 54, Expo Router, Drizzle ORM + SQLite, Zustand, Mapbox.

## STRUCTURE

```
catchpoint/
├── app/                    # Expo Router file-based routing
│   ├── _layout.tsx         # Root: DB init, migrations, providers
│   ├── (tabs)/             # Tab navigation (Home, Map, Log, Settings)
│   └── catch/[id].tsx      # Dynamic catch detail/edit route
├── src/
│   ├── components/         # UI: QuickCaptureButton, SwipeableCatchRow, FilterModal
│   ├── context/            # ThemeContext (light/dark)
│   ├── db/                 # Drizzle schema, client, migrations
│   ├── hooks/              # useLocation, useNetworkStatus
│   ├── services/           # weather, location, photo, sync (background)
│   ├── stores/             # Zustand: catchStore, settingsStore
│   └── data/               # species.ts (100+ fish for autocomplete)
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
- **Phase 4 pending**: Statistics, Charts, Cloud Sync, CSV Export
