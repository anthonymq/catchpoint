# CATCHPOINT PWA - PROJECT KNOWLEDGE BASE

**Generated:** 2026-01-10
**Status:** PWA Rewrite - Starting Fresh
**Branch:** main

## OVERVIEW

Offline-first Progressive Web App fishing log. One-tap catch capture with auto GPS + weather. 
Stack: Vite + React 18, React Router, Dexie.js (IndexedDB), Zustand, Mapbox GL JS, Workbox (Service Worker).

## STRUCTURE

```
catchpoint/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service worker (generated)
│   └── icons/                 # PWA icons (192, 512, maskable)
├── src/
│   ├── main.tsx               # App entry point
│   ├── App.tsx                # Root component with router
│   ├── pages/                 # Route pages
│   │   ├── Home.tsx           # Home with Quick Capture button
│   │   ├── Map.tsx            # Map view with Mapbox GL JS
│   │   ├── Log.tsx            # Catch log list
│   │   ├── Stats.tsx          # Statistics dashboard
│   │   ├── Settings.tsx       # User preferences
│   │   └── CatchDetail.tsx    # Catch detail/edit
│   ├── components/            # Reusable UI components
│   │   ├── QuickCaptureButton.tsx
│   │   ├── CatchCard.tsx
│   │   ├── FilterModal.tsx
│   │   ├── BottomNav.tsx
│   │   └── stats/             # Chart components
│   ├── db/                    # Dexie.js database
│   │   └── index.ts           # Schema and DB instance
│   ├── hooks/                 # Custom React hooks
│   │   ├── useLocation.ts
│   │   ├── useNetworkStatus.ts
│   │   └── useTheme.ts
│   ├── services/              # Business logic
│   │   ├── weather.ts
│   │   ├── sync.ts
│   │   └── export.ts
│   ├── stores/                # Zustand stores
│   │   ├── catchStore.ts
│   │   └── settingsStore.ts
│   ├── utils/                 # Utility functions
│   │   ├── statistics.ts
│   │   └── format.ts
│   ├── data/                  # Static data
│   │   ├── species.ts
│   │   └── testCatches.ts
│   └── styles/                # CSS
│       ├── index.css          # Global styles + CSS variables
│       └── components/        # Component-specific styles
├── specs/                     # Feature specifications
├── ralph/                     # Autonomous dev loop
└── e2e/                       # Playwright tests
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add new page | `src/pages/` + update `App.tsx` router | React Router v6 |
| Add catch field | `src/db/index.ts` | Update Dexie schema version |
| Modify quick capture | `src/components/QuickCaptureButton.tsx` | Optimistic UI pattern |
| Weather fetching | `src/services/weather.ts` + `sync.ts` | Background sync on network change |
| Theme changes | `src/hooks/useTheme.ts` + CSS vars | Synced with settingsStore |
| State management | `src/stores/` | Zustand with localStorage persist |
| E2E tests | `e2e/*.spec.ts` | Playwright |
| Map integration | `src/pages/Map.tsx` | react-map-gl or mapbox-gl |
| Statistics/charts | `src/pages/Stats.tsx` | Recharts or Chart.js |
| CSV export | `src/services/export.ts` | Web Share API + download fallback |
| Service Worker | `public/sw.js` or Vite plugin | Workbox for caching |

## CONVENTIONS

### CSS Custom Properties (Theming)
```css
:root {
  --color-primary: #0f3460;
  --color-background: #ffffff;
  --color-text: #1a1a2e;
  /* ... */
}

[data-theme="dark"] {
  --color-primary: #3282b8;
  --color-background: #1a1a2e;
  --color-text: #eaeaea;
}
```

### Responsive Design
- Mobile-first approach
- Breakpoints: 480px (sm), 768px (md), 1024px (lg)
- Bottom navigation on mobile, sidebar on desktop (optional)

### Optimistic UI (Quick Capture)
- Show success immediately (~0.3s), background the work
- Location: try fresh (8s timeout) → fallback cached → refresh async
- Weather: never block UI, queue for background sync

### Database (IndexedDB via Dexie.js)
- Schema defined in `src/db/index.ts`
- Types exported: `Catch`, `InsertCatch`
- Version migrations handled by Dexie
- All operations are async

### State
- Zustand stores in `src/stores/`
- `catchStore`: CRUD for catches, syncs with IndexedDB
- `settingsStore`: user prefs (units, theme), persisted to localStorage

## ANTI-PATTERNS

| Pattern | Why Forbidden |
|---------|---------------|
| Blocking location/weather on capture | Breaks optimistic UI; must be async |
| Synchronous localStorage in render | Causes hydration issues |
| Direct DOM manipulation | Use React state/refs |
| `any` types | Type properly |
| Inline styles (excessive) | Use CSS classes or CSS-in-JS consistently |
| Ignoring offline state | App must work fully offline |

## UNIQUE STYLES

### Logging
- Prefix: `[App]`, `[Weather]`, `[Sync]`, `[DB]`, etc.
- Use `console.log` for debugging (consider structured logger for prod)

### Weather
- OpenWeatherMap 2.5 (free tier)
- Historical data requires paid One Call 3.0 - app falls back gracefully
- `pendingWeatherFetch` flag on catches, synced when online

### Icons
- Use Lucide React, Heroicons, or similar icon library
- SVG icons for PWA icons

## COMMANDS

```bash
# Development
npm run dev              # Vite dev server (http://localhost:5173)
npm run build            # Production build
npm run preview          # Preview production build

