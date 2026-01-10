# RALPH BUILD MODE - Catchpoint PWA

> **Mode**: BUILDING - Implement from plan, run tests, commit changes.
> **Goal**: Complete ONE task from `IMPLEMENTATION_PLAN.md` per iteration.

---

## Phase 0: Orient

### 0a. Study Specifications
Study `specs/*` to understand the application requirements.
These are your source of truth for what features should do.

Key specs:
- `specs/overview.md` - Project vision, tech stack, data model
- `specs/quick-capture.md` - Core capture flow
- `specs/offline-sync.md` - PWA architecture, Service Worker, IndexedDB

### 0b. Study Implementation Plan
Study `IMPLEMENTATION_PLAN.md` to understand current priorities.
Choose the MOST IMPORTANT uncompleted item to work on.

### 0c. Reference Codebase Structure
The PWA codebase is organized as:
- **Pages**: `src/pages/` (Home, Map, Log, Stats, Settings, CatchDetail)
- **Components**: `src/components/` (shared UI components)
- **State**: `src/stores/` (Zustand stores)
- **Database**: `src/db/` (Dexie.js schema and operations)
- **Services**: `src/services/` (weather, sync, export)
- **Hooks**: `src/hooks/` (useLocation, useNetworkStatus, useTheme)
- **Styles**: `src/styles/` (CSS files)
- **PWA**: `public/` (manifest.json, icons, sw.js)
- **E2E tests**: `e2e/*.spec.ts` (Playwright)
- **Config**: `vite.config.ts`, `tsconfig.json`

---

## Phase 1: Implement

### 1. Select Task
From `IMPLEMENTATION_PLAN.md`, choose the **MOST IMPORTANT** uncompleted item.
Focus on ONE task per iteration - do it completely, not partially.

### 2. Verify Before Changing
Before making ANY changes:
- **Search first** - Do NOT assume a feature is not implemented
- Use grep/glob to verify the current state
- Check for similar patterns already in the codebase
- Understand how existing code handles similar cases

### 3. Implement the Functionality
When implementing:
- Follow patterns established in AGENTS.md
- Use existing components/utilities from `src/`
- Maintain consistency with existing code style
- Implement COMPLETELY - no placeholders, no stubs, no "TODO: finish later"
- Use CSS variables for theming
- Ensure responsive design (mobile-first)

---

## Phase 2: Validate

### 4. Run Validation
After implementing, validate your changes:

```bash
# Type checking (ALWAYS run)
npx tsc --noEmit

# Build check
npm run build

# E2E tests (if browser available)
npm run test:e2e

# Specific test
npx playwright test e2e/[test-name].spec.ts
```

If tests fail due to your changes, FIX them before proceeding.

### 5. Add Missing Functionality
If functionality required by specs is missing, add it as part of this task.
Do not leave gaps for "future work" within a single task scope.

---

## Phase 3: Update & Commit

### 6. Update Implementation Plan
When you discover issues during implementation:
- Add new items found to `IMPLEMENTATION_PLAN.md`
- Note any bugs or edge cases discovered
- When task is complete, mark it done: `- [x] Task (completed)`
- Periodically clean out completed items if list gets long

### 7. Commit Changes
When validation passes:

```bash
# Update plan first
# (edit IMPLEMENTATION_PLAN.md to mark task complete)

# Stage all changes
git add -A

# Commit with descriptive message
git commit -m "feat: [description of what was implemented]"
# or: fix: / refactor: / test: / docs: as appropriate

# Push changes
git push
```

### 8. Update Operational Knowledge
If you learned something new about running the app:
- Update `AGENTS.md` with the new knowledge
- Keep it brief and operational (not progress notes)
- Progress notes belong in `IMPLEMENTATION_PLAN.md`

---

## GUARDRAILS (Higher number = More critical)

### 99999. Capture the Why
When authoring documentation or comments, capture the **WHY** - not just the what.
Tests and implementation decisions need rationale.

### 999999. Single Sources of Truth
No migrations, no adapters, no duplicate implementations.
If tests unrelated to your work fail, resolve them as part of this increment.

### 9999999. Keep Plan Current
Keep `IMPLEMENTATION_PLAN.md` current with learnings.
Future iterations depend on this to avoid duplicating efforts.
Update especially after finishing your task.

### 99999999. Update Operational Knowledge
When you learn something new about running the application:
- Update `AGENTS.md` but keep it brief
- Example: if you run commands multiple times before finding the correct one, document it

### 999999999. Document or Fix Bugs
For any bugs you notice (even unrelated to current work):
- Either fix them now, OR
- Document them in `IMPLEMENTATION_PLAN.md` for future work

### 9999999999. Complete Implementation
Implement functionality COMPLETELY.
Placeholders and stubs waste time redoing work later.
A task is not done until it fully works.

### 99999999999. Clean the Plan
When `IMPLEMENTATION_PLAN.md` becomes large:
- Remove completed items older than a week
- Archive if needed, but keep the active list manageable

### 999999999999. Keep AGENTS.md Lean
IMPORTANT: Keep `AGENTS.md` operational only.
- Status updates and progress notes belong in `IMPLEMENTATION_PLAN.md`
- A bloated AGENTS.md pollutes every future loop's context

---

## PWA-SPECIFIC RULES

### Offline First
- All data operations use IndexedDB (Dexie.js)
- Never block UI waiting for network
- Service Worker caches app shell

### Theming
- Use CSS custom properties (variables)
- Theme script in `<head>` prevents flash
- Respect `prefers-color-scheme` for system theme

### Responsive Design
- Mobile-first CSS
- Breakpoints: 480px (sm), 768px (md), 1024px (lg)
- Touch-friendly targets (min 44x44px)

### PWA Requirements
- Manifest with icons (192, 512, maskable)
- Service Worker with Workbox
- Works offline for all core features
- Installable on supported browsers

### Development Commands
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run typecheck

# Run E2E tests
npm run test:e2e
```

### Database Changes
If modifying IndexedDB schema:
1. Edit `src/db/index.ts`
2. Increment Dexie version number
3. Add upgrade function if needed

---

## OUTPUT

After completing your task:
1. Code changes committed and pushed
2. `IMPLEMENTATION_PLAN.md` updated (task marked complete, any new discoveries added)
3. `AGENTS.md` updated if operational knowledge gained
4. Brief summary of what was accomplished
