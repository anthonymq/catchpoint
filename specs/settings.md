# Settings Specification

## Overview

User preferences screen for customizing app behavior, managing data,
and accessing app information.

## User Story

**As a** user  
**I want to** customize my app settings  
**So that** the app works the way I prefer

## Screen Layout

```
┌─────────────────────────────────────┐
│ Settings                            │
├─────────────────────────────────────┤
│ PREFERENCES                         │
│ ┌─────────────────────────────────┐ │
│ │ Language           [System ▼]  │ │
│ │ Theme              [Light ▼]   │ │
│ │ Weight Unit        [lbs ▼]     │ │
│ │ Length Unit        [in ▼]      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ DATA                                │
│ ┌─────────────────────────────────┐ │
│ │ Export to CSV          [→]     │ │
│ │ Load Test Data         [→]     │ │
│ │ Clear All Data         [→]     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ PWA                                 │
│ ┌─────────────────────────────────┐ │
│ │ Install App            [→]     │ │
│ │ Storage Used       12.5 MB     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ABOUT                               │
│ ┌─────────────────────────────────┐ │
│ │ Version              1.0.0     │ │
│ │ Licenses             [→]       │ │
│ │ Privacy Policy       [→]       │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## Requirements

### Preferences Section

#### Language

- Options: System, English, Francais
- "System" follows device/browser language (`navigator.language`)
- Supports English (`en`) and French (`fr`)
- Changes apply immediately (no reload)
- Affects all UI text, date/number formatting
- See `i18n.md` for translation details

#### Theme

- Options: Light, Dark, System
- Persisted via Zustand + localStorage
- Changes apply immediately
- Respects `prefers-color-scheme` for System option
- No flash of wrong theme on page load (use blocking script)

#### Weight Unit

- Options: lbs, kg
- Affects all weight displays in app
- Persisted in settingsStore

#### Length Unit

- Options: in, cm
- Affects all length displays in app
- Persisted in settingsStore

### Data Section

#### Export to CSV

- Exports all catches to CSV file
- Uses Web Share API or downloads directly
- CSV columns: Date, Species, Weight, Length, Lat, Lon, Weather, Notes
- Filename: `catchpoint_export_YYYY-MM-DD.csv`

#### Load Test Data (Dev only)

- Loads 60 test catches for demo/testing
- Shows confirmation before loading
- Useful for testing charts and features
- Hide in production builds

#### Clear All Data

- Deletes ALL catches from IndexedDB
- Requires double confirmation
- Cannot be undone
- Clears both IndexedDB and store

### PWA Section

#### Install App

- Shows "Install" button if PWA installable
- Uses `beforeinstallprompt` event
- Hidden if already installed or not installable
- Shows instructions for iOS (Add to Home Screen)

#### Storage Used

- Shows IndexedDB storage usage
- Uses `navigator.storage.estimate()`
- Format: "12.5 MB of 100 MB"

### About Section

#### Version

- Show app version from package.json
- Format: "1.0.0"

#### Licenses

- Link to open source licenses page
- List dependencies and their licenses

#### Privacy Policy

- Link to privacy policy URL
- Opens in new tab

## Settings Store

```typescript
interface SettingsStore {
  // Preferences
  language: "en" | "fr" | "system";
  theme: "light" | "dark" | "system";
  weightUnit: "lbs" | "kg";
  lengthUnit: "in" | "cm";

  // Actions
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  setWeightUnit: (unit: WeightUnit) => void;
  setLengthUnit: (unit: LengthUnit) => void;

  // Persistence
  _hasHydrated: boolean;
}
```

Persistence via Zustand persist middleware:

```typescript
import { persist } from 'zustand/middleware';

persist(
  (set) => ({...}),
  {
    name: 'settings-storage',
    storage: {
      getItem: (name) => {
        const str = localStorage.getItem(name);
        return str ? JSON.parse(str) : null;
      },
      setItem: (name, value) => {
        localStorage.setItem(name, JSON.stringify(value));
      },
      removeItem: (name) => localStorage.removeItem(name),
    },
  }
)
```

## Theme Implementation

### Preventing Flash (Critical for UX)

Add blocking script in `<head>` before app loads:

```html
<script>
  (function () {
    const stored = localStorage.getItem("settings-storage");
    const settings = stored ? JSON.parse(stored) : {};
    const theme = settings.state?.theme || "system";

    let resolved = theme;
    if (theme === "system") {
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }

    document.documentElement.setAttribute("data-theme", resolved);
    document.documentElement.classList.add(resolved);
  })();
</script>
```

## Unit Conversion

Utility functions in `src/utils/`:

```typescript
// Weight
const convertWeight = (value: number, from: 'lbs' | 'kg', to: 'lbs' | 'kg') => {...}
const formatWeight = (value: number, unit: 'lbs' | 'kg') => `${value.toFixed(1)} ${unit}`

// Length
const convertLength = (value: number, from: 'in' | 'cm', to: 'in' | 'cm') => {...}
const formatLength = (value: number, unit: 'in' | 'cm') => `${value.toFixed(1)} ${unit}`
```

## CSV Export

Implementation in `src/services/export.ts`:

```typescript
export async function exportCatchesToCSV(): Promise<void> {
  const catches = await getAllCatches();

  const csv = [
    // Header row
    "Date,Species,Weight,Length,Latitude,Longitude,Weather,Notes",
    // Data rows
    ...catches.map(
      (c) =>
        `${c.timestamp},${c.species || ""},${c.weight || ""},${c.length || ""},` +
        `${c.latitude},${c.longitude},${c.weatherData?.description || ""},${c.notes || ""}`,
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const date = new Date().toISOString().split("T")[0];
  const filename = `catchpoint_export_${date}.csv`;

  // Try Web Share API first (mobile)
  if (
    navigator.share &&
    navigator.canShare({ files: [new File([blob], filename)] })
  ) {
    await navigator.share({
      files: [new File([blob], filename, { type: "text/csv" })],
      title: "Catchpoint Export",
    });
  } else {
    // Fallback to download
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
```

## Acceptance Criteria

- [ ] Theme changes apply immediately
- [ ] Theme persists across page loads
- [ ] No flash of wrong theme on startup
- [ ] Unit preferences affect all displays
- [ ] Unit preferences persist
- [ ] CSV export works (download or share)
- [ ] Test data loads correctly
- [ ] Clear data requires confirmation
- [ ] Clear data actually clears everything
- [ ] Version shows correct value
- [ ] Install prompt works on supported browsers
- [ ] Storage usage displays correctly

## Related Specs

- `i18n.md` - Internationalization details
- `statistics.md` - Uses unit preferences
- `catch-log.md` - Uses unit preferences
- `offline-sync.md` - Persistence mechanism
