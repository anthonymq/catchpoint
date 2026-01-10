# Catch Log Specification

## Overview
The catch log is the historical record of all catches. Users can browse, filter, 
search, and manage their fishing history.

## User Story
**As a** fisher  
**I want to** browse my catch history  
**So that** I can track my progress and remember great fishing days

## Screen Layout

### Header
- Screen title: "Catch Log"
- Filter button (top right)
- Sort toggle (optional)

### List View
- Scrollable list of catch cards
- Pull-to-refresh gesture (touch devices) or refresh button
- Empty state when no catches

### Catch Card (List Item)

Each card shows:
```
┌─────────────────────────────────────┐
│ [Photo]  Species Name               │
│          Weight: X.X lbs            │
│          Date: Jan 10, 2026         │
│          Location: Lake Merced      │
│                          [Actions]  │
└─────────────────────────────────────┘
```

**Actions**:
- Edit button: Navigate to detail/edit view
- Delete button: Delete with confirmation
- On mobile touch: Swipe gestures (optional enhancement)
- Tap/Click: View detail

## Requirements

### List Functionality

| Feature | Description |
|---------|-------------|
| Virtual scrolling | Efficiently render large lists |
| Pull-to-refresh | Touch gesture or refresh button |
| Action buttons | Delete and edit actions |
| Empty state | Friendly message when no catches |
| Loading state | Skeleton or spinner |

### Filtering

Filter modal/dropdown with options:
- **Date range**: Custom date picker or presets (7D, 30D, 1Y)
- **Species**: Multi-select from caught species
- **Location**: Radius from point or named locations
- **Has photo**: Yes/No/All
- **Weather**: Sunny, Cloudy, Rainy, etc.

Filters persist during session (sessionStorage) but reset on page refresh.

### Sorting

Options (default: newest first):
- Date (newest/oldest)
- Weight (heaviest/lightest)
- Species (A-Z/Z-A)

### Search (Optional Enhancement)

- Search by species name
- Search by notes content
- Search by location name

## Swipe Gestures (Touch Devices)

Use native touch events or a library like `use-gesture`:

```typescript
// Swipe thresholds
const SWIPE_THRESHOLD = 80; // pixels to trigger action
const SWIPE_VELOCITY = 0.3; // velocity threshold

// Visual feedback
- Partial swipe: show action preview
- Full swipe: execute action
- Release before threshold: snap back
```

### Delete Flow
1. Swipe left past threshold OR click delete button
2. Show red delete background/button
3. Show confirmation dialog
4. Confirm: animate out + delete from store
5. Cancel: snap back

### Edit Flow
1. Swipe right past threshold OR click edit button
2. Show blue edit background/button
3. Navigate to catch detail screen

## Empty State

When no catches exist:
```
┌─────────────────────────────────────┐
│                                     │
│         🎣                          │
│                                     │
│    No catches yet!                  │
│                                     │
│    Tap "FISH ON!" to log           │
│    your first catch.                │
│                                     │
│    [Load Test Data] (dev only)      │
│                                     │
└─────────────────────────────────────┘
```

## Data Display

### Date Formatting
- Today: "Today at 2:30 PM"
- This week: "Monday at 2:30 PM"
- This year: "Jan 10 at 2:30 PM"
- Older: "Jan 10, 2025"

Use `Intl.DateTimeFormat` or a library like `date-fns`.

### Weight/Length
- Respect user unit preference (lbs/kg, in/cm)
- Format: "5.2 lbs" or "2.4 kg"
- Show "—" if not recorded

### Location
- Reverse geocode to place name if available (using Nominatim or Mapbox Geocoding)
- Fallback to coordinates: "37.73°N, 122.45°W"
- Show "Location unknown" if missing

## Acceptance Criteria

- [ ] List displays all catches from IndexedDB
- [ ] Pull-to-refresh works and triggers sync
- [ ] Delete with confirmation works
- [ ] Edit navigates to detail screen
- [ ] Filter modal filters the list
- [ ] Sort changes list order
- [ ] Empty state shown when no catches
- [ ] Smooth 60fps scrolling
- [ ] Works offline

## Performance Considerations

- Use virtualized list (react-virtual, react-window, or TanStack Virtual)
- Lazy load images with placeholder
- Limit initial render to visible + buffer
- Use CSS `content-visibility: auto` for off-screen items

## Related Specs
- `catch-detail.md` - Detail/edit screen
- `quick-capture.md` - How catches are created
