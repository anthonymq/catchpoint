# RALPH PLANNING MODE - Catchpoint PWA

> **Mode**: PLANNING - Gap analysis only. Do NOT implement anything.
> **Goal**: Create/update `IMPLEMENTATION_PLAN.md` with prioritized tasks.

---

## Phase 0: Orient

### 0a. Study Specifications
Study `specs/*` to learn the application specifications and requirements.
Each spec file represents a topic of concern (JTBD - Job To Be Done):
- `specs/overview.md` - Project vision and architecture
- `specs/quick-capture.md` - One-tap catch logging
- `specs/catch-log.md` - Browsing catch history
- `specs/map-view.md` - Mapbox map with markers
- `specs/statistics.md` - Charts and analytics
- `specs/settings.md` - User preferences and data management
- `specs/offline-sync.md` - PWA, Service Worker, IndexedDB

### 0b. Study Current Plan
Study `IMPLEMENTATION_PLAN.md` (if present) to understand the plan so far.
The plan may be incorrect or outdated - verify against current code state.

### 0c. Study Shared Code
Study `src/` to understand the codebase structure:
- `src/pages/` - Route pages (Home, Map, Log, Stats, Settings, CatchDetail)
- `src/components/` - UI components (QuickCaptureButton, CatchCard, FilterModal, BottomNav)
- `src/stores/` - Zustand state management (catchStore, settingsStore)
- `src/services/` - Business logic (weather, sync, export)
- `src/hooks/` - Custom React hooks (useLocation, useNetworkStatus, useTheme)
- `src/db/` - Dexie.js IndexedDB schema and operations
- `src/utils/` - Utility functions (statistics, format)
- `src/data/` - Static data (species, testCatches)
- `src/styles/` - CSS files

### 0d. Study App Entry Points
Study key files:
- `src/main.tsx` - App entry point
- `src/App.tsx` - Router and layout
- `public/manifest.json` - PWA manifest
- `index.html` - HTML shell with theme script

---

## Phase 1: Gap Analysis

### 1. Compare Code Against Specs

Use parallel searches to find gaps between specifications and implementation:

**Search for incomplete work:**
- TODO comments: `// TODO`, `/* TODO */`
- FIXME markers: `// FIXME`, `/* FIXME */`
- Placeholder implementations: `throw new Error('Not implemented')`
- Stub functions: empty function bodies, mock returns

**Search for missing tests:**
- Check `e2e/*.spec.ts` for coverage gaps
- Find features without corresponding tests
- Identify skipped or flaky tests

**Check for pattern inconsistencies:**
- Compare against AGENTS.md conventions
- Look for anti-patterns (blocking UI, synchronous storage access)
- Find code that doesn't match established patterns

**Identify spec vs implementation gaps:**
- For each `specs/*.md`, verify the feature is fully implemented
- Note any acceptance criteria not met
- Flag missing edge case handling

### 2. Create/Update Implementation Plan

Create or update `IMPLEMENTATION_PLAN.md` as a prioritized bullet-point list:

```markdown
# Implementation Plan

## High Priority
- [ ] [Feature/Fix]: Description - estimated effort (S/M/L)
  - Details about what needs to be done
  - Acceptance criteria from spec

## Medium Priority
- [ ] ...

## Low Priority
- [ ] ...

## Discovered Issues
- [ ] Bug: Description
- [ ] Tech Debt: Description

## Completed
- [x] Item that was completed (date)
```

**Prioritization criteria:**
1. **Project setup** - Vite, React, dependencies, PWA manifest
2. **Core infrastructure** - IndexedDB, Zustand stores, routing
3. **Core features** - Quick Capture, Catch Log, basic UI
4. **Secondary features** - Map, Statistics, Settings
5. **PWA polish** - Service Worker, install prompt, offline UX
6. **Testing** - E2E tests, unit tests
7. **Tech debt** - Refactoring, cleanup, optimization

---

## CRITICAL CONSTRAINTS

### DO NOT:
- Implement ANY code changes
- Create new source files
- Modify existing source code
- Run build or test commands (except for verification)
- Make git commits

### DO:
- Search thoroughly before claiming something is missing
- Verify current state with grep/glob before adding to plan
- Update `IMPLEMENTATION_PLAN.md` only
- Create missing `specs/*.md` if a topic needs specification

### CATCHPOINT PWA CONVENTIONS (from AGENTS.md):
- **Offline-first**: IndexedDB is source of truth
- **Optimistic UI**: Show success immediately, background the work
- **Location**: Try fresh (8s timeout) → fallback cached → refresh async
- **Weather**: Never block UI, queue for background sync
- **Theming**: CSS variables, no flash on page load
- **Mobile-first**: Design for touch, enhance for desktop

---

## TECH STACK REFERENCE

| Layer | Technology |
|-------|------------|
| Framework | React 18 + Vite |
| Router | React Router v6 |
| State | Zustand |
| Database | Dexie.js (IndexedDB) |
| Maps | Mapbox GL JS / react-map-gl |
| Charts | Recharts |
| PWA | Workbox / vite-plugin-pwa |
| Styling | Vanilla CSS with variables |
| Testing | Vitest + Playwright |

---

## ULTIMATE GOAL

Build a polished offline-first PWA fishing log with:
- **One-tap catch capture** with auto GPS + weather
- **Beautiful statistics** and charts
- **Interactive map** with catch markers
- **Full offline support** via Service Worker
- **PWA installable** on mobile and desktop
- **Comprehensive E2E tests**

If an element is missing from specs, search first to confirm it doesn't exist in code, then author the specification at `specs/FILENAME.md`.

---

## OUTPUT

After analysis, your output should be:
1. Updated `IMPLEMENTATION_PLAN.md` with prioritized tasks
2. Any new `specs/*.md` files for undocumented features
3. Summary of findings (what was analyzed, key gaps found)