# Testing
npm run test             # Unit tests (Vitest)
npm run test:e2e         # E2E tests (Playwright)

# Linting
npm run lint             # ESLint
npm run typecheck        # TypeScript check
```

## ENVIRONMENT

Required in `.env`:
```
VITE_OPENWEATHERMAP_API_KEY=xxx    # Weather API (BLOCKER)
VITE_MAPBOX_ACCESS_TOKEN=pk.xxx    # Mapbox public token
```

## TECH STACK

| Category | Technology | Notes |
|----------|------------|-------|
| Framework | React 18 | With hooks, no class components |
| Build | Vite | Fast HMR, ESM-first |
| Router | React Router v6 | File-based not required |
| State | Zustand | Lightweight, no boilerplate |
| Database | Dexie.js | IndexedDB wrapper |
| Maps | Mapbox GL JS | Via react-map-gl or direct |
| Charts | Recharts | Or Chart.js / D3 |
| Service Worker | Workbox | Via vite-plugin-pwa |
| Styling | Vanilla CSS | CSS variables for theming |
| Testing | Vitest + Playwright | Unit + E2E |

## PWA REQUIREMENTS

### Manifest (`public/manifest.json`)
- Name, short_name, description
- Icons: 192x192, 512x512, maskable
- display: standalone
- theme_color, background_color
- start_url: "/"

### Service Worker
- Precache app shell (HTML, CSS, JS)
- Cache API responses (weather, map tiles)
- Background sync for weather queue
- Offline fallback page

### Install Prompt
- Capture `beforeinstallprompt` event
- Show install button in Settings
- Track installation state

## NOTES

- **Starting fresh**: Delete existing Expo/RN code before implementing
- **Mobile-first**: Design for touch, enhance for desktop
- **Offline-first**: IndexedDB is source of truth
- **PWA installable**: Must pass Lighthouse PWA audit

## RALPH LOOP

Autonomous AI development loop based on the [Ralph Wiggum Technique](https://github.com/ghuntley/how-to-ralph-wiggum).

### What is RALPH?
A bash loop that continuously feeds prompts to an AI agent for autonomous development:
- **PLANNING mode**: Analyzes specs vs code, creates `IMPLEMENTATION_PLAN.md`
- **BUILDING mode**: Implements from plan, runs tests, commits changes

### Running RALPH

```bash
# PLANNING mode - analyze and create/update plan
./ralph/loop.sh plan

# BUILDING mode - implement from plan (default)
./ralph/loop.sh

# With max iterations
./ralph/loop.sh 10          # Build mode, max 10 iterations
./ralph/loop.sh plan 5      # Plan mode, max 5 iterations
```

### Key Files

| File | Purpose |
|------|---------|
| `ralph/loop.sh` | Main bash loop script |
| `ralph/PROMPT_plan.md` | Planning mode instructions |
| `ralph/PROMPT_build.md` | Building mode instructions |
| `specs/*.md` | Feature specifications (source of truth) |
| `IMPLEMENTATION_PLAN.md` | Generated task list (created by RALPH) |

### When to Use Which Mode

| Use PLANNING when... | Use BUILDING when... |
|---------------------|---------------------|
| No plan exists | Plan exists and is current |
| Plan feels stale or wrong | Ready to implement |
| Made significant spec changes | Tasks are clearly defined |
| Confused about what's done | Tests are passing |

### Stopping RALPH
- `Ctrl+C` stops the loop immediately
- `git reset --hard HEAD~N` undoes N commits if needed
- Delete `IMPLEMENTATION_PLAN.md` to force fresh planning

### Safety Notes
- Each iteration commits changes (easy to revert)
- Brief pause between iterations allows Ctrl+C
- Max iterations flag prevents runaway loops
- All changes are local until pushed
