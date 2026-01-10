# Quick Capture Specification

## Overview
One-tap catch capture with automatic GPS and weather data collection.
The primary user interaction - must be fast, reliable, and work offline.

## User Story
**As a** fisher  
**I want to** log a catch with a single tap  
**So that** I don't miss the action or fumble with my phone while fish are biting

## Requirements

### Quick Capture Button

**Location**: Prominent position on home screen (floating action button or hero button)  
**Visual**: Large "FISH ON!" button with fishing icon  
**Behavior**:
- Single tap/click triggers capture
- Visual feedback within 300ms (animation, vibration if supported)
- Success confirmation before background work completes

### Data Collection (Automatic)

| Field | Source | Required | Notes |
|-------|--------|----------|-------|
| `id` | UUID generation | Yes | Auto-generated |
| `timestamp` | Browser clock | Yes | ISO 8601 format |
| `latitude` | Geolocation API | Yes* | Fallback to cached |
| `longitude` | Geolocation API | Yes* | Fallback to cached |
| `weatherData` | OpenWeatherMap | No | Background fetch |

*Location uses fallback strategy if fresh GPS unavailable

### Location Strategy

1. **Try fresh GPS** (8 second timeout) via `navigator.geolocation`
2. **Fallback to cached location** from localStorage if timeout/error
3. **Async refresh** after capture completes
4. **Never block UI** waiting for location

```
User taps → Immediate feedback → Background: [GPS, Weather, Save]
              ↓
         Success animation
         (within 300ms)
```

### Weather Integration

- Fetch from OpenWeatherMap Current Weather API
- **Never blocks UI** - queue for background sync
- Store raw JSON in `weatherData` field
- Retry on network restore (via Service Worker sync)
- Flag `pendingWeatherFetch: true` if fetch deferred

### Catch Fields (Full Schema)

| Field | Type | Required | Default |
|-------|------|----------|---------|
| `id` | UUID | Yes | Auto-generated |
| `timestamp` | DateTime | Yes | Current time |
| `latitude` | Float | Yes | From GPS/cache |
| `longitude` | Float | Yes | From GPS/cache |
| `species` | String | No | null |
| `weight` | Float | No | null |
| `length` | Float | No | null |
| `photoUri` | String | No | null (base64 or blob URL) |
| `notes` | String | No | null |
| `weatherData` | JSON | No | null |
| `pendingWeatherFetch` | Boolean | Yes | true |
| `createdAt` | DateTime | Yes | Auto |
| `updatedAt` | DateTime | Yes | Auto |

## Optimistic UI Pattern

The capture flow MUST follow optimistic UI principles:

1. **Immediate Response**: Show success within 300ms of tap
2. **Background Processing**: 
   - Save to IndexedDB
   - Fetch weather (if online)
   - Store photo blob
3. **Reactive Updates**: UI updates from Zustand store changes
4. **Error Recovery**: If save fails, show error and offer retry

```typescript
// Conceptual flow
const capture = async () => {
  // 1. Immediate UI feedback
  showSuccessAnimation();
  vibrateIfSupported(); // navigator.vibrate([50])
  
  // 2. Get location (non-blocking)
  const location = await getLocationWithFallback();
  
  // 3. Optimistic insert
  const catch = {
    id: crypto.randomUUID(),
    timestamp: new Date(),
    ...location,
    pendingWeatherFetch: true,
  };
  
  // 4. Save and sync (background)
  await saveCatch(catch); // IndexedDB
  syncWeatherIfOnline(catch.id);
};
```

## Acceptance Criteria

- [ ] Capture UI feedback completes in <300ms
- [ ] Works fully offline (saves to IndexedDB)
- [ ] Location fallback works when GPS unavailable
- [ ] Weather syncs automatically when online
- [ ] Vibration feedback on capture (if device supports Vibration API)
- [ ] Success animation is smooth (60fps)
- [ ] Error state shown if save fails
- [ ] New catch appears in log immediately

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| No GPS, no cached location | Use (0,0) with flag, prompt for location later |
| Network timeout during weather | Mark pending, retry on network restore |
| Rapid successive captures | Queue and process in order |
| App backgrounded during save | Complete via Service Worker |
| Low storage (IndexedDB quota) | Warn user, still attempt save |
| Geolocation permission denied | Show permission prompt, use cached or manual entry |

## PWA-Specific Notes

### Geolocation API
```typescript
const getLocation = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 60000, // Accept cached position up to 1 min old
    });
  });
};
```

### Vibration Feedback
```typescript
const hapticFeedback = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate(50); // 50ms pulse
  }
};
```

## Related Specs
- `offline-sync.md` - Background sync behavior
- `catch-log.md` - How catches appear after capture
